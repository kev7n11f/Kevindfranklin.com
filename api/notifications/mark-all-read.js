import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [user.id]
    );

    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    console.error('Failed to mark all as read:', err);
    return error(res, 'Failed to mark all as read');
  }
}
