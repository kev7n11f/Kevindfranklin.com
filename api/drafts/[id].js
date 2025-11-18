import { query } from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { success, error, notFound, badRequest, handleCors } from '../utils/response.js';

/**
 * Manage individual draft
 * PATCH /api/drafts/[id] - Update draft
 * DELETE /api/drafts/[id] - Delete draft
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  // Extract draft ID from URL
  const draftId = req.url.split('/').filter(Boolean)[2].split('?')[0];

  if (!draftId || draftId === '[id]') {
    return badRequest(res, 'Draft ID is required');
  }

  // Verify draft belongs to user
  const drafts = await query(
    'SELECT id, status FROM email_drafts WHERE id = $1 AND user_id = $2',
    [draftId, user.id]
  );

  if (!drafts || drafts.length === 0) {
    return notFound(res, 'Draft not found');
  }

  const draft = drafts[0];

  try {
    if (req.method === 'PATCH') {
      const { draft_content, status } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (draft_content !== undefined) {
        updates.push(`draft_content = $${paramCount++}`);
        values.push(draft_content);
      }

      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return badRequest(res, 'No fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(draftId);

      const updateQuery = `
        UPDATE email_drafts
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, draft_content, status, confidence_score, created_at
      `;

      const result = await query(updateQuery, values);

      return success(res, result[0], 'Draft updated successfully');
    }

    if (req.method === 'DELETE') {
      await query('DELETE FROM email_drafts WHERE id = $1', [draftId]);

      return success(res, { id: draftId }, 'Draft deleted successfully');
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Draft operation failed:', err);
    return error(res, 'Operation failed');
  }
}
