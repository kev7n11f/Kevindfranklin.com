import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

const MAX_BATCH_SIZE = 100;

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    const { email_ids, action, value } = req.body;

    // Validate input
    if (!email_ids || !Array.isArray(email_ids) || email_ids.length === 0) {
      return error(res, 'email_ids must be a non-empty array', 400);
    }

    if (!action) {
      return error(res, 'action is required', 400);
    }

    if (email_ids.length > MAX_BATCH_SIZE) {
      return error(res, `Maximum ${MAX_BATCH_SIZE} emails per batch operation`, 400);
    }

    try {
      let updateQuery = '';
      let params = [];
      let message = '';

      switch (action) {
        case 'mark_read':
          updateQuery = `UPDATE emails SET is_read = true, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'marked as read';
          break;

        case 'mark_unread':
          updateQuery = `UPDATE emails SET is_read = false, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'marked as unread';
          break;

        case 'star':
          updateQuery = `UPDATE emails SET is_starred = true, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'starred';
          break;

        case 'unstar':
          updateQuery = `UPDATE emails SET is_starred = false, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'unstarred';
          break;

        case 'archive':
          updateQuery = `UPDATE emails SET is_archived = true, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'archived';
          break;

        case 'unarchive':
          updateQuery = `UPDATE emails SET is_archived = false, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'unarchived';
          break;

        case 'set_category':
          if (!value) {
            return error(res, 'value is required for set_category action', 400);
          }
          updateQuery = `UPDATE emails SET category = $1, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($2) AND user_id = $3`;
          params = [value, email_ids, user.id];
          message = `categorized as ${value}`;
          break;

        case 'set_priority':
          if (!value) {
            return error(res, 'value is required for set_priority action', 400);
          }
          updateQuery = `UPDATE emails SET priority = $1, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ANY($2) AND user_id = $3`;
          params = [value, email_ids, user.id];
          message = `priority set to ${value}`;
          break;

        case 'delete':
          updateQuery = `DELETE FROM emails WHERE id = ANY($1) AND user_id = $2`;
          params = [email_ids, user.id];
          message = 'deleted';
          break;

        default:
          return error(res, 'Invalid action', 400);
      }

      // Execute batch update
      const result = await query(updateQuery, params);

      return success(res, {
        message: `${result.rowCount} email(s) ${message}`,
        affected_count: result.rowCount,
        requested_count: email_ids.length,
      });

    } catch (err) {
      console.error('Batch operation error:', err);
      return error(res, 'Batch operation failed');
    }
  }

  return error(res, 'Method not allowed', 405);
}
