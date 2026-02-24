"use client";

import { FaqItem } from "@/types";
import { ChevronRight } from "lucide-react";

interface FaqCardProps {
  item: FaqItem;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function FaqCard({
  item,
  isExpanded,
  onToggle,
  searchQuery,
}: FaqCardProps) {
  return (
    <div className="faq-card">
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 sm:p-5 text-left group"
      >
        <ChevronRight
          size={20}
          className={`flex-shrink-0 mt-0.5 text-brand-purple transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
        <span className="font-medium text-gray-800 group-hover:text-brand-navy transition-colors leading-relaxed">
          {highlightText(item.question, searchQuery)}
        </span>
      </button>

      <div className={`accordion-content ${isExpanded ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-12 sm:pl-14">
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
              {highlightText(item.answer, searchQuery)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
