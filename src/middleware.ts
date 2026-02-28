import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// Use the wrapper form so we handle routing ourselves (no `authorized` callback).
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Auth routes are always public
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Not logged in
  if (!req.auth) {
    // API routes get a JSON 401 — never a redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page routes redirect to login
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require elevated role (not just 'user')
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!req.auth.user?.role || req.auth.user.role === 'user') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
