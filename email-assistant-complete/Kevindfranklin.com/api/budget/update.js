import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, badRequest, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'PATCH') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const { budget_limit_cents, is_paused } = req.body;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (budget_limit_cents !== undefined) {
      if (budget_limit_cents < 0) {
        return badRequest(res, 'Budget limit must be positive');
      }

      updates.push(`budget_limit_cents = $${paramIndex}`);
      params.push(budget_limit_cents);
      paramIndex++;
    }

    if (is_paused !== undefined) {
      updates.push(`is_paused = $${paramIndex}`);
      params.push(is_paused);
      paramIndex++;

      if (is_paused === false) {
        updates.push(`pause_reason = NULL`);
      }
    }

    if (updates.length === 0) {
      return badRequest(res, 'No updates provided');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    await query(
      `UPDATE budget_usage
       SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex} AND period_start = $${paramIndex + 1}`,
      [...params, user.id, periodStart]
    );

    return success(res, null, 'Budget updated successfully');

  } catch (err) {
    console.error('Update budget error:', err);
    return error(res, 'Failed to update budget');
  }
}
