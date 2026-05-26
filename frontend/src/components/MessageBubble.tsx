import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import { DataTable } from './DataTable';
import { DataChart } from './DataChart';
import { QualityBadge } from './QualityBadge';

interface Props {
  message: ChatMessage;
}

// Typing indicator (3 bouncing dots)
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser ? 'bg-blue-500' : 'bg-gray-100 border border-gray-200'}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-blue-600" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${isUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
            }
          `}
        >
          {message.isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-code:text-blue-700 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Dataset quality badge */}
        {message.datasetMeta && (
          <QualityBadge score={message.datasetMeta.qualityScore} />
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

        {/* SQL block */}
        {message.sql && (
          <details className="w-full text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
              View SQL ›
            </summary>
            <pre className="mt-1 bg-gray-900 text-green-400 rounded-lg p-3 overflow-x-auto text-xs leading-relaxed">
              {message.sql}
            </pre>
          </details>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-300">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
