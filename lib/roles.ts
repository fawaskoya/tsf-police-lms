export const ROLES = ['super_admin', 'admin', 'instructor', 'commander', 'trainee'] as const;
export type Role = typeof ROLES[number];

export const isRole = (val: unknown): val is Role =>
  typeof val === 'string' && (ROLES as readonly string[]).includes(val);

export const isSuperAdmin = (u?: { role?: string | null }) =>
  u?.role === 'super_admin';

export const normalizeRole = (val?: string | null): Role | undefined => {
  if (!val) return undefined;
  const v = String(val).toLowerCase().replace(/[\.\-]/g, '_'); // dot/hyphen → underscore
  return isRole(v) ? (v as Role) : undefined;
};

// Helper to convert Prisma enum to normalized role
export const prismaRoleToRole = (prismaRole: string): Role => {
  const normalized = normalizeRole(prismaRole);
  if (normalized) return normalized;
  
  // Handle Prisma enum values (uppercase with underscores)
  const roleMap: Record<string, Role> = {
    'SUPER_ADMIN': 'super_admin',
    'ADMIN': 'admin',
    'INSTRUCTOR': 'instructor',
    'COMMANDER': 'commander',
    'TRAINEE': 'trainee',
  };
  
  return roleMap[prismaRole] || 'trainee';
};

// Helper to convert normalized role back to Prisma enum
export const roleToPrismaRole = (role: Role): string => {
  const roleMap: Record<Role, string> = {
    'super_admin': 'SUPER_ADMIN',
    'admin': 'ADMIN',
    'instructor': 'INSTRUCTOR',
    'commander': 'COMMANDER',
    'trainee': 'TRAINEE',
  };
  
  return roleMap[role];
};
