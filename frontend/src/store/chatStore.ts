import { create } from 'zustand';
import { uuidv4 } from '../utils/uuid';
import { ChatMessage, DatasetMeta, QualityReport, UploadStatus } from '../types';
import { sendChat, uploadFile, exportPDF } from '../api/client';

interface ChatState {
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;

  // Session
  sessionId: string | null;

  // Dataset
  datasets: DatasetMeta[];
  currentDataset: DatasetMeta | null;
  uploadStatus: UploadStatus;
  uploadError: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  uploadDataset: (file: File) => Promise<void>;
  clearMessages: () => void;
  downloadPDF: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  sessionId: null,
  datasets: [],
  currentDataset: null,
  uploadStatus: 'idle',
  uploadError: null,

  sendMessage: async (content: string) => {
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const loadingMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    set((s) => ({
      messages: [...s.messages, userMsg, loadingMsg],
      isLoading: true,
    }));

    try {
      const response = await sendChat(
        content,
        get().currentDataset?.id
      );

      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.message,
        sql: response.sql,
        queryResult: response.queryResult,
        chart: response.chart,
        timestamp: new Date(),
        isLoading: false,
      };

      set((s) => ({
        messages: [...s.messages.slice(0, -1), assistantMsg],
        isLoading: false,
        sessionId: response.sessionId,
      }));
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `❌ Error: ${err instanceof Error ? err.message : 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
        isLoading: false,
      };

      set((s) => ({
        messages: [...s.messages.slice(0, -1), errMsg],
        isLoading: false,
      }));
    }
  },

  uploadDataset: async (file: File) => {
    set({ uploadStatus: 'uploading', uploadError: null });

    try {
      const response = await uploadFile(file);

      const datasetMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: buildUploadMessage(response.datasetMeta, response.qualityReport),
        datasetMeta: response.datasetMeta,
        qualityReport: response.qualityReport,
        timestamp: new Date(),
      };

      set((s) => ({
        messages: [...s.messages, datasetMsg],
        datasets: [...s.datasets.filter((d) => d.id !== response.datasetMeta.id), response.datasetMeta],
        currentDataset: response.datasetMeta,
        uploadStatus: 'success',
        sessionId: response.sessionId,
      }));
    } catch (err: unknown) {
      set({
        uploadStatus: 'error',
        uploadError: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  },

  clearMessages: () => {
    set({ messages: [], currentDataset: null, datasets: [], sessionId: null });
    sessionStorage.removeItem('datapilot_session_id');
  },

  downloadPDF: async () => {
    const blob = await exportPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datapilot-report-${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));

// ── Helper ────────────────────────────────────────────────────

function buildUploadMessage(meta: DatasetMeta, report: QualityReport): string {
  const scoreEmoji = report.score >= 80 ? '🟢' : report.score >= 60 ? '🟡' : '🔴';
  const lines = [
    `✅ **${meta.name}** loaded successfully!`,
    '',
    `📊 **${meta.rowCount.toLocaleString()} rows** × **${meta.columnCount} columns**`,
    `${scoreEmoji} **Quality Score: ${report.score}/100**`,
    '',
  ];

  if (report.issues.length > 0) {
    lines.push('**Issues detected:**');
    report.issues.slice(0, 3).forEach((i) => lines.push(`- ${i.description}`));
    lines.push('');
  }

  if (report.suggestions.length > 0) {
    lines.push('**Suggestions:**');
    report.suggestions.slice(0, 2).forEach((s) => lines.push(`- ${s}`));
    lines.push('');
  }

  lines.push('💬 You can now ask questions like:');
  lines.push('- *"Show me the top 10 rows"*');
  lines.push('- *"What are the column statistics?"*');
  lines.push('- *"Plot the distribution of [column]"*');

  return lines.join('\n');
}
