"use client";

import { Language } from "@/types";
import { t } from "@/lib/i18n";
import {
  Database,
  Radio,
  CreditCard,
  Phone,
  PhoneOutgoing,
  Globe,
  Voicemail,
  MessageCircle,
  HelpCircle,
  LayoutGrid,
  Wifi,
  Shield,
  Settings,
  Users,
  Mail,
  FileText,
  Headphones,
  Zap,
  Cloud,
  Lock,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

interface CategoryFilterProps {
  language: Language;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  categoryCounts: Record<string, number>;
}

/** Keyword-based icon heuristic — matches category name fragments to icons */
const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/data/i, Database],
  [/dekking|coverage|network/i, Radio],
  [/sim/i, CreditCard],
  [/volte/i, Phone],
  [/voice.*roam|roam.*voice/i, Globe],
  [/voice|call|bellen/i, PhoneOutgoing],
  [/voicemail/i, Voicemail],
  [/sms|messag|bericht/i, MessageCircle],
  [/wifi|internet|connect/i, Wifi],
  [/secur|beveilig|security/i, Shield],
  [/setting|instell|config/i, Settings],
  [/account|user|gebruiker/i, Users],
  [/mail|email|e-mail/i, Mail],
  [/document|file|bestand/i, FileText],
  [/support|help|hulp/i, Headphones],
  [/fast|snel|speed/i, Zap],
  [/cloud|storage|opslag/i, Cloud],
  [/privacy|lock|wachtwoord|password/i, Lock],
  [/bill|factu|invoice|cost|kosten|price|prijs/i, DollarSign],
];

function getIconForCategory(name: string): React.ReactNode {
  for (const [pattern, Icon] of KEYWORD_ICONS) {
    if (pattern.test(name)) {
      return <Icon size={16} />;
    }
  }
  return <HelpCircle size={16} />;
}

export default function CategoryFilter({
  language,
  categories,
  activeCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {/* All categories chip */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`category-chip flex items-center gap-2 ${
            activeCategory === null
              ? "category-chip-active"
              : "category-chip-inactive"
          }`}
        >
          <LayoutGrid size={16} />
          {t(language, "all_categories")}
        </button>

        {/* Category chips */}
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              onCategoryChange(activeCategory === cat ? null : cat)
            }
            className={`category-chip flex items-center gap-2 ${
              activeCategory === cat
                ? "category-chip-active"
                : "category-chip-inactive"
            }`}
          >
            {getIconForCategory(cat)}
            {cat}
            {categoryCounts[cat] !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat
                    ? "bg-white/20"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {categoryCounts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
