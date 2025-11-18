import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  const { id } = req.query;

  if (!id) {
    return error(res, 'Template ID is required', 400);
  }

  // Get single template
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT * FROM email_templates WHERE id = $1 AND user_id = $2`,
        [id, user.id]
      );

      if (result.rows.length === 0) {
        return error(res, 'Template not found', 404);
      }

      return success(res, result.rows[0]);

    } catch (err) {
      console.error('Get template error:', err);
      return error(res, 'Failed to fetch template');
    }
  }

  // Update template
  if (req.method === 'PATCH') {
    const { name, subject, body, category, tone, is_active } = req.body;

    try {
      // Build update query dynamically
      const updates = [];
      const params = [id, user.id];
      let paramIndex = 3;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (subject !== undefined) {
        updates.push(`subject = $${paramIndex}`);
        params.push(subject);
        paramIndex++;
      }

      if (body !== undefined) {
        updates.push(`body = $${paramIndex}`);
        params.push(body);
        paramIndex++;
      }

      if (category !== undefined) {
        updates.push(`category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (tone !== undefined) {
        updates.push(`tone = $${paramIndex}`);
        params.push(tone);
        paramIndex++;
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        params.push(is_active);
        paramIndex++;
      }

      if (updates.length === 0) {
        return error(res, 'No fields to update', 400);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const result = await query(
        `UPDATE email_templates
         SET ${updates.join(', ')}
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return error(res, 'Template not found', 404);
      }

      return success(res, {
        message: 'Template updated successfully',
        template: result.rows[0],
      });

    } catch (err) {
      console.error('Update template error:', err);
      return error(res, 'Failed to update template');
    }
  }

  // Delete template
  if (req.method === 'DELETE') {
    try {
      const result = await query(
        `DELETE FROM email_templates WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.id]
      );

      if (result.rows.length === 0) {
        return error(res, 'Template not found', 404);
      }

      return success(res, { message: 'Template deleted successfully' });

    } catch (err) {
      console.error('Delete template error:', err);
      return error(res, 'Failed to delete template');
    }
  }

  return error(res, 'Method not allowed', 405);
}
