import { Role } from '@/lib/roles';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  unit?: string | null;
  rank?: string | null;
  locale: string;
  image?: string | null;
}

// Note: next-auth is installed but not currently used in this project.
// The project uses custom JWT authentication via @/lib/auth-server.
// These module augmentations are commented out to avoid TypeScript errors.
//
// declare module 'next-auth' {
//   interface Session {
//     user: User;
//   }
//
//   interface User {
//     id: string;
//     email: string;
//     name: string;
//     role: Role;
//     unit?: string;
//     rank?: string;
//     locale: string;
//     image?: string | null;
//   }
// }
//
// declare module 'next-auth/jwt' {
//   interface JWT {
//     role: Role;
//     unit?: string;
//     rank?: string;
//     locale: string;
//   }
// }
