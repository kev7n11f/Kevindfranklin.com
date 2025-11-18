import { authenticate } from '../middleware/auth.js';
import { query } from '../../db/connection.js';
import { success, error, badRequest, handleCors } from '../utils/response.js';
import { generateDraftReply } from '../services/claude.js';

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const { email_id, tone, instructions, skip_ai, draft_content } = req.body;

    if (!email_id) {
      return badRequest(res, 'email_id is required');
    }

    // Get original email
    const emails = await query(
      'SELECT * FROM emails WHERE id = $1 AND user_id = $2',
      [email_id, user.id]
    );

    if (!emails || emails.length === 0) {
      return badRequest(res, 'Email not found');
    }

    const email = emails[0];

    let draftData;

    if (skip_ai && draft_content) {
      // Manual draft - user provided content
      draftData = {
        draft_content: draft_content,
        confidence_score: null,
        context: null,
      };
    } else {
      // AI-generated draft
      draftData = await generateDraftReply(user.id, email, { tone, instructions });
    }

    // Store draft
    const result = await query(
      `INSERT INTO email_drafts
       (user_id, email_id, draft_content, confidence_score, context, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user.id,
        email_id,
        draftData.draft_content,
        draftData.confidence_score,
        draftData.context || null,
        'pending',
      ]
    );

    return success(res, result[0], 'Draft created successfully');

  } catch (err) {
    console.error('Create draft error:', err);
    return error(res, err.message || 'Failed to create draft');
  }
}
