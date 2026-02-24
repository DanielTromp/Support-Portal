'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Language } from '@/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>('nl');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t(lang, 'login_error'));
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <>
      {/* Language toggle in header */}
      <button
        onClick={() => setLang((l) => (l === 'nl' ? 'en' : 'nl'))}
        className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium uppercase transition-colors"
      >
        {lang === 'nl' ? 'EN' : 'NL'}
      </button>

      <div className="bg-gradient-to-r from-brand-navy to-brand-purple px-8 py-8 text-center relative">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t(lang, 'login_title')}</h1>
        <p className="text-white/70 text-sm mt-1">{t(lang, 'login_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t(lang, 'login_username')}
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
              placeholder={t(lang, 'login_username_placeholder')}
              required
              autoFocus
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t(lang, 'login_password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
              placeholder={t(lang, 'login_password_placeholder')}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-purple text-white rounded-xl font-medium text-sm hover:bg-brand-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t(lang, 'login_loading') : t(lang, 'login_submit')}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
          <Suspense fallback={<div className="p-8 text-center text-gray-400">Laden...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
