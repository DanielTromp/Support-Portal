'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface Faq {
  id: number;
  category_id: number | null;
  category_name?: string;
  question: string;
  aliases: string | null;
  answer: string;
  is_enabled: number;
}

interface FaqCategory {
  id: number;
  name: string;
}

interface FaqForm {
  category_id: string;
  question: string;
  aliases: string;
  answer: string;
  is_enabled: boolean;
}

const emptyForm: FaqForm = { category_id: '', question: '', aliases: '', answer: '', is_enabled: false };

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [faqsRes, catsRes] = await Promise.all([
        fetch('/api/admin/faqs'),
        fetch('/api/admin/faq-categories')
      ]);
      const faqsData = await faqsRes.json();
      const catsData = await catsRes.json();
      setFaqs(faqsData.faqs || []);
      setCategories(catsData.categories || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load FAQs data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fuse = useMemo(() => {
    return new Fuse(faqs, {
      keys: [
        { name: 'question', weight: 0.6 },
        { name: 'answer', weight: 0.3 },
        { name: 'category_name', weight: 0.1 },
        { name: 'aliases', weight: 0.4 },
      ],
      threshold: 0.4,
    });
  }, [faqs]);

  const displayedFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    return fuse.search(searchQuery).map(res => res.item);
  }, [faqs, fuse, searchQuery]);

  async function handleCreate() {
    setError('');
    if (!form.question) {
      setError('Question is required');
      return;
    }
    setSaving(true);
    const body = {
       ...form, 
       category_id: form.category_id ? parseInt(form.category_id) : null 
    };
    
    // Server enforces that if answer is empty, is_enabled will be saved as 0
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowCreate(false);
    setForm(emptyForm);
    loadData();
  }

  async function handleUpdate() {
    setError('');
    if (!form.question) {
      setError('Question is required');
      return;
    }
    setSaving(true);
    const body = { 
      id: editingId, 
      ...form,
      category_id: form.category_id ? parseInt(form.category_id) : null 
    };
    const res = await fetch('/api/admin/faqs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    loadData();
  }

  async function handleDelete(id: number, question: string) {
    if (!confirm(`Delete FAQ "${question}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/faqs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    loadData();
  }

  async function toggleStatus(faq: Faq) {
    if (!faq.answer.trim() && !faq.is_enabled) {
      alert("Cannot enable an FAQ that has no answer.");
      return;
    }
    const res = await fetch('/api/admin/faqs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: faq.id, is_enabled: !faq.is_enabled }),
    });
    if (res.ok) {
       loadData();
    }
  }

  function startEdit(faq: Faq) {
    setShowCreate(false);
    setEditingId(faq.id);
    setForm({ 
      category_id: faq.category_id ? String(faq.category_id) : '', 
      question: faq.question,
      aliases: faq.aliases || '',
      answer: faq.answer,
      is_enabled: faq.is_enabled === 1
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setShowCreate(false);
    setForm(emptyForm);
    setError('');
  }

  // Prevents toggling form toggle if answer is empty
  function handleFormToggle() {
    if (form.answer.trim() === '') {
      alert('Answer must be provided before you can enable this FAQ.');
      return;
    }
    setForm(f => ({ ...f, is_enabled: !f.is_enabled }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  const renderFaqForm = (isInlineEdit = false) => (
    <div className={`bg-white ${!isInlineEdit ? 'rounded-xl border border-gray-200 p-6 mb-6 shadow-sm' : 'border-t border-b border-gray-100 p-6 bg-blue-50/30'}`}>
      {!isInlineEdit && (
        <h2 className="font-semibold text-gray-900 mb-5">New FAQ</h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div className="flex flex-col gap-1.5">
           <label className="text-sm font-medium text-gray-700">Category</label>
           <select
             value={form.category_id}
             onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
             className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
           >
             <option value="">No Category</option>
             {categories.map(c => (
               <option key={c.id} value={c.id.toString()}>{c.name}</option>
             ))}
           </select>
         </div>
         
         <div className="flex flex-col gap-1.5 justify-center">
             <label 
                className={`flex items-center gap-2 text-sm font-medium mt-6 select-none ${form.answer.trim() === '' ? 'cursor-not-allowed opacity-60 text-gray-400' : 'cursor-pointer text-gray-700'}`}
             >
                <button
                  type="button"
                  disabled={form.answer.trim() === ''}
                  onClick={handleFormToggle}
                  className={`transition-colors ${form.is_enabled && form.answer.trim() !== '' ? 'text-green-600' : 'text-gray-400'}`}
                >
                   {form.is_enabled && form.answer.trim() !== '' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                {form.is_enabled && form.answer.trim() !== '' ? 'Active/Enabled' : (form.answer.trim() === '' ? 'Disabled (Answer required)' : 'Draft/Disabled')}
             </label>
         </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
         <label className="text-sm font-medium text-gray-700">Question</label>
         <input
           placeholder="How do I reset my password?"
           value={form.question}
           onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))}
           className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
         />
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
         <label className="text-sm font-medium text-gray-700">Alternative Questions (Aliases)</label>
         <textarea
           placeholder="Additional ways users might ask this (one per line, optional)"
           value={form.aliases}
           onChange={(e) => setForm(f => ({ ...f, aliases: e.target.value }))}
           rows={2}
           className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-y text-gray-600 font-mono bg-white"
         />
      </div>

      <div className="flex flex-col gap-1.5 mb-6">
         <label className="text-sm font-medium text-gray-700">Answer</label>
         <textarea
           placeholder="You can reset your password by going to..."
           value={form.answer}
           onChange={(e) => {
              const newAnswer = e.target.value;
              setForm(f => ({ 
                 ...f, 
                 answer: newAnswer,
                 is_enabled: newAnswer.trim() === '' ? false : f.is_enabled
              }));
           }}
           rows={4}
           className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-y bg-white"
         />
      </div>

      <div className="flex gap-3 justify-end pt-2">
         <button
            onClick={cancelEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={isInlineEdit ? handleUpdate : handleCreate}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isInlineEdit ? 'Save Changes' : 'Create FAQ'}
          </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">FAQ Items</h1>
        
        <div className="flex flex-1 max-w-md ml-auto relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-shadow"
          />
        </div>

        <button
          onClick={() => { setEditingId(null); setShowCreate(true); setForm(emptyForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {showCreate && renderFaqForm(false)}

      {/* FAQs List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {displayedFaqs.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No FAQs match your search.' : 'No FAQs found. Add your first question above!'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
             {displayedFaqs.map((faq) => {
                if (editingId === faq.id) {
                   return (
                     <li key={`edit-${faq.id}`}>
                       {renderFaqForm(true)}
                     </li>
                   );
                }

                return (
                  <li key={faq.id} className="p-4 hover:bg-gray-50 transition-colors">
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 pb-1 flex-wrap">
                              <h3 className="text-sm font-medium text-gray-900">{faq.question}</h3>
                              {!faq.is_enabled && (
                                 <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Draft / Hidden</span>
                              )}
                              {faq.category_name && (
                                 <span className="px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple text-[10px] font-semibold uppercase tracking-wider text-nowrap">
                                    {faq.category_name}
                                 </span>
                              )}
                            </div>
                            {faq.answer && (
                               <p className="text-xs text-gray-500 line-clamp-2 mt-1">{faq.answer}</p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                           <button
                             onClick={() => toggleStatus(faq)}
                             disabled={!faq.answer.trim()}
                             className={`p-1.5 rounded-lg transition-colors ${!faq.answer.trim() ? 'opacity-40 cursor-not-allowed text-gray-400' : faq.is_enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-gray-100'}`}
                             title={!faq.answer.trim() ? 'Must have an answer to enable' : faq.is_enabled ? 'Disable' : 'Enable'}
                           >
                             {faq.is_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                           </button>
                           <button
                             onClick={() => startEdit(faq)}
                             className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                             title="Edit"
                           >
                             <Pencil size={18} />
                           </button>
                           <button
                             onClick={() => handleDelete(faq.id, faq.question)}
                             className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                             title="Delete"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  </li>
                );
             })}
          </ul>
        )}
      </div>
    </div>
  );
}
