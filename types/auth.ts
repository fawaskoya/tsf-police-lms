import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unit?: string | null;
  rank?: string | null;
  locale: string;
  image?: string | null;
}

declare module 'next-auth' {
  interface Session {
    user: User;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    unit?: string;
    rank?: string;
    locale: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    unit?: string;
    rank?: string;
    locale: string;
  }
}
