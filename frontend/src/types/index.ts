// ── Shared Frontend Types ─────────────────────────────────────

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullable: boolean;
  uniqueCount?: number;
  sampleValues?: unknown[];
}

export interface QualityIssue {
  type: string;
  column?: string;
  count: number;
  percentage: number;
  description: string;
}

export interface QualityReport {
  score: number;
  totalRows: number;
  totalColumns: number;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface DatasetMeta {
  id: string;
  name: string;
  source: string;
  rowCount: number;
  columnCount: number;
  schema: ColumnSchema[];
  qualityScore: number;
  issues: QualityIssue[];
  loadedAt: string;
  tableName: string;
}

export interface ChartSuggestion {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: Record<string, unknown>[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  sql: string;
}

// ── Chat ──────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sql?: string;
  queryResult?: QueryResult;
  chart?: ChartSuggestion;
  datasetMeta?: DatasetMeta;
  qualityReport?: QualityReport;
  timestamp: Date;
  isLoading?: boolean;
}

// ── App State ─────────────────────────────────────────────────

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
