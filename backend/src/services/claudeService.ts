import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, QueryResult, DatasetMeta, ChartSuggestion } from '../types';
import { logger } from './logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

// ── System Prompt ─────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are DataPilot, an expert AI data analyst assistant.

Your capabilities:
- Analyze CSV, Excel, PDF, and other data files
- Generate safe SQL queries (SELECT only) for DuckDB
- Explain data patterns, trends, and anomalies in plain English
- Suggest visualizations (charts) based on the data
- Help users understand data quality issues

Rules you MUST follow:
1. Only generate SELECT statements — NEVER DROP, DELETE, UPDATE, INSERT, ALTER, CREATE
2. Always use double-quotes around column names: SELECT "column_name" FROM "table"
3. When generating SQL, wrap it in a <sql></sql> tag
4. When suggesting a chart, provide JSON in <chart></chart> tag with format:
   {"type": "bar|line|pie|scatter|area", "title": "...", "xAxis": "colName", "yAxis": "colName"}
5. Always explain your SQL and findings in plain English
6. If the user asks about data that isn't loaded, ask them to upload a file first
7. Be concise but thorough in explanations`;

export class ClaudeService {
  /**
   * Main chat endpoint — handles NLP queries, SQL generation, analysis
   */
  static async chat(
    userMessage: string,
    history: ChatMessage[],
    sessionContext: string,
    datasetMeta?: DatasetMeta
  ): Promise<{
    message: string;
    sql?: string;
    chart?: ChartSuggestion;
  }> {
    const systemPrompt = buildSystemPrompt(sessionContext, datasetMeta);

    const messages = [
      ...history.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    logger.debug(`Claude request: "${userMessage.slice(0, 80)}..."`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return parseClaudeResponse(rawText);
  }

  /**
   * Generate SQL from a natural language query
   */
  static async generateSQL(
    question: string,
    schema: DatasetMeta,
    sessionContext: string
  ): Promise<string> {
    const prompt = `Given this dataset:
Table: "${schema.tableName}"
Columns: ${schema.schema.map((c) => `${c.name} (${c.type})`).join(', ')}
Rows: ${schema.rowCount}

Generate a DuckDB SQL SELECT query to answer: "${question}"

Rules:
- Only SELECT — no DROP, DELETE, UPDATE, INSERT
- Quote column names with double quotes
- Return ONLY the SQL inside <sql></sql> tags`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const sql = extractTag(text, 'sql');
    return sql || text.trim();
  }

  /**
   * Summarize query results in plain English
   */
  static async summarizeResults(
    question: string,
    result: QueryResult,
    schema: DatasetMeta
  ): Promise<{ summary: string; chart?: ChartSuggestion }> {
    const previewRows = result.rows.slice(0, 20);
    const prompt = `The user asked: "${question}"

SQL executed: ${result.sql}
Rows returned: ${result.rowCount}
Data preview (first ${previewRows.length} rows):
${JSON.stringify(previewRows, null, 2)}

Please:
1. Summarize the findings in 2-3 sentences
2. If a chart would help, suggest one using <chart>{"type":"bar|line|pie|scatter","title":"...","xAxis":"colName","yAxis":"colName"}</chart>

Keep your response concise and data-driven.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const chartJson = extractTag(text, 'chart');
    const cleanText = text.replace(/<chart>.*?<\/chart>/gs, '').trim();

    let chart: ChartSuggestion | undefined;
    if (chartJson) {
      try {
        const parsed = JSON.parse(chartJson) as Partial<ChartSuggestion>;
        chart = {
          type: (parsed.type as ChartSuggestion['type']) || 'bar',
          title: parsed.title || 'Results',
          xAxis: parsed.xAxis,
          yAxis: parsed.yAxis,
          data: result.rows.slice(0, 100),
        };
      } catch {
        // ignore malformed chart JSON
      }
    }

    return { summary: cleanText, chart };
  }
}

// ── Helpers ───────────────────────────────────────────────────

function buildSystemPrompt(context: string, dataset?: DatasetMeta): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (context) {
    prompt += `\n\n## Current Session\n${context}`;
  }

  if (dataset) {
    prompt += `\n\n## Active Dataset: ${dataset.name}
Table name: "${dataset.tableName}"
Rows: ${dataset.rowCount}
Quality: ${dataset.qualityScore}/100
Schema:
${dataset.schema.map((c) => `  - "${c.name}": ${c.type}${c.nullable ? ' (nullable)' : ''}`).join('\n')}`;
  }

  return prompt;
}

function parseClaudeResponse(text: string): {
  message: string;
  sql?: string;
  chart?: ChartSuggestion;
} {
  const sql = extractTag(text, 'sql') || undefined;
  const chartJson = extractTag(text, 'chart');

  // Remove tags from visible message
  const message = text
    .replace(/<sql>.*?<\/sql>/gs, (match) => {
      // Keep SQL block visible but formatted
      const code = match.replace(/<\/?sql>/g, '').trim();
      return `\n\`\`\`sql\n${code}\n\`\`\``;
    })
    .replace(/<chart>.*?<\/chart>/gs, '')
    .trim();

  let chart: ChartSuggestion | undefined;
  if (chartJson) {
    try {
      const parsed = JSON.parse(chartJson) as Partial<ChartSuggestion>;
      chart = {
        type: (parsed.type as ChartSuggestion['type']) || 'bar',
        title: parsed.title || 'Chart',
        xAxis: parsed.xAxis,
        yAxis: parsed.yAxis,
        data: [],
      };
    } catch {
      // ignore
    }
  }

  return { message, sql, chart };
}

function extractTag(text: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
  const match = text.match(re);
  return match ? match[1].trim() : null;
}
