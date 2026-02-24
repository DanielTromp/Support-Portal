'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import { ActivityLogEntry, SystemLogEntry } from '@/types';

interface DashboardData {
  sessionCount: number;
  activityCount: number;
  errorCount: number;
  totalCost: number;
  recentActivity: ActivityLogEntry[];
  recentErrors: SystemLogEntry[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sessionsRes, activityRes, logsRes, usageRes] = await Promise.all([
          fetch('/api/admin/chat-sessions?limit=1'),
          fetch('/api/admin/activity?limit=5'),
          fetch('/api/admin/logs?level=error&limit=5'),
          fetch('/api/admin/usage'),
        ]);

        const sessions = await sessionsRes.json();
        const activity = await activityRes.json();
        const logs = await logsRes.json();
        const usage = await usageRes.json();

        setData({
          sessionCount: sessions.total || 0,
          activityCount: activity.total || 0,
          errorCount: logs.total || 0,
          totalCost: usage.totals?.total_cost || 0,
          recentActivity: activity.activities || [],
          recentErrors: logs.logs || [],
        });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: 'Chat Sessions', value: data?.sessionCount || 0, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Activities Logged', value: data?.activityCount || 0, icon: Activity, color: 'text-green-600 bg-green-50' },
    { label: 'Errors', value: data?.errorCount || 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Total Cost', value: `$${(data?.totalCost || 0).toFixed(4)}`, icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

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
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {data?.recentActivity.length ? (
            <div className="space-y-3">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{a.action}</span>
                    {a.username && (
                      <span className="text-gray-400 ml-2">by {a.username}</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(a.created_at + 'Z').toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No activity yet</p>
          )}
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h2>
          {data?.recentErrors.length ? (
            <div className="space-y-3">
              {data.recentErrors.map((l) => (
                <div key={l.id} className="text-sm">
                  <p className="text-red-700 font-medium">{l.message}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(l.created_at + 'Z').toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No errors</p>
          )}
        </div>
      </div>
    </div>
  );
}
