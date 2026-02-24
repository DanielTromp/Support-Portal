'use client';

import { useState, useEffect } from 'react';
import { UsageStats } from '@/types';
import { Coins, MessageSquare, Zap, Users } from 'lucide-react';

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/usage')
      .then((r) => r.json())
      .then(setUsage)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!usage) return null;

  const cards = [
    { label: 'Total Cost', value: `$${usage.totals.total_cost.toFixed(4)}`, icon: Coins, color: 'text-green-600 bg-green-50' },
    { label: 'AI Responses', value: usage.totals.total_messages, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Tokens In', value: usage.totals.total_tokens_in.toLocaleString(), icon: Zap, color: 'text-purple-600 bg-purple-50' },
    { label: 'Tokens Out', value: usage.totals.total_tokens_out.toLocaleString(), icon: Zap, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Usage Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per User */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Usage by User</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">User</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Sessions</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Cost</th>
              </tr>
            </thead>
            <tbody>
              {usage.byUser.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No usage data</td>
                </tr>
              ) : (
                usage.byUser.map((u) => (
                  <tr key={u.username} className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{u.sessions}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{(u.tokens_in + u.tokens_out).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">${u.cost.toFixed(4)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Per Day */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Daily Breakdown (Last 30 Days)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Messages</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Tokens</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Cost</th>
              </tr>
            </thead>
            <tbody>
              {usage.byDay.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No data for the last 30 days</td>
                </tr>
              ) : (
                usage.byDay.map((d) => (
                  <tr key={d.day} className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{d.day}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{d.messages}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{(d.tokens_in + d.tokens_out).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">${d.cost.toFixed(4)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
