import { query } from '../../../db/connection.js';
import { authenticate } from '../../middleware/auth.js';
import { success, error, handleCors } from '../../utils/response.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  const { id } = req.query;

  if (!id) {
    return error(res, 'Template ID is required', 400);
  }

  // Use template (increment usage count and return template with optional variable replacement)
  if (req.method === 'POST') {
    const { variables = {} } = req.body;

    try {
      // Get template and increment usage
      const result = await query(
        `UPDATE email_templates
         SET usage_count = usage_count + 1,
             last_used_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND is_active = true
         RETURNING *`,
        [id, user.id]
      );

      if (result.length === 0) {
        return error(res, 'Template not found or inactive', 404);
      }

      const template = result[0];

      // Replace variables in subject and body
      let subject = template.subject || '';
      let body = template.body;

      // Simple variable replacement ({{variable_name}})
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        if (subject) {
          subject = subject.replace(regex, variables[key]);
        }
        body = body.replace(regex, variables[key]);
      });

      return success(res, {
        template: {
          id: template.id,
          name: template.name,
          subject,
          body,
          category: template.category,
          tone: template.tone,
        },
        variables_replaced: Object.keys(variables),
      });

    } catch (err) {
      console.error('Use template error:', err);
      return error(res, 'Failed to use template');
    }
  }

  return error(res, 'Method not allowed', 405);
}
