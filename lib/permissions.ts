// UserRole import removed - using normalized Role from lib/roles
import { Role, prismaRoleToRole } from './roles';

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

const rolePermissions: Record<Role, Permission[]> = {
  super_admin: [
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
  admin: [
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
  instructor: [
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
  commander: [
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
  trainee: [
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

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = typeof role === 'string' && role.includes('_') 
    ? prismaRoleToRole(role) 
    : role as Role;
  return rolePermissions[normalizedRole]?.includes(permission) ?? false;
}

export function canAccessRoute(role: Role, route: string): boolean {
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
