import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { MessageBubble } from './MessageBubble';

// Quick-start prompts shown when no messages
const STARTER_PROMPTS = [
  'Show me the first 10 rows',
  'What are the column statistics?',
  'How many rows have missing values?',
  'Show a bar chart of top 10 values',
  'What are the most common values in each column?',
  'Find duplicate rows',
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
    await sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">
            {currentDataset ? `Analyzing: ${currentDataset.name}` : 'DataPilot Chat'}
          </h2>
          {currentDataset && (
            <p className="text-xs text-gray-400">
              {currentDataset.rowCount.toLocaleString()} rows · {currentDataset.columnCount} columns
            </p>
          )}
        </div>
        {currentDataset && (
          <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 font-medium">
            {currentDataset.source.toUpperCase()}
          </div>
        )}
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Welcome to DataPilot</h3>
              <p className="text-gray-400 text-sm mt-2 max-w-sm">
                Upload a CSV, Excel, or PDF file on the left, then ask questions about your data in plain English.
              </p>
            </div>

            {currentDataset && (
              <div className="w-full max-w-md">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Try asking…
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                      className="text-left text-xs px-3 py-2 bg-white border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 text-gray-600 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        {!currentDataset && (
          <p className="text-xs text-amber-500 mb-2 text-center">
            ⚠️ Upload a dataset first to start querying
          </p>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentDataset
                ? 'Ask anything about your data… (Enter to send, Shift+Enter for new line)'
                : 'Upload a dataset to start chatting…'
            }
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-300 mt-2 text-center">
          DataPilot · Powered by Claude · Queries run on DuckDB
        </p>
      </div>
    </div>
  );
};
