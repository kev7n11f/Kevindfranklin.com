import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, handleCors } from '../utils/response.js';

/**
 * Get all drafts for authenticated user
 * GET /api/drafts
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const { status } = req.query;

    let queryStr = `
      SELECT
        d.id,
        d.email_id,
        d.draft_content,
        d.status,
        d.confidence_score,
        d.context,
        d.created_at,
        d.sent_at,
        e.subject as original_subject,
        e.sender as original_sender
      FROM email_drafts d
      LEFT JOIN emails e ON d.email_id = e.id
      WHERE d.user_id = $1
    `;

    const params = [user.id];

    if (status) {
      queryStr += ` AND d.status = $2`;
      params.push(status);
    }

    queryStr += ` ORDER BY d.created_at DESC`;

    const drafts = await query(queryStr, params);

    return success(res, drafts || []);
  } catch (err) {
    console.error('Failed to fetch drafts:', err);
    return error(res, 'Failed to fetch drafts');
  }
}
