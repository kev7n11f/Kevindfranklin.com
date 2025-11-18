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

/**
 * Smart SQL statement splitter that handles functions, triggers, and procedures
 * Respects $$ delimiters used in PostgreSQL function bodies
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip comments
    if (trimmedLine.startsWith('--')) {
      continue;
    }

    // Check for dollar quote delimiters ($$, $tag$, etc.)
    const dollarMatches = line.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/g);
    if (dollarMatches) {
      for (const match of dollarMatches) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = match;
        } else if (match === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }

    current += line + '\n';

    // Only split on semicolon if we're not inside a dollar-quoted string
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      const statement = current.trim();
      if (statement.length > 0) {
        statements.push(statement);
      }
      current = '';
    }
  }

  // Add any remaining statement
  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

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

    // Smart SQL statement splitting that handles functions and procedures
    const statements = splitSqlStatements(schema);

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
