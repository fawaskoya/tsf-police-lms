#!/bin/bash

# TSF Police LMS Setup Script
# This script sets up the development environment with proper error handling

set -e  # Exit on any error

echo "🚀 Setting up TSF Police LMS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

log "Node.js version check passed: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    warning "Docker is not installed. Please install Docker to run the database and services."
fi

# Clean previous build
log "Cleaning previous build artifacts..."
if [ -d ".next" ]; then
    rm -rf .next
    success "Removed .next directory"
fi

if [ -d "node_modules" ]; then
    rm -rf node_modules
    success "Removed node_modules"
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    success "Removed package-lock.json"
fi

# Install dependencies
log "Installing dependencies..."
if command -v pnpm &> /dev/null; then
    log "Using pnpm for package management"
    pnpm install
else
    log "Using npm for package management"
    npm install
fi

if [ $? -ne 0 ]; then
    error "Failed to install dependencies"
    exit 1
fi

success "Dependencies installed successfully"

# Generate Prisma client
log "Generating Prisma client..."
if command -v pnpm &> /dev/null; then
    pnpm db:generate
else
    npm run db:generate
fi

if [ $? -ne 0 ]; then
    error "Failed to generate Prisma client"
    exit 1
fi

success "Prisma client generated"

# Check if Docker services are running
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    log "Checking Docker services..."

    if docker-compose ps | grep -q "tsf-lms-postgres"; then
        success "Docker services are running"
    else
        warning "Docker services not running. Starting them..."
        docker-compose up -d

        if [ $? -eq 0 ]; then
            success "Docker services started"
        else
            warning "Failed to start Docker services. Please start them manually with: docker-compose up -d"
        fi
    fi
else
    warning "Docker not available. Please ensure PostgreSQL is running manually."
fi

# Push database schema
log "Setting up database schema..."
if command -v pnpm &> /dev/null; then
    pnpm db:push
else
    npm run db:push
fi

if [ $? -ne 0 ]; then
    error "Failed to setup database schema"
    exit 1
fi

success "Database schema created"

# Seed database
log "Seeding database with demo data..."
if command -v pnpm &> /dev/null; then
    pnpm db:seed
else
    npm run db:seed
fi

if [ $? -ne 0 ]; then
    error "Failed to seed database"
    exit 1
fi

success "Database seeded with demo data"

# Type checking
log "Running type checks..."
if command -v pnpm &> /dev/null; then
    pnpm type-check
else
    npm run type-check
fi

if [ $? -ne 0 ]; then
    warning "Type checking failed. Please fix TypeScript errors."
else
    success "Type checking passed"
fi

# Lint checking
log "Running lint checks..."
if command -v pnpm &> /dev/null; then
    pnpm lint
else
    npm run lint
fi

if [ $? -ne 0 ]; then
    warning "Linting failed. Please fix ESLint errors."
else
    success "Linting passed"
fi

# Create logs directory
log "Setting up logging..."
mkdir -p logs
success "Logs directory created"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Start the development server:"
if command -v pnpm &> /dev/null; then
    echo "     pnpm dev"
else
    echo "     npm run dev"
fi
echo ""
echo "  2. Open http://localhost:3000 in your browser"
echo ""
echo "  3. Login with demo credentials:"
echo "     - Super Admin: super@kbn.local / Passw0rd!"
echo "     - Admin: admin@kbn.local / Passw0rd!"
echo "     - Commander: commander@kbn.local / Passw0rd!"
echo ""
echo "📊 Available scripts:"
if command -v pnpm &> /dev/null; then
    echo "  pnpm dev          - Start development server"
    echo "  pnpm build        - Build for production"
    echo "  pnpm test         - Run tests"
    echo "  pnpm db:studio    - Open Prisma Studio"
    echo "  pnpm error:check  - Run error checking"
else
    echo "  npm run dev       - Start development server"
    echo "  npm run build     - Build for production"
    echo "  npm run test      - Run tests"
    echo "  npm run db:studio - Open Prisma Studio"
    echo "  npm run error:check - Run error checking"
fi
echo ""
echo "🔍 Error monitoring:"
echo "  node scripts/error-monitor.js analyze  - Analyze error logs"
echo "  node scripts/error-monitor.js health   - Check system health"
echo ""
echo "📝 Happy coding! 🚀"
