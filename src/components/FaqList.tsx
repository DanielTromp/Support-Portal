"use client";

import { useState } from "react";
import { FaqItem, Language } from "@/types";
import { t } from "@/lib/i18n";
import FaqCard from "./FaqCard";
import {
  ChevronDown,
  ChevronUp,
  SearchX,
  FileQuestion,
} from "lucide-react";

interface FaqListProps {
  language: Language;
  items: FaqItem[];
  searchQuery: string;
  isEmpty: boolean;
}

export default function FaqList({
  language,
  items,
  searchQuery,
  isEmpty,
}: FaqListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allExpanded = items.length > 0 && expandedIds.size === items.length;

  function toggleItem(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(items.map((i) => i.id)));
    }
  }

  // No data at all
  if (isEmpty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-purple-soft mb-6">
          <FileQuestion className="text-brand-purple" size={36} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t(language, "no_data")}
        </h3>
        <p className="text-gray-500">{t(language, "no_data_hint")}</p>
      </div>
    );
  }

  // No search results
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-50 mb-6">
          <SearchX className="text-orange-400" size={36} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {t(language, "no_results")}
        </h3>
        <p className="text-gray-500">{t(language, "no_results_hint")}</p>
        {searchQuery && (
          <p className="text-gray-400 text-sm mt-4">
            &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>
    );
  }

  // Group items by category
  const grouped = items.reduce<Record<string, FaqItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {searchQuery ? (
            <>
              <span className="font-semibold text-gray-700">{items.length}</span>{" "}
              {t(language, "results_for")}{" "}
              <span className="font-medium text-brand-purple">
                &ldquo;{searchQuery}&rdquo;
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-gray-700">{items.length}</span>{" "}
              {t(language, "articles")}
            </>
          )}
        </p>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-sm text-brand-purple hover:text-brand-purple-light transition-colors"
        >
          {allExpanded ? (
            <>
              <ChevronUp size={16} />
              {t(language, "collapse_all")}
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              {t(language, "expand_all")}
            </>
          )}
        </button>
      </div>

      {/* FAQ items grouped by category */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category} className="animate-fade-in">
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-brand-navy">
                {category}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {catItems.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {catItems.map((item) => (
                <FaqCard
                  key={item.id}
                  item={item}
                  isExpanded={expandedIds.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
