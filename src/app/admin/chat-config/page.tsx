'use client';

import { useState, useEffect } from 'react';
import { Save, TestTube, Loader2, Check } from 'lucide-react';

const CONFIG_KEYS = [
  { key: 'openrouter_api_key', label: 'OpenRouter API Key', type: 'password', placeholder: 'sk-or-v1-...' },
  { key: 'openrouter_model', label: 'Model', type: 'text', placeholder: 'google/gemini-2.5-flash' },
  { key: 'openrouter_system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful support assistant...' },
  { key: 'openrouter_max_tokens', label: 'Max Tokens', type: 'text', placeholder: '2048' },
];

export default function ChatConfigPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((config) => {
        const vals: Record<string, string> = {};
        for (const k of CONFIG_KEYS) {
          vals[k.key] = config[k.key]?.value || '';
        }
        setValues(vals);
      });
  }, []);

  async function saveKey(key: string) {
    setSaving(key);
    setSaved(null);
    await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: values[key] }),
    });
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, this is a test. Reply with "Connection successful!" and nothing else.', language: 'en' }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult(`Success: "${data.content.substring(0, 100)}"`);
      } else {
        setTestResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat Configuration</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
        {CONFIG_KEYS.map((cfg) => (
          <div key={cfg.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{cfg.label}</label>
            <div className="flex gap-2">
              {cfg.type === 'textarea' ? (
                <textarea
                  value={values[cfg.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [cfg.key]: e.target.value }))}
                  placeholder={cfg.placeholder}
                  rows={3}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
                />
              ) : (
                <input
                  type={cfg.type === 'password' ? 'text' : cfg.type}
                  value={values[cfg.key] || ''}
                  onChange={(e) => setValues((v) => ({ ...v, [cfg.key]: e.target.value }))}
                  placeholder={cfg.placeholder}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
                />
              )}
              <button
                onClick={() => saveKey(cfg.key)}
                disabled={saving === cfg.key}
                className="px-3 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving === cfg.key ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saved === cfg.key ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                Save
              </button>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <TestTube size={16} />}
            Test Connection
          </button>
          {testResult && (
            <p className={`mt-3 text-sm ${testResult.startsWith('Success') ? 'text-green-700' : 'text-red-700'}`}>
              {testResult}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
