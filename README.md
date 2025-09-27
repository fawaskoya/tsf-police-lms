# TSF Police Learning Management System

A production-grade LMS for Qatar's Ministry of Interior (MOI) TSF Police, built with Next.js 14, TypeScript, and modern web technologies.

## 🏛️ Overview

This LMS serves the Qatar TSF Police with comprehensive training management, including course delivery, assessment, certification, and compliance tracking. The system features Arabic-first design with RTL support, role-based access control, and government-grade security.

## ✨ Features

### 🎯 Core Functionality
- **Multi-role Support**: Super Admin, Admin, Instructor, Commander, Trainee
- **Arabic RTL First**: Complete RTL support with English fallback
- **Course Management**: E-Learning, Classroom, and Blended modalities
- **Advanced Assessments**: MCQ, MSQ, True/False, Numeric, Short Answer
- **Certification System**: Digital certificates with QR verification
- **Session Management**: Classroom and field training with attendance
- **Reporting & Analytics**: Metabase integration with custom SQL reports

### 🔒 Security & Compliance
- **CSP & Headers**: Strict Content Security Policy with nonces
- **Rate Limiting**: Per-IP and per-user request throttling
- **Audit Logging**: Immutable audit trail with hash chaining
- **Input Validation**: Comprehensive Zod schema validation
- **Role-based Access**: Granular permissions system

### 🛠️ Technical Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js with Credentials + OIDC stub
- **UI**: shadcn/ui components, Lucide icons, Framer Motion
- **State**: TanStack Query, React Hook Form
- **i18n**: next-intl with Arabic/English support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Docker & Docker Compose (for development)

### 1. Clone & Install
```bash
git clone <repository-url>
cd tsf-police-lms
pnpm install
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
```bash
# Start PostgreSQL, MinIO, and Metabase
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:push

# Seed with demo data
pnpm db:seed
```

### 4. Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` and log in with:
- **Super Admin**: `super@kbn.local` / `Passw0rd!`
- **Admin**: `admin@kbn.local` / `Passw0rd!`
- **Instructor**: `instructor@kbn.local` / `Passw0rd!`
- **Commander**: `commander@kbn.local` / `Passw0rd!`

## 📁 Project Structure

```
apps/web/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (admin)/          # Admin role pages
│   ├── (instructor)/     # Instructor role pages
│   ├── (commander)/      # Commander role pages
│   ├── (trainee)/        # Trainee role pages
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── Shell.tsx         # Main layout shell
│   ├── StatCard.tsx      # KPI cards
│   └── LanguageSwitch.tsx # Language toggle
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   ├── audit.ts          # Audit logging
│   ├── csp.ts            # CSP utilities
│   ├── permissions.ts    # Role permissions
│   └── utils.ts          # Utility functions
├── messages/             # i18n translations
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Demo data seeding
└── types/                # TypeScript definitions
```

## 🔐 Authentication & SSO

### Development (Credentials)
The system uses NextAuth with credentials provider for development. Demo accounts are seeded with the database.

### Production (OIDC/Keycloak)
For production deployment:

1. Configure Keycloak realm with TSF Police settings
2. Update environment variables:
   ```env
   OIDC_ISSUER_URL=https://keycloak.example.com/realms/tsf
   OIDC_CLIENT_ID=tsf-lms
   OIDC_CLIENT_SECRET=your-client-secret
   ```
3. Update `lib/auth.ts` to use OIDC provider instead of credentials
4. Map Keycloak roles to LMS roles in the JWT callback

## 🌐 Internationalization

### Adding New Languages
1. Create new JSON file in `messages/` directory
2. Add locale to `lib/i18n.ts`
3. Update `next.config.js` locales array
4. Add language option to `LanguageSwitch.tsx`

### RTL Support
- Arabic is the default locale with full RTL support
- CSS automatically applies RTL transformations
- Icons and layouts mirror correctly in RTL mode

## 📊 Reporting & Analytics

### Metabase Integration
1. Access Metabase at `http://localhost:3001`
2. Default credentials: admin@example.com / admin123
3. Create dashboard for LMS KPIs
4. Embed dashboard using iframe in admin reports page

### Custom SQL Reports
Pre-built reports include:
- Certificate expiry (30/60/90 days)
- Pass rates by unit
- Attempt forensics
- User training status

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests (Playwright)
```bash
# Install browsers
pnpm exec playwright install

# Run tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

### Test Coverage
- Authentication flow
- Course creation and enrollment
- Exam taking and scoring
- Certificate generation
- Report exports

## 🚀 Production Deployment

### Build & Deploy
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/tsf_lms

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here

# Storage (Production)
STORAGE_DRIVER=minio
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key

# OIDC (Production)
OIDC_ISSUER_URL=https://keycloak.your-domain.com/realms/tsf
OIDC_CLIENT_ID=tsf-lms
OIDC_CLIENT_SECRET=your-client-secret

# Security
CSP_REPORT_ONLY=false
NODE_ENV=production
```

### Security Checklist
- [ ] HTTPS enabled with valid certificate
- [ ] Database credentials rotated
- [ ] CSP in enforce mode (`CSP_REPORT_ONLY=false`)
- [ ] OIDC authentication configured
- [ ] Audit logs enabled and monitored
- [ ] Rate limiting tuned for production load
- [ ] File upload virus scanning implemented
- [ ] Email notifications configured for certificates

## 🔧 Development Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm type-check      # TypeScript type checking

# Database
pnpm db:generate     # Generate Prisma client
pnpm db:push         # Push schema changes
pnpm db:migrate      # Create and run migrations
pnpm db:seed         # Seed demo data
pnpm db:studio       # Open Prisma Studio

# Testing
pnpm test            # Run unit tests
pnpm test:e2e        # Run E2E tests
pnpm test:coverage   # Generate coverage report
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- ESLint and Prettier configured
- Conventional commits required
- TypeScript strict mode enabled
- Component naming follows shadcn/ui patterns

## 📄 License

This project is proprietary software for the Qatar Ministry of Interior.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting guide in docs/

---

Built with ❤️ for Qatar's TSF Police
