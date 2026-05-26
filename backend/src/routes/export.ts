import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { SessionService } from '../services/sessionService';
import { DuckDBService } from '../services/duckdbService';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// ── POST /export/pdf ──────────────────────────────────────────
router.post(
  '/pdf',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.headers['x-session-id'] as string;
    const session = SessionService.get(sessionId);
    if (!session) throw new AppError('Session not found', 404, 'NO_SESSION');

    const dataset = session.currentDataset;
    if (!dataset) throw new AppError('No dataset loaded', 400, 'NO_DATASET');

    // Generate PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="datapilot-report-${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('DataPilot — Data Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Dataset Info
    doc.fontSize(16).font('Helvetica-Bold').text('Dataset Overview');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${dataset.name}`);
    doc.text(`Rows: ${dataset.rowCount}`);
    doc.text(`Columns: ${dataset.columnCount}`);
    doc.text(`Quality Score: ${dataset.qualityScore}/100`);
    doc.text(`Source: ${dataset.source.toUpperCase()}`);
    doc.text(`Loaded At: ${dataset.loadedAt.toLocaleString()}`);
    doc.moveDown();

    // Quality Issues
    if (dataset.issues.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Data Quality Issues');
      doc.fontSize(10).font('Helvetica');
      for (const issue of dataset.issues) {
        doc.text(`• ${issue.description}`);
      }
      doc.moveDown();
    }

    // Schema
    doc.fontSize(16).font('Helvetica-Bold').text('Schema');
    doc.fontSize(10).font('Helvetica');
    for (const col of dataset.schema) {
      doc.text(`• ${col.name} (${col.type})${col.nullable ? ' — nullable' : ''}`);
    }
    doc.moveDown();

    // Query History
    if (session.queryHistory.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Query History');
      doc.fontSize(10).font('Helvetica');
      const recent = session.queryHistory.slice(-10);
      for (const q of recent) {
        doc.text(`Q: ${q.userMessage}`);
        if (q.generatedSQL) {
          doc.fontSize(8).font('Courier').text(`SQL: ${q.generatedSQL.slice(0, 200)}`);
          doc.font('Helvetica').fontSize(10);
        }
        doc.text(`Results: ${q.result?.rowCount ?? 0} rows`);
        doc.moveDown(0.5);
      }
    }

    doc.end();
  })
);

export default router;
