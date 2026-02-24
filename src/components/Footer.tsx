"use client";

import { Language, BrandConfig } from "@/types";
import { t } from "@/lib/i18n";

interface FooterProps {
  language: Language;
  brand: BrandConfig | null;
}

export default function Footer({ language, brand }: FooterProps) {
  const displayName = brand?.companyName || "Support Portal";

  return (
    <footer className="bg-brand-navy mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and version */}
          <div className="flex items-center gap-3">
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={displayName}
                className="h-6 w-auto flex-shrink-0 opacity-80"
              />
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                className="flex-shrink-0"
              >
                <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5" />
                <path
                  d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16"
                  stroke="var(--brand-primary-glow, #A855F7)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <div>
              <span className="text-white/80 text-sm font-semibold">
                {displayName}
              </span>
              <span className="text-white/30 text-xs ml-2">
                {t(language, "footer_version")}
              </span>
            </div>
          </div>

          {/* Contact info or disclaimer */}
          <div className="text-right">
            {brand?.supportEmail || brand?.supportPhone ? (
              <p className="text-white/50 text-xs">
                {brand.supportEmail && (
                  <span>{brand.supportEmail}</span>
                )}
                {brand.supportEmail && brand.supportPhone && (
                  <span className="mx-2">|</span>
                )}
                {brand.supportPhone && (
                  <span>{brand.supportPhone}</span>
                )}
              </p>
            ) : null}
            <p className="text-white/30 text-xs text-center sm:text-right max-w-md leading-relaxed mt-1">
              {t(language, "footer_disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
