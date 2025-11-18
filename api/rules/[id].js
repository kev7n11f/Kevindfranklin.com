import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, notFound, badRequest, handleCors } from '../utils/response.js';

/**
 * Manage individual rule
 * PATCH /api/rules/[id] - Update rule
 * DELETE /api/rules/[id] - Delete rule
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  // Extract rule ID from URL
  const ruleId = req.url.split('/').filter(Boolean)[1].split('?')[0];

  if (!ruleId || ruleId === '[id]') {
    return badRequest(res, 'Rule ID is required');
  }

  // Verify rule belongs to user
  const rules = await query(
    'SELECT id FROM email_rules WHERE id = $1 AND user_id = $2',
    [ruleId, user.id]
  );

  if (!rules || rules.length === 0) {
    return notFound(res, 'Rule not found');
  }

  try {
    if (req.method === 'PATCH') {
      const { name, conditions, actions, enabled } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (conditions !== undefined) {
        if (!Array.isArray(conditions) || conditions.length === 0) {
          return badRequest(res, 'At least one condition is required');
        }
        updates.push(`conditions = $${paramCount++}`);
        values.push(JSON.stringify(conditions));
      }

      if (actions !== undefined) {
        if (!Array.isArray(actions) || actions.length === 0) {
          return badRequest(res, 'At least one action is required');
        }
        updates.push(`actions = $${paramCount++}`);
        values.push(JSON.stringify(actions));
      }

      if (enabled !== undefined) {
        updates.push(`enabled = $${paramCount++}`);
        values.push(enabled);
      }

      if (updates.length === 0) {
        return badRequest(res, 'No fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(ruleId);

      const updateQuery = `
        UPDATE email_rules
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      return success(res, result[0], 'Rule updated successfully');
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM email_rules WHERE id = $1', [ruleId]);

      return success(res, { id: ruleId }, 'Rule deleted successfully');
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Rule operation failed:', err);
    return error(res, 'Operation failed');
  }
}
