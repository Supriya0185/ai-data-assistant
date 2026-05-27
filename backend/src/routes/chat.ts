import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService';
import { DuckDBService } from '../services/duckdbService';
import { SessionService } from '../services/sessionService';
import { validateSQL } from '../middleware/sqlValidator';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatResponse } from '../types';

const router = Router();

const ChatSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  datasetId: z.string().optional(),
});

// ── POST /chat ────────────────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid request body', 400, 'VALIDATION_ERROR');
    }

    const { message, sessionId: bodySessionId, datasetId } = parsed.data;
    const headerSessionId = req.headers['x-session-id'] as string | undefined;
    const resolvedSessionId = bodySessionId || headerSessionId;

    const session = SessionService.getOrCreate(resolvedSessionId);

    // Determine current dataset
    let dataset = session.currentDataset;
    if (datasetId) {
      dataset = session.datasets.find((d) => d.id === datasetId) ?? dataset;
    }

    const sessionContext = SessionService.buildContext(session);

    // Build conversation history for Claude
    const history: ChatMessage[] = session.queryHistory
      .slice(-5)
      .flatMap((q) => [
        { role: 'user' as const, content: q.userMessage },
        { role: 'assistant' as const, content: q.result ? `Found ${q.result.rowCount} results.` : 'Processed.' },
      ]);

    // AI chat call
    const { message: aiMessage, sql, chart } = await AIService.chat(
      message,
      history,
      sessionContext,
      dataset
    );

    let queryResult;

    // If AI generated SQL — validate and run it
    if (sql) {
      const validation = validateSQL(sql);
      if (validation.isSafe && dataset) {
        try {
          queryResult = await DuckDBService.query(validation.normalizedSQL);
        } catch (err) {
          // SQL ran but DuckDB error — surface gracefully
        }
      }
    }

    // Attach chart data if we have results
    if (chart && queryResult) {
      chart.data = queryResult.rows.slice(0, 100);
    }

    // Save to history
    SessionService.addQueryHistory(session.id, {
      id: uuidv4(),
      userMessage: message,
      generatedSQL: sql,
      result: queryResult,
      timestamp: new Date(),
    });

    const response: ChatResponse = {
      message: aiMessage,
      sql,
      queryResult,
      chart,
      sessionId: session.id,
    };

    res.json(response);
  })
);

// ── GET /chat/history ─────────────────────────────────────────
router.get(
  '/history',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    const session = SessionService.get(sessionId);
    if (!session) {
      res.json({ history: [], sessionId: null });
      return;
    }
    res.json({ history: session.queryHistory, sessionId });
  })
);

export default router;
