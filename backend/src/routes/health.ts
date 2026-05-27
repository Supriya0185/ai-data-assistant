import { Router, Request, Response } from 'express';
import { DuckDBService } from '../services/duckdbService';
import { AIService } from '../services/aiService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await DuckDBService.query('SELECT 1 AS ok');
    const duckdbOk = Number(result.rows[0]?.['ok']) === 1;

    const provider = process.env['AI_PROVIDER'] || 'groq';
    const hasGroqKey = !!process.env['GROQ_API_KEY'];
    const hasClaudeKey = !!process.env['ANTHROPIC_API_KEY'];

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        duckdb: duckdbOk ? 'ok' : 'error',
        ai_provider: AIService.providerName,
        groq_key: hasGroqKey ? '✅ set' : '❌ missing',
        claude_key: hasClaudeKey ? '✅ set' : '❌ missing',
        active: provider,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'degraded', error: String(err) });
  }
});

export default router;
