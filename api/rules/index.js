import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, badRequest, handleCors } from '../utils/response.js';

/**
 * Get all rules or create new rule
 * GET /api/rules - List all rules
 * POST /api/rules - Create new rule
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const rules = await query(
        `SELECT * FROM email_rules
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id]
      );

      return success(res, rules || []);
    }

    if (req.method === 'POST') {
      const { name, conditions, actions, enabled } = req.body;

      if (!name || !conditions || !actions) {
        return badRequest(res, 'Name, conditions, and actions are required');
      }

      if (!Array.isArray(conditions) || conditions.length === 0) {
        return badRequest(res, 'At least one condition is required');
      }

      if (!Array.isArray(actions) || actions.length === 0) {
        return badRequest(res, 'At least one action is required');
      }

      const result = await query(
        `INSERT INTO email_rules
         (user_id, name, conditions, actions, enabled)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          user.id,
          name,
          JSON.stringify(conditions),
          JSON.stringify(actions),
          enabled !== false,
        ]
      );

      return success(res, result[0], 'Rule created successfully');
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Rules operation failed:', err);
    return error(res, 'Operation failed');
  }
}
