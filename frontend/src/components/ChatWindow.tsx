import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Sparkles, Database, TrendingUp, Filter, BarChart2, Cpu } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { MessageBubble } from './MessageBubble';

const STARTER_PROMPTS = [
  { icon: '👁️', label: 'Preview data', prompt: 'Show me the first 10 rows' },
  { icon: '📊', label: 'Statistics', prompt: 'What are the column statistics?' },
  { icon: '🔍', label: 'Missing values', prompt: 'How many rows have missing values?' },
  { icon: '📈', label: 'Top chart', prompt: 'Show a bar chart of the top 10 values' },
  { icon: '🔁', label: 'Duplicates', prompt: 'Find duplicate rows in the data' },
  { icon: '💡', label: 'Insights', prompt: 'Give me key insights about this dataset' },
];

const FEATURE_CARDS = [
  {
    icon: Database,
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    iconColor: 'text-blue-400',
    title: 'Upload Any File',
    desc: 'CSV, Excel, PDF, JSON — all supported',
  },
  {
    icon: Cpu,
    color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20',
    iconColor: 'text-violet-400',
    title: 'AI-Powered Analysis',
    desc: 'Ask questions in plain English',
  },
  {
    icon: TrendingUp,
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'Instant Charts',
    desc: 'Auto-generate beautiful visualizations',
  },
  {
    icon: Filter,
    color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
    iconColor: 'text-orange-400',
    title: 'Smart Queries',
    desc: 'SQL powered by DuckDB, zero syntax needed',
  },
];

export const ChatWindow: React.FC = () => {
  const { messages, isLoading, sendMessage, currentDataset } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">
              {currentDataset ? currentDataset.name : 'DataPilot Chat'}
            </h2>
            {currentDataset ? (
              <p className="text-xs text-gray-400">
                {currentDataset.rowCount.toLocaleString()} rows · {currentDataset.columnCount} columns · {currentDataset.source.toUpperCase()}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Upload a dataset to start analyzing</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentDataset && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full border border-violet-200 font-medium">
            <Cpu className="w-3 h-3" />
            Groq AI
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full gap-8 py-8">
            {/* Hero */}
            <div className="text-center max-w-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Welcome to DataPilot
              </h3>
              <p className="text-gray-500 text-sm mt-2.5 max-w-sm mx-auto leading-relaxed">
                Your AI-powered data analyst. Upload any dataset and ask questions in plain English — no SQL or code needed.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {FEATURE_CARDS.map(({ icon: Icon, color, iconColor, title, desc }) => (
                <div
                  key={title}
                  className={`bg-gradient-to-br ${color} border rounded-xl p-4`}
                >
                  <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
                  <p className="text-xs font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            {/* Starter prompts — only when dataset loaded */}
            {currentDataset && (
              <div className="w-full max-w-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">
                  Try asking…
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map(({ icon, label, prompt }) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="group text-left px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">{label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 pl-6 truncate">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload hint if no dataset */}
            {!currentDataset && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
                <span className="text-base">👈</span>
                <span>Upload a dataset from the sidebar to get started</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {!currentDataset && messages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <span>⚠️</span>
              <span>Upload a dataset to start querying data</span>
            </div>
          )}

          <div className="flex gap-3 items-end bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentDataset
                  ? `Ask anything about ${currentDataset.name}…`
                  : 'Upload a dataset to start chatting…'
              }
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none max-h-32 overflow-y-auto leading-relaxed"
              style={{ minHeight: '24px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="
                flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                transition-all duration-200
                bg-gradient-to-br from-indigo-500 to-violet-600
                hover:from-indigo-600 hover:to-violet-700
                disabled:opacity-40 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300
                shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40
              "
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          <p className="text-xs text-gray-300 mt-2 text-center">
            DataPilot · Queries run on DuckDB · Powered by Groq · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
};
