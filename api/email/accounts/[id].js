import { query } from '../../../db/connection.js';
import { authenticate } from '../../middleware/auth.js';
import { success, error, notFound, handleCors } from '../../utils/response.js';

/**
 * Manage individual email account
 * DELETE /api/email/accounts/[id] - Disconnect account
 * PATCH /api/email/accounts/[id] - Update account settings
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  // Extract account ID from URL
  const accountId = req.url.split('/').pop().split('?')[0];

  if (!accountId || accountId === '[id]') {
    return error(res, 'Account ID is required', 400);
  }

  // Verify account belongs to user
  const accounts = await query(
    'SELECT id FROM email_accounts WHERE id = $1 AND user_id = $2',
    [accountId, user.id]
  );

  if (!accounts || accounts.length === 0) {
    return notFound(res, 'Email account not found');
  }

  try {
    if (req.method === 'DELETE') {
      // Soft delete - mark as inactive
      await query(
        'UPDATE email_accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [accountId]
      );

      return success(res, { id: accountId }, 'Account disconnected successfully');
    }

    if (req.method === 'PATCH') {
      const { sync_frequency_minutes, is_active } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (sync_frequency_minutes !== undefined) {
        updates.push(`sync_frequency_minutes = $${paramCount++}`);
        values.push(sync_frequency_minutes);
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        return error(res, 'No fields to update', 400);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(accountId);

      const updateQuery = `
        UPDATE email_accounts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, provider, email, is_active, sync_frequency_minutes
      `;

      const result = await query(updateQuery, values);

      return success(res, result[0], 'Account updated successfully');
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Account operation failed:', err);
    return error(res, 'Operation failed');
  }
}
