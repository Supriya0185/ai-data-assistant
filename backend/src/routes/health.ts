import { Router, Request, Response } from 'express';
import { DuckDBService } from '../services/duckdbService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Quick DuckDB ping
    const result = await DuckDBService.query('SELECT 1 AS ok');
    const duckdbOk = result.rows[0]?.['ok'] === 1 || result.rows[0]?.['ok'] === 1n;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        duckdb: duckdbOk ? 'ok' : 'error',
        claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing_key',
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'degraded',
      error: String(err),
    });
  }
});

export default router;
