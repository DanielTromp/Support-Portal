import type { NextAuthConfig } from 'next-auth';

// Edge-safe config — no Node.js dependencies (no DB, no bcrypt).
// Used by middleware. The full auth.ts extends this with the Credentials provider.
export default {
  providers: [],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.userId = user.id!;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.userId;
      return session;
    },
  },
} satisfies NextAuthConfig;
