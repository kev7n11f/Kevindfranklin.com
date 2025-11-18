import { verifyToken } from '../utils/jwt.js';
import { query } from '../../db/connection.js';
import { unauthorized } from '../utils/response.js';
import crypto from 'crypto';

/**
 * Middleware to authenticate user from JWT token
 * Usage in Vercel serverless functions:
 *
 * export default async function handler(req, res) {
 *   const user = await authenticate(req, res);
 *   if (!user) return; // Response already sent
 *   // ... rest of handler
 * }
 */
export async function authenticate(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      unauthorized(res, 'No token provided');
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      unauthorized(res, 'Invalid or expired token');
      return null;
    }

    // Verify user exists and is active
    const users = await query(
      'SELECT id, email, full_name, is_active, settings FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      unauthorized(res, 'User not found');
      return null;
    }

    const user = users[0];

    if (!user.is_active) {
      unauthorized(res, 'Account is inactive');
      return null;
    }

    // Update last activity
    await query(
      'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE token_hash = $1',
      [hashToken(token)]
    );

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    unauthorized(res, 'Authentication failed');
    return null;
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    const users = await query(
      'SELECT id, email, full_name, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    return users && users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Optional auth error:', error);
    return null;
  }
}

/**
 * Hash token for session storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default {
  authenticate,
  optionalAuth,
};
