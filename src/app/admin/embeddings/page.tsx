'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Search, Loader2, Cpu, FileText, Coins, Zap } from 'lucide-react';

interface CostBreakdown {
  cost: number;
  tokens: number;
  count: number;
}

interface EmbeddingStats {
  totalEnabled: number;
  totalDisabled: number;
  embedded: number;
  missing: { id: number; question: string }[];
  stale: { id: number; question: string }[];
  orphaned: number;
  ftsCount: number;
  model: string | null;
  lastUpdated: string | null;
  costs: {
    generation: CostBreakdown;
    query: CostBreakdown;
    totalCost: number;
    totalTokens: number;
  };
}

export default function EmbeddingsPage() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    fetch('/api/admin/embeddings')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function handleResync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/admin/embeddings', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.message || 'Resync started');
      // Poll for completion
      const interval = setInterval(() => {
        fetch('/api/admin/embeddings')
          .then(r => r.json())
          .then(fresh => {
            setStats(fresh);
            if (fresh.missing.length === 0 && fresh.stale.length === 0) {
              clearInterval(interval);
              setSyncing(false);
              setSyncMessage('All embeddings are up to date');
            }
          })
          .catch(() => {
            clearInterval(interval);
            setSyncing(false);
          });
      }, 3000);
      setTimeout(() => { clearInterval(interval); setSyncing(false); }, 300000);
    } catch {
      setSyncMessage('Failed to start resync');
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const coverage = stats.totalEnabled > 0
    ? Math.round((stats.embedded / stats.totalEnabled) * 100)
    : 0;

  const isHealthy = stats.missing.length === 0 && stats.stale.length === 0 && stats.orphaned === 0;

  const cards = [
    { label: 'Enabled FAQs', value: stats.totalEnabled, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Embeddings', value: `${stats.embedded} / ${stats.totalEnabled}`, icon: Database, color: 'text-purple-600 bg-purple-50' },
    { label: 'Coverage', value: `${coverage}%`, icon: CheckCircle, color: coverage === 100 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50' },
    { label: 'Embedding Cost', value: `$${stats.costs.totalCost.toFixed(4)}`, icon: Coins, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vector Embeddings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the semantic search index for FAQ matching</p>
        </div>
        <button
          onClick={handleResync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {syncing ? 'Syncing...' : 'Resync All'}
        </button>
      </div>

      {syncMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          syncMessage.includes('up to date') || syncMessage.includes('started')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {syncMessage}
        </div>
      )}

      {/* Stats Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Health Status */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            {isHealthy
              ? <CheckCircle size={18} className="text-green-500" />
              : <AlertTriangle size={18} className="text-amber-500" />
            }
            <h2 className="font-semibold text-gray-900">Health Status</h2>
          </div>
          <div className="p-5 space-y-3">
            <StatusRow label="Missing embeddings" value={stats.missing.length} ok={stats.missing.length === 0} />
            <StatusRow label="Stale embeddings" value={stats.stale.length} ok={stats.stale.length === 0} hint="FAQ updated after embedding" />
            <StatusRow label="Orphaned embeddings" value={stats.orphaned} ok={stats.orphaned === 0} hint="Disabled/deleted FAQ" />
            <StatusRow
              label="FTS5 index synced"
              value={stats.ftsCount === stats.totalEnabled ? 'Yes' : `${stats.ftsCount} / ${stats.totalEnabled}`}
              ok={stats.ftsCount === stats.totalEnabled}
            />
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Coins size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Embedding Costs</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Generation</p>
                <p className="text-xs text-gray-400">{stats.costs.generation.count} calls, {stats.costs.generation.tokens.toLocaleString()} tokens</p>
              </div>
              <span className="text-sm font-medium text-gray-900">${stats.costs.generation.cost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Search queries</p>
                <p className="text-xs text-gray-400">{stats.costs.query.count} calls, {stats.costs.query.tokens.toLocaleString()} tokens</p>
              </div>
              <span className="text-sm font-medium text-gray-900">${stats.costs.query.cost.toFixed(4)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Total</p>
              <span className="text-sm font-bold text-gray-900">${stats.costs.totalCost.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <Cpu size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Configuration</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Embedding model</p>
              <p className="text-sm font-mono text-gray-900 mt-0.5">{stats.model || 'Not yet generated'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vector dimensions</p>
              <p className="text-sm font-mono text-gray-900 mt-0.5">{stats.embedded > 0 ? '3072' : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm text-gray-900 mt-0.5">
                {stats.lastUpdated ? new Date(stats.lastUpdated + 'Z').toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Search layers</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 font-medium">Fuse.js</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 font-medium">FTS5</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  stats.embedded > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>Vector</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing / Stale lists */}
      {(stats.missing.length > 0 || stats.stale.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">FAQs Needing Attention</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">ID</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Question</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Issue</th>
              </tr>
            </thead>
            <tbody>
              {stats.missing.map(f => (
                <tr key={`m-${f.id}`} className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-gray-600">{f.id}</td>
                  <td className="px-4 py-2.5 text-gray-900 truncate max-w-md">{f.question}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600 font-medium">Missing</span>
                  </td>
                </tr>
              ))}
              {stats.stale.map(f => (
                <tr key={`s-${f.id}`} className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-gray-600">{f.id}</td>
                  <td className="px-4 py-2.5 text-gray-900 truncate max-w-md">{f.question}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600 font-medium">Stale</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, value, ok, hint }: { label: string; value: string | number; ok: boolean; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <span className={`text-sm font-medium ${ok ? 'text-green-600' : 'text-amber-600'}`}>
        {typeof value === 'number' && value === 0 && ok ? 'None' : value}
      </span>
    </div>
  );
}
