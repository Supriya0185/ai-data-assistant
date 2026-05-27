import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService';
import { DuckDBService } from '../services/duckdbService';
import { SessionService } from '../services/sessionService';
import { validateSQL } from '../middleware/sqlValidator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const QuerySchema = z.object({
  question: z.string().min(1).max(2000),
  datasetId: z.string().optional(),
});

// ── POST /query — NLP → SQL → DuckDB → Summary ───────────────
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = QuerySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid request body', 400, 'VALIDATION_ERROR');
    }

    const { question, datasetId } = parsed.data;
    const sessionId = req.headers['x-session-id'] as string;
    const session = SessionService.get(sessionId);

    if (!session) throw new AppError('Session not found — upload a dataset first', 404, 'NO_SESSION');

    // Determine which dataset to query
    let dataset = session.currentDataset;
    if (datasetId) {
      dataset = session.datasets.find((d) => d.id === datasetId);
    }
    if (!dataset) throw new AppError('No dataset loaded — upload a CSV file first', 400, 'NO_DATASET');

    const sessionContext = SessionService.buildContext(session);

    // Step 1: Generate SQL
    const sql = await AIService.generateSQL(question, dataset, sessionContext);

    // Step 2: Validate SQL safety
    const validation = validateSQL(sql);
    if (!validation.isSafe) {
      throw new AppError(
        `Generated SQL failed safety check: ${validation.errors.join('; ')}`,
        400,
        'UNSAFE_SQL'
      );
    }

    // Step 3: Execute against DuckDB
    const queryResult = await DuckDBService.query(validation.normalizedSQL);

    // Step 4: Summarize results
    const { summary, chart } = await AIService.summarizeResults(
      question,
      queryResult,
      dataset
    );

    // Step 5: Save to session history
    SessionService.addQueryHistory(sessionId, {
      id: uuidv4(),
      userMessage: question,
      generatedSQL: sql,
      result: queryResult,
      timestamp: new Date(),
    });

    res.json({
      question,
      sql: validation.normalizedSQL,
      sqlWarnings: validation.warnings,
      result: queryResult,
      summary,
      chart,
      sessionId,
    });
  })
);

// ── POST /query/sql — Execute raw SQL (with safety check) ─────
router.post(
  '/sql',
  asyncHandler(async (req: Request, res: Response) => {
    const { sql } = req.body as { sql?: string };
    if (!sql) throw new AppError('sql field is required', 400, 'NO_SQL');

    const validation = validateSQL(sql);
    if (!validation.isSafe) {
      throw new AppError(
        `SQL failed safety check: ${validation.errors.join('; ')}`,
        400,
        'UNSAFE_SQL'
      );
    }

    const result = await DuckDBService.query(validation.normalizedSQL);
    res.json({ result, warnings: validation.warnings });
  })
);

export default router;
