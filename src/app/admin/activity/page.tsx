'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityLogEntry } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (actionFilter) params.set('action', actionFilter);

    const res = await fetch(`/api/admin/activity?${params}`);
    const data = await res.json();
    setActivities(data.activities || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All actions</option>
          <option value="page_view">Page views</option>
          <option value="search">Searches</option>
          <option value="category_filter">Category filters</option>
          <option value="chat_message">Chat messages</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No activity found</td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.username || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {a.details_json ? JSON.stringify(JSON.parse(a.details_json)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(a.created_at + 'Z').toLocaleString()}</td>
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
