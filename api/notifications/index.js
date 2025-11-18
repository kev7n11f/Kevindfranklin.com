import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

/**
 * Get notifications
 * GET /api/notifications
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
    const notifications = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );

    return success(res, notifications || []);
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    return error(res, 'Failed to fetch notifications');
  }
}
