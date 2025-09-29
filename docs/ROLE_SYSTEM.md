# Role System Documentation

## Overview

The TSF Police LMS uses a normalized role system with consistent snake_case naming across the entire application.

## Canonical Roles

- `super_admin` - Full system access
- `admin` - Administrative access
- `instructor` - Course and exam management
- `commander` - Command and compliance oversight
- `trainee` - Learning and assessment access

## Key Components

### 1. Role Helpers (`lib/roles.ts`)

- `normalizeRole()` - Converts any role format to snake_case
- `isSuperAdmin()` - Checks if user has super admin privileges
- `prismaRoleToRole()` - Converts Prisma enum values to normalized roles
- `roleToPrismaRole()` - Converts normalized roles to Prisma enum values

### 2. NextAuth Integration

The authentication system automatically normalizes roles in JWT tokens and sessions:

```typescript
// In auth callbacks
token.role = normalizeRole(raw) ?? 'trainee';
session.user.role = normalizeRole(token.role) ?? 'trainee';
```

### 3. Dashboard Data Flow

- **Production**: Always uses real database data
- **Development**: Uses mock data only when explicitly enabled via environment flags:
  - `NEXT_PUBLIC_USE_MOCK=1`
  - `USE_MOCK=true`

### 4. ESLint Protection

Prevents role naming regressions with restricted syntax rules:

```json
"no-restricted-syntax": [
  "error",
  {
    "selector": "Literal[value='super.admin']",
    "message": "Use 'super_admin' (snake_case) for role strings."
  }
]
```

## Database Schema

The Prisma schema uses string roles for consistency:

```prisma
model User {
  role String @default("trainee")
}
```

## Environment Configuration

### Development
```bash
# Enable mock data
NEXT_PUBLIC_USE_MOCK=1
USE_MOCK=true
```

### Production
```bash
# Disable mock data (default)
NEXT_PUBLIC_USE_MOCK=0
USE_MOCK=false
NODE_ENV=production
```

## Testing

Run role system tests:

```bash
npm test lib/__tests__/roles.test.ts
```

## Migration Guide

If you encounter old role formats, use the normalization helpers:

```typescript
import { normalizeRole } from '@/lib/roles';

// Convert any format to canonical
const canonicalRole = normalizeRole('super.admin'); // 'super_admin'
const canonicalRole2 = normalizeRole('SUPER_ADMIN'); // 'super_admin'
```

## Verification Checklist

- [ ] All role checks use `super_admin` (not `super.admin`, `superAdmin`, etc.)
- [ ] Dashboard shows real data in production
- [ ] Mock data only used in development with explicit flags
- [ ] ESLint passes without role-related errors
- [ ] Database uses string roles consistently
- [ ] NextAuth callbacks normalize roles properly
