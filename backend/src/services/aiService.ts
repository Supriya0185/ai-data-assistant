/**
 * aiService.ts
 * ─────────────────────────────────────────────────────────────
 * Unified AI provider — supports Groq (default/free) and Claude.
 * Switch by setting AI_PROVIDER=groq|claude in .env
 *
 * Groq models:  llama-3.3-70b-versatile (best), llama-3.1-8b-instant (fast)
 * Claude models: claude-sonnet-4-6 (best), claude-haiku-4-5-20251001 (fast)
 */

import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, DatasetMeta, QueryResult, ChartSuggestion } from '../types';
import { logger } from './logger';

// ── Provider selection ────────────────────────────────────────
type Provider = 'groq' | 'claude';

const PROVIDER: Provider =
  (process.env['AI_PROVIDER'] as Provider) || 'groq';

// ── Clients (lazy-init) ───────────────────────────────────────
let groqClient: Groq | null = null;
let claudeClient: Anthropic | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    if (!process.env['GROQ_API_KEY']) {
      throw new Error('GROQ_API_KEY is not set in .env');
    }
    groqClient = new Groq({ apiKey: process.env['GROQ_API_KEY'] });
  }
  return groqClient;
}

function getClaude(): Anthropic {
  if (!claudeClient) {
    if (!process.env['ANTHROPIC_API_KEY']) {
      throw new Error('ANTHROPIC_API_KEY is not set in .env');
    }
    claudeClient = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });
  }
  return claudeClient;
}

// ── Model names ───────────────────────────────────────────────
const GROQ_MODEL =
  process.env['GROQ_MODEL'] || 'llama-3.3-70b-versatile';
const CLAUDE_MODEL =
  process.env['CLAUDE_MODEL'] || 'claude-sonnet-4-6';

// ── System prompt ─────────────────────────────────────────────
const BASE_SYSTEM = `You are DataPilot, an expert AI data analyst.

Rules you MUST follow:
1. Only generate SELECT SQL — never DROP, DELETE, UPDATE, INSERT, ALTER, CREATE.
2. Always wrap SQL in: <sql>SELECT ...</sql>
3. When a chart would help, add: <chart>{"type":"bar|line|pie|scatter|area","title":"...","xAxis":"col","yAxis":"col"}</chart>
4. Quote column names with double-quotes: SELECT "col" FROM "table"
5. Explain findings in plain English after the SQL block.
6. If no dataset is loaded, ask the user to upload a file.`;

// ── Core chat completion (provider-agnostic) ──────────────────

async function complete(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 2048
): Promise<string> {
  if (PROVIDER === 'groq') {
    const resp = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });
    return resp.choices[0]?.message?.content ?? '';
  } else {
    const resp = await getClaude().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });
    return resp.content[0]?.type === 'text' ? resp.content[0].text : '';
  }
}

// ── Public API ────────────────────────────────────────────────

export class AIService {
  static get providerName(): string {
    return PROVIDER === 'groq'
      ? `Groq (${GROQ_MODEL})`
      : `Claude (${CLAUDE_MODEL})`;
  }

  /**
   * Main chat — handles general questions + SQL generation
   */
  static async chat(
    userMessage: string,
    history: ChatMessage[],
    sessionContext: string,
    dataset?: DatasetMeta
  ): Promise<{ message: string; sql?: string; chart?: ChartSuggestion }> {
    const system = buildSystemPrompt(sessionContext, dataset);

    const msgs = [
      ...history.slice(-8).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    logger.debug(`[${PROVIDER}] chat: "${userMessage.slice(0, 80)}"`);
    const raw = await complete(system, msgs);
    return parseResponse(raw);
  }

  /**
   * Generate SQL from a natural language question
   */
  static async generateSQL(
    question: string,
    dataset: DatasetMeta,
    _sessionContext: string
  ): Promise<string> {
    const prompt = `Generate a DuckDB SQL SELECT query to answer: "${question}"

Table: "${dataset.tableName}"
Columns: ${dataset.schema.map((c) => `"${c.name}" (${c.type})`).join(', ')}
Total rows: ${dataset.rowCount}

Rules:
- SELECT only — no mutations
- Use double-quotes around column and table names
- Wrap result in <sql>...</sql>
- Add LIMIT 100 unless counting/aggregating`;

    const raw = await complete(BASE_SYSTEM, [{ role: 'user', content: prompt }], 512);
    return extractTag(raw, 'sql') ?? raw.trim();
  }

  /**
   * Summarize query results in plain English + suggest chart
   */
  static async summarizeResults(
    question: string,
    result: QueryResult,
    _dataset: DatasetMeta
  ): Promise<{ summary: string; chart?: ChartSuggestion }> {
    const preview = result.rows.slice(0, 15);
    const prompt = `User asked: "${question}"
SQL: ${result.sql}
Rows returned: ${result.rowCount}
Sample data:
${JSON.stringify(preview, null, 2)}

In 2-3 sentences, summarize the key finding.
If a chart helps, add: <chart>{"type":"bar|line|pie","title":"...","xAxis":"colName","yAxis":"colName"}</chart>`;

    const raw = await complete(BASE_SYSTEM, [{ role: 'user', content: prompt }], 512);
    const chartJson = extractTag(raw, 'chart');
    const summary = raw.replace(/<chart>.*?<\/chart>/gs, '').trim();

    let chart: ChartSuggestion | undefined;
    if (chartJson) {
      try {
        const p = JSON.parse(chartJson) as Partial<ChartSuggestion>;
        chart = {
          type: (p.type as ChartSuggestion['type']) || 'bar',
          title: p.title || 'Results',
          xAxis: p.xAxis,
          yAxis: p.yAxis,
          data: result.rows.slice(0, 100),
        };
      } catch { /* ignore */ }
    }

    return { summary, chart };
  }
}

// ── Helpers ───────────────────────────────────────────────────

function buildSystemPrompt(context: string, dataset?: DatasetMeta): string {
  let s = BASE_SYSTEM;
  if (context) s += `\n\n## Session\n${context}`;
  if (dataset) {
    s += `\n\n## Active Dataset: ${dataset.name}
Table: "${dataset.tableName}"  |  Rows: ${dataset.rowCount}  |  Quality: ${dataset.qualityScore}/100
Columns:
${dataset.schema.map((c) => `  - "${c.name}": ${c.type}${c.nullable ? ' (nullable)' : ''}`).join('\n')}`;
  }
  return s;
}

function parseResponse(text: string): {
  message: string;
  sql?: string;
  chart?: ChartSuggestion;
} {
  const sql = extractTag(text, 'sql') ?? undefined;
  const chartJson = extractTag(text, 'chart');

  // Replace <sql> with fenced code block for display
  const message = text
    .replace(/<sql>(.*?)<\/sql>/gs, (_m, code: string) =>
      `\n\`\`\`sql\n${code.trim()}\n\`\`\``
    )
    .replace(/<chart>.*?<\/chart>/gs, '')
    .trim();

  let chart: ChartSuggestion | undefined;
  if (chartJson) {
    try {
      const p = JSON.parse(chartJson) as Partial<ChartSuggestion>;
      chart = {
        type: (p.type as ChartSuggestion['type']) || 'bar',
        title: p.title || 'Chart',
        xAxis: p.xAxis,
        yAxis: p.yAxis,
        data: [],
      };
    } catch { /* ignore */ }
  }

  return { message, sql, chart };
}

function extractTag(text: string, tag: string): string | null {
  const m = text.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's'));
  return m ? m[1]!.trim() : null;
}
