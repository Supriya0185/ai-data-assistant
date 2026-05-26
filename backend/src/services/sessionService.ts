import { v4 as uuidv4 } from 'uuid';
import { Session, DatasetMeta, QueryHistoryEntry, MCPConnection } from '../types';

// In-memory session store (Phase 3 will persist to PostgreSQL)
const sessions = new Map<string, Session>();

export class SessionService {
  /** Create a new session or return existing */
  static getOrCreate(sessionId?: string): Session {
    if (sessionId && sessions.has(sessionId)) {
      return sessions.get(sessionId)!;
    }

    const session: Session = {
      id: uuidv4(),
      datasets: [],
      mcpConnections: [],
      queryHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sessions.set(session.id, session);
    return session;
  }

  static get(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
  }

  static addDataset(sessionId: string, dataset: DatasetMeta): void {
    const session = sessions.get(sessionId);
    if (!session) return;

    // Remove old dataset with same name if re-uploading
    session.datasets = session.datasets.filter((d) => d.name !== dataset.name);
    session.datasets.push(dataset);
    session.currentDataset = dataset;
    session.updatedAt = new Date();
  }

  static addQueryHistory(sessionId: string, entry: QueryHistoryEntry): void {
    const session = sessions.get(sessionId);
    if (!session) return;

    session.queryHistory.push(entry);
    // Keep last 100 queries
    if (session.queryHistory.length > 100) {
      session.queryHistory = session.queryHistory.slice(-100);
    }
    session.updatedAt = new Date();
  }

  static setCurrentDataset(sessionId: string, datasetId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    const dataset = session.datasets.find((d) => d.id === datasetId);
    if (!dataset) return false;

    session.currentDataset = dataset;
    session.updatedAt = new Date();
    return true;
  }

  static addMCPConnection(sessionId: string, conn: MCPConnection): void {
    const session = sessions.get(sessionId);
    if (!session) return;
    session.mcpConnections.push(conn);
    session.updatedAt = new Date();
  }

  static getAll(): Session[] {
    return Array.from(sessions.values());
  }

  static delete(sessionId: string): void {
    sessions.delete(sessionId);
  }

  /** Build context string for Claude prompts */
  static buildContext(session: Session): string {
    const lines: string[] = [];

    if (session.datasets.length > 0) {
      lines.push('## Loaded Datasets');
      for (const ds of session.datasets) {
        lines.push(`- **${ds.name}** (${ds.rowCount} rows, ${ds.columnCount} columns)`);
        lines.push(`  Table: \`${ds.tableName}\``);
        lines.push(`  Columns: ${ds.schema.map((c) => `${c.name}(${c.type})`).join(', ')}`);
        lines.push(`  Quality Score: ${ds.qualityScore}/100`);
      }
    }

    if (session.currentDataset) {
      lines.push(`\n## Current Dataset: ${session.currentDataset.name}`);
    }

    if (session.queryHistory.length > 0) {
      const recent = session.queryHistory.slice(-3);
      lines.push('\n## Recent Queries');
      for (const q of recent) {
        lines.push(`- "${q.userMessage}"`);
        if (q.generatedSQL) lines.push(`  SQL: ${q.generatedSQL}`);
      }
    }

    return lines.join('\n');
  }
}
