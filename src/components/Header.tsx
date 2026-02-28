"use client";

import { useState, useRef, useEffect } from "react";
import { Language, BrandConfig } from "@/types";
import { t } from "@/lib/i18n";
import { Globe, LogOut, User, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  brand: BrandConfig | null;
}

export default function Header({
  language,
  onLanguageChange,
  brand,
}: HeaderProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = brand?.companyName || "Support Portal";
  const hasAdminAccess = session?.user?.role && session.user.role !== "user";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

              {/* User menu */}
              {session?.user && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm"
                  >
                    <User size={16} />
                    <span className="hidden sm:inline">{session.user.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                        <p className="text-xs text-gray-400">
                          {t(language, session.user.role === 'admin' ? 'role_admin' : 'role_user')}
                        </p>
                      </div>
                      {hasAdminAccess && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Shield size={14} />
                          {t(language, "user_menu_admin")}
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={14} />
                        {t(language, "user_menu_signout")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Purple accent bar */}
      <div className="gradient-purple-bar h-1" />
    </header>
  );
}
