'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Database } from 'lucide-react';
import { FaqData } from '@/types';

export default function UploadsPage() {
  const [faqData, setFaqData] = useState<FaqData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faq')
      .then((r) => r.json())
      .then(setFaqData)
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

  const hasData = faqData?.items && faqData.items.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">FAQ Uploads</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasData ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
            <Database size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {hasData ? 'FAQ Data Loaded' : 'No FAQ Data'}
            </h2>
            <p className="text-sm text-gray-500">
              {hasData
                ? `${faqData!.items.length} articles across ${faqData!.categories.length} categories`
                : 'Upload a PDF from the main portal to populate the knowledge base'}
            </p>
          </div>
        </div>

        {hasData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FileText size={14} />
                  File Name
                </div>
                <p className="font-medium text-gray-900">{faqData!.fileName || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Upload size={14} />
                  Uploaded
                </div>
                <p className="font-medium text-gray-900">
                  {faqData!.uploadedAt
                    ? new Date(faqData!.uploadedAt).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>
            </div>

            {faqData!.brand && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Brand</p>
                <p className="font-medium text-gray-900">{faqData!.brand.companyName}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {faqData!.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
