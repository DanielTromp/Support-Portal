"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import { FaqData, FaqItem, Language } from "@/types";
import { computeBrandCssVars } from "@/lib/brand-theme";
import Header from "@/components/Header";
import HeroSearch from "@/components/HeroSearch";
import CategoryFilter from "@/components/CategoryFilter";
import FaqList from "@/components/FaqList";
import ChatPanel from "@/components/ChatPanel";
import Footer from "@/components/Footer";

function trackActivity(action: string, details?: Record<string, unknown>) {
  fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, details }),
  }).catch(() => {});
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("nl");
  const [faqData, setFaqData] = useState<FaqData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const trackedPageView = useRef(false);

  // Load FAQ data
  const loadFaqData = useCallback(async () => {
    try {
      const res = await fetch("/api/faq");
      const data: FaqData = await res.json();
      setFaqData(data);
    } catch (error) {
      console.error("Failed to load FAQ data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqData();
    if (!trackedPageView.current) {
      trackActivity('page_view', { page: '/' });
      trackedPageView.current = true;
    }
  }, [loadFaqData]);

  // Compute brand CSS variables
  const brandCssVars = useMemo(() => {
    if (!faqData?.brand) return undefined;
    return computeBrandCssVars(faqData.brand) as React.CSSProperties;
  }, [faqData?.brand]);

  // Dynamic document title
  useEffect(() => {
    if (faqData?.brand?.companyName) {
      document.title = `${faqData.brand.companyName} — Support Portal`;
    } else {
      document.title = "Support Portal";
    }
  }, [faqData?.brand?.companyName]);

  // Fuse.js search index
  const fuse = useMemo(() => {
    if (!faqData?.items.length) return null;
    return new Fuse(faqData.items, {
      keys: [
        { name: "question", weight: 0.6 },
        { name: "aliases", weight: 0.5 },
        { name: "answer", weight: 0.3 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [faqData?.items]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!faqData?.items) return {};
    return faqData.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
  }, [faqData?.items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!faqData?.items) return [];

    let results: FaqItem[];

    // Apply search
    if (searchQuery.length >= 2 && fuse) {
      results = fuse.search(searchQuery).map((r) => r.item);
    } else {
      results = faqData.items;
    }

    // Apply category filter
    if (activeCategory) {
      results = results.filter((item) => item.category === activeCategory);
    }

    return results;
  }, [faqData?.items, searchQuery, activeCategory, fuse]);

  const isEmpty = !faqData?.items || faqData.items.length === 0;
  const brand = faqData?.brand ?? null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={brandCssVars}>
      <Header
        language={language}
        onLanguageChange={setLanguage}
        brand={brand}
      />

      <main className="flex-1">
        <HeroSearch
          language={language}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.length > 0) setActiveCategory(null);
            if (q.length >= 2) trackActivity('search', { query: q });
          }}
          totalArticles={faqData?.items.length ?? 0}
          totalCategories={faqData?.categories.length ?? 0}
        />

        <CategoryFilter
          language={language}
          categories={faqData?.categories ?? []}
          activeCategory={activeCategory}
          onCategoryChange={(cat) => {
            setActiveCategory(cat);
            if (cat) trackActivity('category_filter', { category: cat });
          }}
          categoryCounts={categoryCounts}
        />

        <FaqList
          language={language}
          items={filteredItems}
          searchQuery={searchQuery}
          isEmpty={isEmpty}
        />
      </main>

      <Footer language={language} brand={brand} />


      <ChatPanel language={language} />
    </div>
  );
}
