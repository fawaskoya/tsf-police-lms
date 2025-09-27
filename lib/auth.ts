import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo user authentication (bypass database for development)
        const demoUsers = {
          'super@kbn.local': {
            id: '1',
            email: 'super@kbn.local',
            name: 'أحمد الكبير',
            role: 'SUPER_ADMIN' as const,
            unit: 'Command',
            rank: 'Colonel',
            locale: 'ar',
            status: 'ACTIVE' as const,
          },
          'admin@kbn.local': {
            id: '2',
            email: 'admin@kbn.local',
            name: 'محمد العبدالله',
            role: 'ADMIN' as const,
            unit: 'Training',
            rank: 'Major',
            locale: 'ar',
            status: 'ACTIVE' as const,
          },
          'instructor@kbn.local': {
            id: '3',
            email: 'instructor@kbn.local',
            name: 'فاطمة السعد',
            role: 'INSTRUCTOR' as const,
            unit: 'Academy',
            rank: 'Captain',
            locale: 'ar',
            status: 'ACTIVE' as const,
          },
          'commander@kbn.local': {
            id: '4',
            email: 'commander@kbn.local',
            name: 'خالد المنصوري',
            role: 'COMMANDER' as const,
            unit: 'Operations',
            rank: 'Lieutenant Colonel',
            locale: 'ar',
            status: 'ACTIVE' as const,
          },
          'trainee@kbn.local': {
            id: '5',
            email: 'trainee@kbn.local',
            name: 'سارة الأحمد',
            role: 'TRAINEE' as const,
            unit: 'Patrol',
            rank: 'Sergeant',
            locale: 'ar',
            status: 'ACTIVE' as const,
          },
        };

        const user = demoUsers[credentials.email as keyof typeof demoUsers];

        if (!user || credentials.password !== 'Passw0rd!') {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          unit: user.unit,
          rank: user.rank,
          locale: user.locale,
          image: null,
        } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.unit = user.unit;
        token.rank = user.rank;
        token.locale = user.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
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
};
