#!/bin/bash

# TSF Police LMS Database Migration Script
# Run this script to migrate and seed the database

echo "🚀 TSF Police LMS Database Setup"
echo "==============================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set."
    echo "Please set it first:"
    echo "export DATABASE_URL='your_database_url_here'"
    exit 1
fi

echo "📦 Running database migration..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

echo "🌱 Running database seeding..."
npx prisma db seed

if [ $? -eq 0 ]; then
    echo "✅ Seeding completed successfully!"
    echo "🎉 Database setup complete!"
    echo ""
    echo "Your LMS is now ready at:"
    echo "https://tsf-police-rl5zj294d-fawas-koyas-projects.vercel.app"
else
    echo "❌ Seeding failed!"
    exit 1
fi
