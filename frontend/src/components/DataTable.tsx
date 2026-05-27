import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Rows } from 'lucide-react';
import { QueryResult } from '../types';

interface Props {
  result: QueryResult;
}

const PAGE_SIZE = 20;

export const DataTable: React.FC<Props> = ({ result }) => {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(result.rows.length / PAGE_SIZE);
  const visibleRows = result.rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm bg-white mt-2">
      {/* Table meta bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Rows className="w-3 h-3" />
            <span className="font-medium">{result.rowCount.toLocaleString()}</span>
            <span>rows</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{result.executionTimeMs}ms</span>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-gray-500" />
            </button>
            <span className="text-xs text-gray-500 px-2 font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto max-h-72">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <th className="w-8 px-3 py-2 text-center text-gray-400 font-medium border-r border-gray-100">
                #
              </th>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-gray-600 font-semibold whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0"
              >
                <td className="w-8 px-3 py-1.5 text-center text-gray-300 font-medium border-r border-gray-50">
                  {page * PAGE_SIZE + i + 1}
                </td>
                {result.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-1.5 whitespace-nowrap text-gray-700 max-w-[200px] truncate"
                    title={String(row[col] ?? '')}
                  >
                    {row[col] === null || row[col] === undefined ? (
                      <span className="text-gray-300 italic bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                        null
                      </span>
                    ) : typeof row[col] === 'number' ? (
                      <span className="text-indigo-600 font-medium font-mono">
                        {String(row[col])}
                      </span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
