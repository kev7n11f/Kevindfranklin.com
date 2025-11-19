import { google } from 'googleapis';
import { query } from '../../../db/connection.js';
import { encrypt } from '../../utils/encryption.js';
import { handleCors } from '../../utils/response.js';
import { verify } from '../../utils/jwt.js';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'https://www.kevindfranklin.com/api/email/connect/gmail-callback'
);

/**
 * Handle Gmail OAuth callback
 * GET /api/email/connect/gmail-callback?code=xxx&state=xxx
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`/settings?error=${encodeURIComponent('Authorization denied')}`);
    }

    if (!code) {
      return res.redirect('/settings?error=missing_code');
    }

    // Decode state to get user ID
    let userId;
    try {
      const stateData = JSON.parse(state);
      userId = stateData.userId;
    } catch (e) {
      return res.redirect('/settings?error=invalid_state');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress;

    // Check if account already exists
    const existingAccounts = await query(
      'SELECT id FROM email_accounts WHERE user_id = $1 AND email_address = $2',
      [userId, emailAddress]
    );

    let accountId;

    if (existingAccounts && existingAccounts.length > 0) {
      // Update existing account
      accountId = existingAccounts[0].id;

      await query(
        `UPDATE email_accounts
         SET access_token = $1,
             refresh_token = $2,
             token_expires_at = $3,
             connection_status = 'connected',
             error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          encrypt(tokens.access_token),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          accountId,
        ]
      );
    } else {
      // Create new account
      const newAccounts = await query(
        `INSERT INTO email_accounts
         (user_id, provider, email_address, access_token, refresh_token, token_expires_at, connection_status, sync_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          'gmail',
          emailAddress,
          encrypt(tokens.access_token),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          'connected',
          true,
        ]
      );

      accountId = newAccounts[0].id;
    }

    // Redirect back to settings with success message
    return res.redirect('/settings?success=gmail_connected');

  } catch (err) {
    console.error('Gmail OAuth callback error:', err);
    return res.redirect(`/settings?error=${encodeURIComponent('Failed to connect Gmail')}`);
  }
}
