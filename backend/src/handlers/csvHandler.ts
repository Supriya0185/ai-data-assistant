import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { DatasetMeta, UploadResponse } from '../types';
import { PreprocessingService } from '../services/preprocessingService';
import { DuckDBService } from '../services/duckdbService';
import { SessionService } from '../services/sessionService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../services/logger';

/**
 * Parse CSV buffer, run preprocessing pipeline, load into DuckDB.
 * Returns UploadResponse including quality report and preview.
 */
export async function handleCSV(
  buffer: Buffer,
  filename: string,
  sessionId: string
): Promise<UploadResponse> {
  // ── 1. Parse CSV ───────────────────────────────────────────
  const csvText = buffer.toString('utf-8');

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // keep as strings; we infer types ourselves
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.filter((e) => e.type === 'Delimiter' || e.type === 'Quotes');
    if (fatal.length > 0) {
      throw new AppError(
        `CSV parse error: ${fatal[0].message}`,
        400,
        'CSV_PARSE_ERROR'
      );
    }
    logger.warn(`CSV non-fatal parse warnings: ${parsed.errors.length} warnings`);
  }

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) {
    throw new AppError('CSV file has no columns', 400, 'EMPTY_CSV');
  }

  // Convert to 2D array for preprocessing
  const rows = parsed.data.map((row) =>
    headers.map((h) => row[h] ?? null)
  );

  if (rows.length === 0) {
    throw new AppError('CSV file has no data rows', 400, 'EMPTY_CSV');
  }

  logger.info(`CSV parsed: ${rows.length} rows × ${headers.length} cols from "${filename}"`);

  // ── 2. Preprocessing pipeline ──────────────────────────────
  const { schema, report } = PreprocessingService.analyze({ headers, rows });

  // ── 3. Load into DuckDB ────────────────────────────────────
  const tableName = sanitizeTableName(filename);
  await DuckDBService.loadCSV(tableName, headers, rows);

  // ── 4. Build DatasetMeta ───────────────────────────────────
  const datasetMeta: DatasetMeta = {
    id: uuidv4(),
    name: filename,
    source: 'csv',
    rowCount: rows.length,
    columnCount: headers.length,
    schema,
    qualityScore: report.score,
    issues: report.issues,
    loadedAt: new Date(),
    tableName,
  };

  // ── 5. Save to session ─────────────────────────────────────
  SessionService.addDataset(sessionId, datasetMeta);

  // ── 6. Preview rows ────────────────────────────────────────
  const preview = await DuckDBService.sample(tableName, 10);

  return {
    datasetMeta,
    qualityReport: report,
    sessionId,
    preview,
  };
}

function sanitizeTableName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')     // remove extension
    .replace(/[^a-zA-Z0-9_]/g, '_')  // replace special chars
    .replace(/^(\d)/, '_$1')     // can't start with digit
    .toLowerCase()
    .slice(0, 63);                // DuckDB identifier limit
}
