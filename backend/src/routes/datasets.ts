import { Router, Request, Response, NextFunction } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import { handleCSV } from '../handlers/csvHandler';
import { SessionService } from '../services/sessionService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// ── POST /datasets/upload ─────────────────────────────────────
router.post(
  '/upload',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = (req.headers['x-session-id'] as string) || undefined;
    const session = SessionService.getOrCreate(sessionId);

    if (!req.files || Object.keys(req.files).length === 0) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const file = req.files['file'] as UploadedFile;
    if (!file) {
      throw new AppError('Field "file" is required', 400, 'NO_FILE_FIELD');
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'csv':
        const result = await handleCSV(file.data, file.name, session.id);
        res.json(result);
        break;

      default:
        throw new AppError(
          `File type ".${ext}" not supported yet. Currently supported: CSV`,
          400,
          'UNSUPPORTED_FILE_TYPE'
        );
    }
  })
);

// ── GET /datasets ─────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.json({ datasets: [], sessionId: null });
      return;
    }

    const session = SessionService.get(sessionId);
    if (!session) {
      res.json({ datasets: [], sessionId });
      return;
    }

    res.json({
      datasets: session.datasets,
      currentDataset: session.currentDataset,
      sessionId,
    });
  })
);

// ── GET /datasets/:id ─────────────────────────────────────────
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    const session = SessionService.get(sessionId);
    if (!session) throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');

    const dataset = session.datasets.find((d) => d.id === req.params['id']);
    if (!dataset) throw new AppError('Dataset not found', 404, 'DATASET_NOT_FOUND');

    res.json(dataset);
  })
);

export default router;
