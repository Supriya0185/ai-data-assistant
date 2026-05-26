import axios from 'axios';
import { DatasetMeta, QualityReport, QueryResult, ChartSuggestion } from '../types';

const BASE_URL = '/api';

// Axios instance — injects session ID automatically
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const sessionId = sessionStorage.getItem('datapilot_session_id');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

api.interceptors.response.use((response) => {
  // Persist session ID from backend
  const sid =
    response.data?.sessionId || response.headers['x-session-id'];
  if (sid) {
    sessionStorage.setItem('datapilot_session_id', sid);
  }
  return response;
});

// ── API Methods ───────────────────────────────────────────────

export interface UploadResponse {
  datasetMeta: DatasetMeta;
  qualityReport: QualityReport;
  sessionId: string;
  preview: Record<string, unknown>[];
}

export interface ChatResponse {
  message: string;
  sql?: string;
  queryResult?: QueryResult;
  chart?: ChartSuggestion;
  sessionId: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResponse>('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const sendChat = async (message: string, datasetId?: string): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>('/chat', { message, datasetId });
  return data;
};

export const getDatasets = async (): Promise<{ datasets: DatasetMeta[]; currentDataset?: DatasetMeta }> => {
  const { data } = await api.get('/datasets');
  return data;
};

export const getHealth = async (): Promise<{ status: string; services: Record<string, string> }> => {
  const { data } = await api.get('/health');
  return data;
};

export const exportPDF = async (): Promise<Blob> => {
  const { data } = await api.post('/export/pdf', {}, { responseType: 'blob' });
  return data;
};
