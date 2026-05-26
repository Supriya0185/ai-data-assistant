import React from 'react';
import { Database, FileText, Download, Trash2, ChevronRight } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { FileUpload } from './FileUpload';
import { QualityBadge } from './QualityBadge';

export const Sidebar: React.FC = () => {
  const { datasets, currentDataset, clearMessages, downloadPDF } = useChatStore();

  return (
    <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">DP</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">DataPilot</h1>
            <p className="text-xs text-gray-400">AI Data Assistant</p>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="px-4 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Upload Data
        </p>
        <FileUpload />
      </div>

      {/* Datasets */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Datasets ({datasets.length})
        </p>

        {datasets.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <Database className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs">No datasets loaded</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {datasets.map((ds) => (
              <li
                key={ds.id}
                className={`
                  rounded-lg p-3 border cursor-pointer transition-all
                  ${currentDataset?.id === ds.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{ds.name}</p>
                      <p className="text-xs text-gray-400">
                        {ds.rowCount.toLocaleString()} rows · {ds.columnCount} cols
                      </p>
                    </div>
                  </div>
                  {currentDataset?.id === ds.id && (
                    <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="mt-2">
                  <QualityBadge score={ds.qualityScore} showLabel={false} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={downloadPDF}
          disabled={!currentDataset}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          Export PDF Report
        </button>
        <button
          onClick={clearMessages}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Session
        </button>
      </div>
    </aside>
  );
};
