import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, badRequest, handleCors } from '../utils/response.js';

/**
 * Update user settings
 * PATCH /api/auth/settings
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
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return badRequest(res, 'Valid settings object is required');
    }

    // Merge with existing settings
    const currentSettings = user.settings || {};
    const newSettings = {
      ...currentSettings,
      ...settings
    };

    const result = await query(
      `UPDATE users
       SET settings = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, full_name, settings`,
      [JSON.stringify(newSettings), user.id]
    );

    return success(res, result[0], 'Settings updated successfully');
  } catch (err) {
    console.error('Settings update failed:', err);
    return error(res, 'Failed to update settings');
  }
}
