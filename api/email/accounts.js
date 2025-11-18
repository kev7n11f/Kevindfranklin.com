import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

/**
 * Get all email accounts for authenticated user
 * GET /api/email/accounts
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const accounts = await query(
      `SELECT
        id,
        provider,
        email,
        is_active,
        last_sync,
        sync_frequency_minutes,
        created_at
       FROM email_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    return success(res, accounts || []);
  } catch (err) {
    console.error('Failed to fetch email accounts:', err);
    return error(res, 'Failed to fetch email accounts');
  }
}
