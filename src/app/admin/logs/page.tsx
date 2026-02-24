'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemLogEntry } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LEVEL_COLORS: Record<string, string> = {
  debug: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-50 text-blue-700',
  warn: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-red-700',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (levelFilter) params.set('level', levelFilter);

    const res = await fetch(`/api/admin/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, levelFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">Level</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-48">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">No logs found</td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[l.level] || LEVEL_COLORS.info}`}>
                      {l.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <p>{l.message}</p>
                    {l.details_json && (
                      <pre className="text-xs text-gray-400 mt-1 max-w-lg truncate">
                        {l.details_json}
                      </pre>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(l.created_at + 'Z').toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
