import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { ChatMessage } from '../types';
import { DataTable } from './DataTable';
import { DataChart } from './DataChart';
import { QualityBadge } from './QualityBadge';

interface Props {
  message: ChatMessage;
}

// Three bouncing dots for typing indicator
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1 px-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="typing-dot w-2 h-2 bg-indigo-400 rounded-full"
        style={{ animationDelay: `${i * 0.18}s` }}
      />
    ))}
  </div>
);

// Copy-to-clipboard button for SQL block
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  const [sqlOpen, setSqlOpen] = useState(false);

  return (
    <div className={`flex gap-3 message-enter ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
          : 'bg-white border border-gray-100'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-indigo-500" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
          ${isUser
            ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm shadow-indigo-200'
            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
          }
        `}>
          {message.isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Dataset quality badge */}
        {message.datasetMeta && !isUser && (
          <div className="flex items-center gap-2 flex-wrap">
            <QualityBadge score={message.datasetMeta.qualityScore} />
            <span className="text-xs text-gray-400">
              {message.datasetMeta.rowCount.toLocaleString()} rows · {message.datasetMeta.columnCount} cols
            </span>
          </div>
        )}

        {/* Query results table */}
        {message.queryResult && message.queryResult.rows.length > 0 && (
          <div className="w-full">
            <DataTable result={message.queryResult} />
          </div>
        )}

        {/* Chart */}
        {message.chart && (
          <div className="w-full">
            <DataChart chart={message.chart} />
          </div>
        )}

        {/* SQL block (collapsible) */}
        {message.sql && (
          <div className="w-full">
            <button
              onClick={() => setSqlOpen(!sqlOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Terminal className="w-3 h-3" />
              <span>View SQL</span>
              {sqlOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {sqlOpen && (
              <div className="mt-1.5 rounded-xl overflow-hidden border border-slate-700 shadow-sm">
                {/* Code block header */}
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">SQL Query</span>
                  </div>
                  <CopyButton text={message.sql} />
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-4 overflow-x-auto text-xs leading-relaxed font-mono">
                  {message.sql}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-300">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
