import { Router, Request, Response } from 'express';
import { SessionService } from '../services/sessionService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── POST /mcp/connect ─────────────────────────────────────────
// Phase 3 stub — returns success with placeholder
router.post(
  '/connect',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, name } = req.body as { type?: string; name?: string };
    const sessionId = req.headers['x-session-id'] as string;

    if (!type || !name) {
      throw new AppError('type and name are required', 400, 'VALIDATION_ERROR');
    }

    const validTypes = ['github', 'jira', 'slack', 'database', 'custom'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid type. Supported: ${validTypes.join(', ')}`, 400, 'INVALID_MCP_TYPE');
    }

    const session = SessionService.getOrCreate(sessionId);
    const conn = {
      id: uuidv4(),
      name,
      type: type as 'github' | 'jira' | 'slack' | 'database' | 'custom',
      connected: true,
      connectedAt: new Date(),
    };

    SessionService.addMCPConnection(session.id, conn);

    res.json({
      message: `MCP connection "${name}" (${type}) registered. Full connector coming in Phase 3.`,
      connection: conn,
      sessionId: session.id,
    });
  })
);

// ── GET /mcp/list ─────────────────────────────────────────────
router.get(
  '/list',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    const session = SessionService.get(sessionId);

    res.json({
      connections: session?.mcpConnections ?? [],
      sessionId,
    });
  })
);

export default router;
