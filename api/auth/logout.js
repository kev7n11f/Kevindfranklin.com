import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Delete session
    await query(
      'DELETE FROM sessions WHERE token_hash = $1',
      [tokenHash]
    );

    return success(res, null, 'Logged out successfully');

  } catch (err) {
    console.error('Logout error:', err);
    return error(res, 'Logout failed');
  }
}
