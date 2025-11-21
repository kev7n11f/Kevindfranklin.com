import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  // List templates
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT
          id,
          name,
          subject,
          body,
          category,
          tone,
          is_active,
          usage_count,
          created_at,
          updated_at
        FROM email_templates
        WHERE user_id = $1
        ORDER BY usage_count DESC, created_at DESC`,
        [user.id]
      );

      return success(res, {
        templates: result,
        total: result.length,
      });

    } catch (err) {
      console.error('List templates error:', err);
      return error(res, 'Failed to fetch templates');
    }
  }

  // Create template
  if (req.method === 'POST') {
    const { name, subject, body, category, tone } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return error(res, 'Template name is required', 400);
    }

    if (!body || body.trim() === '') {
      return error(res, 'Template body is required', 400);
    }

    try {
      const result = await query(
        `INSERT INTO email_templates
        (user_id, name, subject, body, category, tone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [user.id, name.trim(), subject || '', body.trim(), category || 'general', tone || 'professional']
      );

      return success(res, {
        message: 'Template created successfully',
        template: result[0],
      }, 201);

    } catch (err) {
      console.error('Create template error:', err);
      return error(res, 'Failed to create template');
    }
  }

  return error(res, 'Method not allowed', 405);
}
