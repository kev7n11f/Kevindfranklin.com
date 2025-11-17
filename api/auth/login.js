import { query } from '../../db/connection.js';
import { comparePassword } from '../utils/encryption.js';
import { generateToken } from '../utils/jwt.js';
import { success, badRequest, unauthorized, error, handleCors } from '../utils/response.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return badRequest(res, 'Method not allowed');
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return badRequest(res, 'Email and password are required');
    }

    // Find user
    const users = await query(
      'SELECT id, email, password_hash, full_name, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!users || users.length === 0) {
      return unauthorized(res, 'Invalid email or password');
    }

    const user = users[0];

    if (!user.is_active) {
      return unauthorized(res, 'Account is inactive');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return unauthorized(res, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    // Create session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        tokenHash,
        expiresAt,
        req.headers['user-agent'] || null,
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
      ]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      token,
    }, 'Login successful');

  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed');
  }
}
