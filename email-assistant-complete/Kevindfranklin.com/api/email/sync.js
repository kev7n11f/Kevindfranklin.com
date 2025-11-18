import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, handleCors } from '../utils/response.js';
import { syncEmailAccount } from '../services/emailSync.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const { account_id } = req.body;

    if (account_id) {
      // Sync specific account
      const result = await syncEmailAccount(account_id);
      return success(res, result, 'Email sync completed');

    } else {
      // Sync all user accounts
      const accounts = await query(
        'SELECT id FROM email_accounts WHERE user_id = $1 AND is_active = true AND sync_enabled = true',
        [user.id]
      );

      const results = [];

      for (const account of accounts) {
        try {
          const result = await syncEmailAccount(account.id);
          results.push({ accountId: account.id, ...result });
        } catch (syncErr) {
          results.push({ accountId: account.id, success: false, error: syncErr.message });
        }
      }

      return success(res, { results }, 'Email sync completed for all accounts');
    }

  } catch (err) {
    console.error('Email sync error:', err);
    return error(res, 'Email sync failed');
  }
}
