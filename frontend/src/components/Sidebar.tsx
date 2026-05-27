import React, { useState } from 'react';
import {
  Database, FileText, Download, Trash2, ChevronRight,
  Zap, BarChart2, Settings, HelpCircle, Plus
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { FileUpload } from './FileUpload';
import { QualityBadge } from './QualityBadge';

export const Sidebar: React.FC = () => {
  const { datasets, currentDataset, clearMessages, downloadPDF } = useChatStore();
  const [showUpload, setShowUpload] = useState(true);

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight">DataPilot</h1>
            <p className="text-xs text-slate-500 font-medium">AI Data Assistant</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">Backend connected</span>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Data Source
          </p>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Plus className={`w-4 h-4 transition-transform ${showUpload ? 'rotate-45' : ''}`} />
          </button>
        </div>
        {showUpload && <FileUpload />}
      </div>

      {/* Datasets */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Datasets
          </p>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {datasets.length}
          </span>
        </div>

        {datasets.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 font-medium">No datasets loaded</p>
            <p className="text-xs text-slate-600 mt-1">Upload a file to get started</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {datasets.map((ds) => {
              const isActive = currentDataset?.id === ds.id;
              return (
                <li
                  key={ds.id}
                  className={`
                    rounded-xl p-3 border cursor-pointer transition-all duration-200
                    ${isActive
                      ? 'bg-indigo-500/10 border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                        ${isActive ? 'bg-indigo-500/20' : 'bg-slate-700'}
                      `}>
                        <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {ds.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ds.rowCount.toLocaleString()} rows · {ds.columnCount} cols
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="mt-2 pl-9">
                    <QualityBadge score={ds.qualityScore} showLabel={false} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick Commands */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          Quick Actions
        </p>
        <div className="space-y-1">
          <button
            onClick={downloadPDF}
            disabled={!currentDataset}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF Report
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            View Analytics
          </button>
          <button
            onClick={clearMessages}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Session
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">User</span>
        </div>
        <div className="flex gap-1">
          <button className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
