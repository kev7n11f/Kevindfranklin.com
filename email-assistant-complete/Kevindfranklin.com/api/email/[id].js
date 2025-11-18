import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, notFound, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get single email with full details
      const emails = await query(
        `SELECT e.*, ea.email_address as account_email, ea.provider
         FROM emails e
         JOIN email_accounts ea ON e.email_account_id = ea.id
         WHERE e.id = $1 AND e.user_id = $2`,
        [id, user.id]
      );

      if (!emails || emails.length === 0) {
        return notFound(res, 'Email not found');
      }

      const email = emails[0];

      // Mark as read if not already
      if (!email.is_read) {
        await query(
          'UPDATE emails SET is_read = true WHERE id = $1',
          [id]
        );
        email.is_read = true;
      }

      return success(res, { email });

    } else if (req.method === 'PATCH') {
      // Update email properties
      const { is_read, is_starred, is_archived } = req.body;

      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (is_read !== undefined) {
        updates.push(`is_read = $${paramIndex}`);
        params.push(is_read);
        paramIndex++;
      }

      if (is_starred !== undefined) {
        updates.push(`is_starred = $${paramIndex}`);
        params.push(is_starred);
        paramIndex++;
      }

      if (is_archived !== undefined) {
        updates.push(`is_archived = $${paramIndex}`);
        params.push(is_archived);
        paramIndex++;
      }

      if (updates.length === 0) {
        return success(res, null, 'No updates provided');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      await query(
        `UPDATE emails SET ${updates.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
        [...params, id, user.id]
      );

      return success(res, null, 'Email updated successfully');

    } else if (req.method === 'DELETE') {
      // Soft delete email
      await query(
        'UPDATE emails SET is_deleted = true WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );

      return success(res, null, 'Email deleted successfully');

    } else {
      return error(res, 'Method not allowed', 405);
    }

  } catch (err) {
    console.error('Email operation error:', err);
    return error(res, 'Failed to process request');
  }
}
