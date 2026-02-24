import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compareSync } from 'bcryptjs';
import { getDb } from './db';
import authConfig from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const db = getDb();
        const user = db
          .prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?')
          .get(credentials.username as string) as
          | { id: number; username: string; password_hash: string; role: string }
          | undefined;

        if (!user) return null;
        if (!compareSync(credentials.password as string, user.password_hash)) return null;

        return {
          id: String(user.id),
          name: user.username,
          role: user.role,
        };
      },
    }),
  ],
});
