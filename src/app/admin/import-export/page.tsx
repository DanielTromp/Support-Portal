'use client';

import { useState } from 'react';
import { Upload, Download, FileText, Database, Settings, MessageSquare, AlertTriangle, Check, Loader2 } from 'lucide-react';

export default function ImportExportPage() {
  const [importing, setImporting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

  const handleExport = (resource: string, format: string) => {
    window.location.href = `/api/admin/import-export/${resource}?format=${format}`;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, resource: string) => {
    e.preventDefault();
    setNotification(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setNotification({ type: 'error', msg: 'Only JSON files can be imported.' });
      return;
    }

    setImporting(resource);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const res = await fetch(`/api/admin/import-export/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setNotification({ type: 'success', msg: data.message || `${resource.toUpperCase()} import successful!` });
    } catch (err: any) {
      setNotification({ type: 'error', msg: err.message || 'Failed to parse or import JSON.' });
    } finally {
      setImporting(null);
      if (e.target) e.target.value = ''; // Reset file input
    }
  };

  const sections = [
    {
      id: 'faq',
      title: 'FAQ Database',
      description: 'Export or import your entire list of FAQs and Categories. Importing replaces existing data.',
      icon: Database,
      supportsPdf: true,
      color: 'blue'
    },
    {
      id: 'config',
      title: 'Configuration Settings',
      description: 'System configurations including brand theming, AI prompts, and keys. Importing replaces existing data.',
      icon: Settings,
      supportsPdf: false,
      color: 'purple'
    },
    {
      id: 'chat',
      title: 'Chat History',
      description: 'Complete user chat histories and sessions. Importing merges (inserts new distinct) records.',
      icon: MessageSquare,
      supportsPdf: true,
      color: 'green'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
        <p className="text-gray-500 text-sm mt-1">Back up your system data to JSON/PDF, or restore JSON backups.</p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
           notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <Check size={20} />}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      <div className="grid gap-6">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
               
               <div className="flex gap-4 items-start flex-1 text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${section.color}-50 text-${section.color}-600 flex-shrink-0`}>
                     <Icon size={24} />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                     <p className="text-sm text-gray-500 mt-1 max-w-lg">{section.description}</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0 border-t md:border-none border-gray-100 pt-4 md:pt-0">
                  <div className="flex gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                     <button
                        onClick={() => handleExport(section.id, 'json')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                     >
                        <Download size={14} /> JSON
                     </button>
                     {section.supportsPdf && (
                        <button
                          onClick={() => handleExport(section.id, 'pdf')}
                          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all text-red-700 hover:text-red-800"
                        >
                          <FileText size={14} /> PDF
                        </button>
                     )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => handleImport(e, section.id)}
                      disabled={importing === section.id}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button 
                      disabled={importing === section.id}
                      className={`w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
                         importing === section.id ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-brand-purple border-brand-purple hover:bg-brand-purple/90 text-white shadow-sm'
                      }`}
                    >
                      {importing === section.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {importing === section.id ? 'Importing...' : 'Upload JSON'}
                    </button>
                  </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
