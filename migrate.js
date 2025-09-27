const { execSync } = require('child_process');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable not set.');
      console.error('Please run: export DATABASE_URL="your_database_url_here"');
      process.exit(1);
    }

    // Run Prisma migration
    console.log('📦 Running database migration...');
    const migrateOutput = execSync('npx prisma db push --accept-data-loss', {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    console.log('✅ Migration completed successfully!');

    // Run seeding
    console.log('🌱 Running database seeding...');
    const seedOutput = execSync('npx prisma db seed', {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    console.log('✅ Seeding completed successfully!');
    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
