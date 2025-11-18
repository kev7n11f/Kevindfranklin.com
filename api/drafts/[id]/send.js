import { query } from '../../../db/connection.js';
import { authenticate } from '../../middleware/auth.js';
import { success, error, notFound, badRequest, handleCors } from '../../utils/response.js';
import { sendEmail } from '../../services/emailSender.js';

/**
 * Send a draft email
 * POST /api/drafts/[id]/send
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  // Extract draft ID from URL
  const urlParts = req.url.split('/').filter(Boolean);
  const draftId = urlParts[1];

  if (!draftId || draftId === '[id]') {
    return badRequest(res, 'Draft ID is required');
  }

  try {
    // Get draft with email details
    const drafts = await query(
      `SELECT
        d.*,
        e.sender as reply_to,
        e.subject as original_subject,
        e.message_id as in_reply_to,
        ea.id as account_id,
        ea.provider,
        ea.email as from_email
       FROM email_drafts d
       JOIN emails e ON d.email_id = e.id
       JOIN email_accounts ea ON e.account_id = ea.id
       WHERE d.id = $1 AND d.user_id = $2`,
      [draftId, user.id]
    );

    if (!drafts || drafts.length === 0) {
      return notFound(res, 'Draft not found');
    }

    const draft = drafts[0];

    if (draft.status === 'sent') {
      return badRequest(res, 'Draft has already been sent');
    }

    // Send the email
    await sendEmail({
      accountId: draft.account_id,
      to: draft.reply_to,
      subject: `Re: ${draft.original_subject}`,
      body: draft.draft_content,
      inReplyTo: draft.in_reply_to,
    });

    // Update draft status
    await query(
      `UPDATE email_drafts
       SET status = 'sent', sent_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [draftId]
    );

    return success(res, { id: draftId }, 'Email sent successfully');
  } catch (err) {
    console.error('Failed to send draft:', err);

    // Update draft status to failed
    await query(
      `UPDATE email_drafts SET status = 'failed' WHERE id = $1`,
      [draftId]
    ).catch(console.error);

    return error(res, err.message || 'Failed to send email');
  }
}
