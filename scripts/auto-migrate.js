#!/usr/bin/env node

/**
 * Auto-migration script for Vercel deployments
 * Runs database migrations automatically during build
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  console.log('🔄 Starting automatic database migration...');

  // Check for database connection
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ ERROR: No database connection string found!');
    console.error('   Set POSTGRES_URL or DATABASE_URL environment variable');
    process.exit(1);
  }

  try {
    // Dynamic import to handle ESM
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl);

    console.log('📊 Reading schema file...');
    const schemaPath = join(__dirname, '../db/schema/001_initial_schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('🗄️  Executing database schema...');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql(statement);
        if ((i + 1) % 5 === 0) {
          console.log(`   Progress: ${i + 1}/${statements.length} statements`);
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Skipping existing object (${i + 1}/${statements.length})`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Database migrations completed successfully!');
    console.log(`   Total statements executed: ${statements.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default runMigrations;
