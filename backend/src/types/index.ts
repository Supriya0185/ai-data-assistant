// ============================================================
// DataPilot — Shared TypeScript Types
// ============================================================

// ── Dataset / Schema ─────────────────────────────────────────

export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'unknown';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  nullable: boolean;
  uniqueCount?: number;
  sampleValues?: unknown[];
}

export interface DatasetMeta {
  id: string;
  name: string;
  source: 'csv' | 'excel' | 'pdf' | 'image' | 'json' | 'database' | 'mcp';
  rowCount: number;
  columnCount: number;
  schema: ColumnSchema[];
  qualityScore: number;       // 0–100
  issues: QualityIssue[];
  loadedAt: Date;
  tableName: string;          // DuckDB table name
}

// ── Quality ───────────────────────────────────────────────────

export type IssueType =
  | 'missing_values'
  | 'duplicates'
  | 'outliers'
  | 'type_mismatch'
  | 'empty_column';

export interface QualityIssue {
  type: IssueType;
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

// ── Session ───────────────────────────────────────────────────

export interface QueryHistoryEntry {
  id: string;
  userMessage: string;
  generatedSQL?: string;
  result?: QueryResult;
  timestamp: Date;
}

export interface Session {
  id: string;
  datasets: DatasetMeta[];
  currentDataset?: DatasetMeta;
  mcpConnections: MCPConnection[];
  queryHistory: QueryHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Query / Results ───────────────────────────────────────────

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  sql: string;
}

export interface ChartSuggestion {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: Record<string, unknown>[];
}

// ── Chat ──────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatResponse {
  message: string;
  sql?: string;
  queryResult?: QueryResult;
  chart?: ChartSuggestion;
  qualityReport?: QualityReport;
  datasetMeta?: DatasetMeta;
  sessionId: string;
}

// ── MCP ───────────────────────────────────────────────────────

export interface MCPConnection {
  id: string;
  name: string;
  type: 'github' | 'jira' | 'slack' | 'database' | 'custom';
  connected: boolean;
  connectedAt?: Date;
}

// ── API Request/Response ──────────────────────────────────────

export interface ChatRequest {
  message: string;
  sessionId?: string;
  datasetId?: string;
}

export interface UploadResponse {
  datasetMeta: DatasetMeta;
  qualityReport: QualityReport;
  sessionId: string;
  preview: Record<string, unknown>[];
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

// ── SQL Validation ────────────────────────────────────────────

export interface SQLValidationResult {
  isValid: boolean;
  isSafe: boolean;
  normalizedSQL: string;
  errors: string[];
  warnings: string[];
}
