"use client";

import { Language } from "@/types";
import { t } from "@/lib/i18n";
import { Search, X } from "lucide-react";

interface HeroSearchProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalArticles: number;
  totalCategories: number;
}

export default function HeroSearch({
  language,
  searchQuery,
  onSearchChange,
  totalArticles,
  totalCategories,
}: HeroSearchProps) {
  return (
    <section className="gradient-hero relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-brand-purple-glow/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
            {t(language, "hero_title")}
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 text-balance">
            {t(language, "hero_subtitle")}
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto animate-slide-up">
          <div className="relative search-glow rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={22} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t(language, "search_placeholder")}
              className="w-full pl-14 pr-12 py-4 sm:py-5 rounded-2xl text-lg bg-white text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0 shadow-2xl shadow-black/20"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {totalArticles > 0 && (
          <div className="flex items-center justify-center gap-4 mt-8 text-white/50 text-sm animate-fade-in">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-purple-glow" />
              {totalArticles} {t(language, "articles")}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-purple-light" />
              {totalCategories} {t(language, "categories")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
