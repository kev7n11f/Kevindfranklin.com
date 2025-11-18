import { neon } from '@neondatabase/serverless';

// Neon serverless connection
let sql;

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    sql = neon(connectionString);
  }

  return sql;
}

// Query helper with error handling
export async function query(text, params = []) {
  const sql = getDb();

  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction(callback) {
  const sql = getDb();

  try {
    await sql('BEGIN');
    const result = await callback(sql);
    await sql('COMMIT');
    return result;
  } catch (error) {
    await sql('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  }
}

export default { getDb, query, transaction };
