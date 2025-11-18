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
    const { email_id, tone, instructions } = req.body;

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

    // Generate draft using Claude
    const draft = await generateDraftReply(user.id, email, { tone, instructions });

    // Parse recipient email
    const toAddresses = [{ email: email.from_address, name: email.from_name }];

    // Store draft
    const result = await query(
      `INSERT INTO email_drafts
       (user_id, email_account_id, original_email_id, to_addresses, subject, body_text, body_html,
        ai_generated, ai_confidence_score, ai_prompt, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        user.id,
        email.email_account_id,
        email_id,
        JSON.stringify(toAddresses),
        draft.subject,
        draft.body_text,
        draft.body_html,
        true,
        draft.confidence_score,
        instructions || null,
        'draft',
      ]
    );

    return success(res, {
      draft: result[0],
      notes: draft.notes,
    }, 'Draft created successfully');

  } catch (err) {
    console.error('Create draft error:', err);
    return error(res, err.message || 'Failed to create draft');
  }
}
