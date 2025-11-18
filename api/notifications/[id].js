import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, notFound, badRequest, handleCors } from '../utils/response.js';

/**
 * Manage notification
 * PATCH /api/notifications/[id] - Update notification
 * DELETE /api/notifications/[id] - Delete notification
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  const notifId = req.url.split('/').filter(Boolean)[1].split('?')[0];

  if (!notifId || notifId === '[id]') {
    return badRequest(res, 'Notification ID is required');
  }

  // Verify notification belongs to user
  const notifs = await query(
    'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
    [notifId, user.id]
  );

  if (!notifs || notifs.length === 0) {
    return notFound(res, 'Notification not found');
  }

  try {
    if (req.method === 'PATCH') {
      const { is_read } = req.body;

      await query(
        'UPDATE notifications SET is_read = $1 WHERE id = $2',
        [is_read !== false, notifId]
      );

      return success(res, { id: notifId }, 'Notification updated');
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM notifications WHERE id = $1', [notifId]);

      return success(res, { id: notifId }, 'Notification deleted');
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Notification operation failed:', err);
    return error(res, 'Operation failed');
  }
}
