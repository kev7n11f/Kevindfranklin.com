import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, badRequest, handleCors } from '../utils/response.js';

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'PATCH') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const { full_name } = req.body;

    if (!full_name || full_name.trim().length === 0) {
      return badRequest(res, 'Full name is required');
    }

    const result = await query(
      `UPDATE users
       SET full_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, full_name, created_at`,
      [full_name.trim(), user.id]
    );

    return success(res, result[0], 'Profile updated successfully');
  } catch (err) {
    console.error('Profile update failed:', err);
    return error(res, 'Failed to update profile');
  }
}
