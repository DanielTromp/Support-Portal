"use client";

import { Language, BrandConfig } from "@/types";
import { t } from "@/lib/i18n";
import { Globe, Upload } from "lucide-react";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onUploadClick: () => void;
  brand: BrandConfig | null;
}

export default function Header({
  language,
  onLanguageChange,
  onUploadClick,
  brand,
}: HeaderProps) {
  const displayName = brand?.companyName || "Support Portal";

  return (
    <header className="sticky top-0 z-50">
      {/* Main nav bar */}
      <nav className="bg-brand-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {brand?.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={displayName}
                    className="h-8 w-auto flex-shrink-0"
                  />
                ) : (
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    className="flex-shrink-0"
                  >
                    <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2.5" fill="none" />
                    <path
                      d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16"
                      stroke="var(--brand-primary-glow, #A855F7)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 16C13 14.343 14.343 13 16 13C17.657 13 19 14.343 19 16"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span className="text-white text-xl font-bold tracking-tight">
                  {displayName}
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/20 mx-2" />
              <span className="hidden sm:block text-white/70 text-sm font-medium">
                {t(language, "title")}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <button
                onClick={onUploadClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">
                  {t(language, "upload_pdf")}
                </span>
              </button>

              {/* Language toggle */}
              <button
                onClick={() =>
                  onLanguageChange(language === "nl" ? "en" : "nl")
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <Globe size={16} />
                <span className="font-medium uppercase">
                  {language === "nl" ? "EN" : "NL"}
                </span>
              </button>

            </div>
          </div>
        </div>
      </nav>
      {/* Purple accent bar */}
      <div className="gradient-purple-bar h-1" />
    </header>
  );
}
