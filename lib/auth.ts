import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';
// UserRole import removed - using normalized Role from lib/roles
import { normalizeRole, prismaRoleToRole } from './roles';

export const authOptions: NextAuthOptions = {
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'super@kbn.local'
        },
        password: {
          label: 'Password',
          type: 'password'
        },
        csrfToken: {
          label: 'CSRF Token',
          type: 'text'
        }
      },
      async authorize(credentials, req) {
        // For demo purposes - always authenticate any valid credentials
        if (credentials?.email && credentials?.password) {
          return {
            id: '1',
            email: credentials.email,
            name: 'Demo User',
            role: 'super_admin',
            unit: 'Command',
            rank: 'Colonel',
            locale: 'ar',
            image: null,
          } as any;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const raw = (user as any).role ?? token.role;
        token.role = normalizeRole(raw) ?? 'trainee';
        token.unit = user.unit;
        token.rank = user.rank;
        token.locale = user.locale;
      } else {
        token.role = normalizeRole((token as any).role) ?? 'trainee';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = normalizeRole((token as any).role) ?? 'trainee' as any;
        session.user.unit = (token.unit as string | null) || undefined;
        session.user.rank = (token.rank as string | null) || undefined;
        session.user.locale = token.locale as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};
