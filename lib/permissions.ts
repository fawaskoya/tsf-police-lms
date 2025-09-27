import { UserRole } from '@prisma/client';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'courses:read'
  | 'courses:write'
  | 'courses:delete'
  | 'exams:read'
  | 'exams:write'
  | 'exams:delete'
  | 'sessions:read'
  | 'sessions:write'
  | 'sessions:delete'
  | 'reports:read'
  | 'reports:write'
  | 'certificates:read'
  | 'certificates:write'
  | 'audit:read'
  | 'settings:read'
  | 'settings:write'
  | 'learning:read'
  | 'learning:write'
  | 'files:read'
  | 'files:write'
  | 'files:upload'
  | 'files:delete'
  | 'notifications:read'
  | 'notifications:write';

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'courses:read',
    'courses:write',
    'courses:delete',
    'exams:read',
    'exams:write',
    'exams:delete',
    'sessions:read',
    'sessions:write',
    'sessions:delete',
    'reports:read',
    'reports:write',
    'certificates:read',
    'certificates:write',
    'audit:read',
    'settings:read',
    'settings:write',
    'learning:read',
    'learning:write',
    'files:read',
    'files:write',
    'files:upload',
    'files:delete',
    'notifications:read',
    'notifications:write',
  ],
  ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'courses:read',
    'courses:write',
    'courses:delete',
    'exams:read',
    'exams:write',
    'exams:delete',
    'sessions:read',
    'sessions:write',
    'sessions:delete',
    'reports:read',
    'reports:write',
    'certificates:read',
    'certificates:write',
    'settings:read',
    'settings:write',
    'learning:read',
    'learning:write',
    'files:read',
    'files:write',
    'files:upload',
    'files:delete',
    'notifications:read',
    'notifications:write',
  ],
  INSTRUCTOR: [
    'courses:read',
    'courses:write',
    'exams:read',
    'exams:write',
    'sessions:read',
    'sessions:write',
    'reports:read',
    'certificates:read',
    'learning:read',
    'learning:write',
    'files:read',
    'files:upload',
    'notifications:read',
  ],
  COMMANDER: [
    'users:read',
    'courses:read',
    'exams:read',
    'sessions:read',
    'reports:read',
    'certificates:read',
    'learning:read',
    'files:read',
    'notifications:read',
  ],
  TRAINEE: [
    'courses:read',
    'exams:read',
    'sessions:read',
    'certificates:read',
    'learning:read',
    'learning:write',
    'files:read',
    'notifications:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': ['users:read'],
    '/admin/users': ['users:read'],
    '/admin/courses': ['courses:read'],
    '/admin/exams': ['exams:read'],
    '/admin/sessions': ['sessions:read'],
    '/admin/reports': ['reports:read'],
    '/admin/settings': ['settings:read'],
    '/admin/audit-log': ['audit:read'],
    '/commander': ['reports:read'],
    '/trainee': ['learning:read'],
    '/instructor': ['courses:read'],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) return true;

  return requiredPermissions.some(permission => hasPermission(role, permission));
}
