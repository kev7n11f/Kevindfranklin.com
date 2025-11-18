import { query } from '../../db/connection.js';
import { hashPassword } from '../utils/encryption.js';
import { generateToken } from '../utils/jwt.js';
import { isValidEmail, isValidPassword } from '../utils/validators.js';
import { created, badRequest, error, handleCors } from '../utils/response.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return badRequest(res, 'Method not allowed');
  }

  try {
    const { email, password, full_name } = req.body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return badRequest(res, 'Valid email is required');
    }

    if (!password || !isValidPassword(password)) {
      return badRequest(res, 'Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUsers && existingUsers.length > 0) {
      return badRequest(res, 'Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUsers = await query(
      `INSERT INTO users (email, password_hash, full_name, settings)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, created_at`,
      [email.toLowerCase(), passwordHash, full_name || null, JSON.stringify({
        emailNotifications: true,
        autoAnalyze: true,
        autoDraft: false, // User must enable this manually
      })]
    );

    const user = newUsers[0];

    // Initialize budget tracking for current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await query(
      `INSERT INTO budget_usage (user_id, period_start, period_end, budget_limit_cents)
       VALUES ($1, $2, $3, $4)`,
      [user.id, periodStart, periodEnd, parseInt(process.env.DEFAULT_MONTHLY_BUDGET_CENTS) || 1000]
    );

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

    return created(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
      token,
    }, 'Account created successfully');

  } catch (err) {
    console.error('Registration error:', err);
    return error(res, 'Failed to create account');
  }
}
