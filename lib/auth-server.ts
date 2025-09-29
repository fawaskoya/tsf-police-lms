import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  unit: string;
  rank: string;
  locale: string;
}

export async function getServerSession(): Promise<{ user: User } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as User;

    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        unit: decoded.unit,
        rank: decoded.rank,
        locale: decoded.locale,
      }
    };
  } catch (error) {
    console.log('Session verification failed:', error);
    return null;
  }
}

export function getRolePrefix(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return 'admin';
    case 'instructor':
      return 'instructor';
    case 'commander':
      return 'commander';
    case 'trainee':
      return 'trainee';
    default:
      return 'admin';
  }
}
