import React, { useState } from 'react';
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
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {result.rowCount.toLocaleString()} rows · {result.executionTimeMs}ms
        </span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              ‹
            </button>
            <span className="px-2 py-0.5 text-xs text-gray-600">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100 max-h-80">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 sticky top-0">
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-gray-600 font-semibold whitespace-nowrap border-b border-gray-100"
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
                className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}
              >
                {result.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-1.5 border-b border-gray-50 whitespace-nowrap text-gray-700 max-w-[200px] truncate"
                    title={String(row[col] ?? '')}
                  >
                    {row[col] === null || row[col] === undefined ? (
                      <span className="text-gray-300 italic">null</span>
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
