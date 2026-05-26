import { DuckDBInstance } from '@duckdb/node-api';
import { QueryResult } from '../types';
import { logger } from './logger';

let instance: DuckDBInstance | null = null;

async function getInstance(): Promise<DuckDBInstance> {
  if (!instance) {
    instance = await DuckDBInstance.create(':memory:');
    logger.info('DuckDB in-memory instance initialized');
  }
  return instance;
}

export class DuckDBService {
  /** Execute a SELECT query and return typed results */
  static async query(sql: string): Promise<QueryResult> {
    const start = Date.now();
    const inst = await getInstance();
    const conn = await inst.connect();

    try {
      const reader = await conn.runAndReadAll(sql);
      const rows = reader.getRowObjects() as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs: Date.now() - start,
        sql,
      };
    } finally {
      conn.disconnectSync();
    }
  }

  /** Load a 2D array (CSV data) into a DuckDB table */
  static async loadCSV(
    tableName: string,
    headers: string[],
    rows: unknown[][]
  ): Promise<void> {
    const inst = await getInstance();
    const conn = await inst.connect();

    try {
      // Drop existing table if re-loading
      await conn.runAndReadAll(`DROP TABLE IF EXISTS "${tableName}"`);

      if (rows.length === 0) {
        const colDefs = headers.map((h) => `"${sanitizeColumn(h)}" TEXT`).join(', ');
        await conn.runAndReadAll(`CREATE TABLE "${tableName}" (${colDefs})`);
        return;
      }

      // Infer column types from data
      const colTypes = inferColumnTypes(headers, rows);
      const colDefs = headers
        .map((h, i) => `"${sanitizeColumn(h)}" ${colTypes[i]}`)
        .join(', ');

      await conn.runAndReadAll(`CREATE TABLE "${tableName}" (${colDefs})`);

      // Batch insert
      const BATCH = 200;
      for (let offset = 0; offset < rows.length; offset += BATCH) {
        const batch = rows.slice(offset, offset + BATCH);
        const valueClauses = batch
          .map((row) => {
            const vals = (row as unknown[]).map((v, i) =>
              formatValue(v, colTypes[i] as string)
            );
            return `(${vals.join(', ')})`;
          })
          .join(', ');

        const colNames = headers.map((h) => `"${sanitizeColumn(h)}"`).join(', ');
        await conn.runAndReadAll(
          `INSERT INTO "${tableName}" (${colNames}) VALUES ${valueClauses}`
        );
      }

      logger.info(`Loaded ${rows.length} rows into DuckDB table "${tableName}"`);
    } finally {
      conn.disconnectSync();
    }
  }

  /** List all tables in the in-memory DB */
  static async listTables(): Promise<string[]> {
    const result = await DuckDBService.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'"
    );
    return result.rows.map((r) => r['table_name'] as string);
  }

  /** Drop a table */
  static async dropTable(tableName: string): Promise<void> {
    const inst = await getInstance();
    const conn = await inst.connect();
    try {
      await conn.runAndReadAll(`DROP TABLE IF EXISTS "${tableName}"`);
    } finally {
      conn.disconnectSync();
    }
  }

  /** Get row count for a table */
  static async rowCount(tableName: string): Promise<number> {
    const result = await DuckDBService.query(
      `SELECT COUNT(*) AS cnt FROM "${tableName}"`
    );
    return Number(result.rows[0]?.['cnt'] ?? 0);
  }

  /** Sample rows for preview */
  static async sample(tableName: string, limit = 10): Promise<Record<string, unknown>[]> {
    const result = await DuckDBService.query(
      `SELECT * FROM "${tableName}" LIMIT ${limit}`
    );
    return result.rows;
  }
}

// ── Helpers ───────────────────────────────────────────────────

function sanitizeColumn(name: string): string {
  return name.replace(/"/g, '').trim();
}

function inferColumnTypes(headers: string[], rows: unknown[][]): string[] {
  return headers.map((_, colIdx) => {
    const sample = rows
      .slice(0, 200)
      .map((r) => (r as unknown[])[colIdx])
      .filter((v) => v !== null && v !== undefined && v !== '');

    if (sample.length === 0) return 'TEXT';

    const allNumbers = sample.every((v) => v !== '' && !isNaN(Number(v)));
    if (allNumbers) {
      const hasDecimal = sample.some((v) => String(v).includes('.'));
      return hasDecimal ? 'DOUBLE' : 'BIGINT';
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;
    const allDates = sample.every((v) => dateRe.test(String(v)));
    if (allDates) return 'DATE';

    const boolValues = new Set(['true', 'false', '0', '1', 'yes', 'no']);
    const allBool = sample.every((v) => boolValues.has(String(v).toLowerCase()));
    if (allBool) return 'BOOLEAN';

    return 'TEXT';
  });
}

function formatValue(v: unknown, type: string): string {
  if (v === null || v === undefined || v === '') return 'NULL';
  const s = String(v).replace(/'/g, "''");

  if (type === 'BIGINT' || type === 'DOUBLE') {
    const n = Number(v);
    return isNaN(n) ? 'NULL' : String(n);
  }
  if (type === 'BOOLEAN') {
    const lower = String(v).toLowerCase();
    return ['true', '1', 'yes'].includes(lower) ? 'TRUE' : 'FALSE';
  }
  if (type === 'DATE') {
    return `'${s}'`;
  }
  return `'${s}'`;
}
