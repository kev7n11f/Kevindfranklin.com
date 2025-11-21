import { query } from '../../../db/connection.js';
import { encrypt } from '../../utils/encryption.js';
import { handleCors } from '../../utils/response.js';

const MICROSOFT_AUTH_ENDPOINT = 'https://login.microsoftonline.com';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'offline_access',
];

/**
 * Handle Outlook/Microsoft OAuth callback
 * GET /api/email/connect/outlook-callback?code=xxx&state=xxx
 */
export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('OAuth error:', error);
      console.error('OAuth error description:', error_description);
      console.error('Full query params:', req.query);
      const errorMsg = error_description || error || 'Authorization denied';
      return res.redirect(`/settings?error=${encodeURIComponent(errorMsg)}`);
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
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const tokenUrl = `${MICROSOFT_AUTH_ENDPOINT}/${tenantId}/oauth2/v2.0/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI || 'https://www.kevindfranklin.com/api/email/connect/outlook-callback',
        grant_type: 'authorization_code',
        scope: SCOPES.join(' '),
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Microsoft token exchange error:', errorData);
      console.error('Token exchange status:', tokenResponse.status);
      console.error('Token exchange URL:', tokenUrl);
      const errorMsg = errorData.error_description || errorData.error || 'Token exchange failed';
      return res.redirect(`/settings?error=${encodeURIComponent(errorMsg)}`);
    }

    const tokens = await tokenResponse.json();

    // Get user email
    const profileResponse = await fetch(`${GRAPH_ENDPOINT}/me`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return res.redirect('/settings?error=profile_fetch_failed');
    }

    const profile = await profileResponse.json();
    const emailAddress = profile.mail || profile.userPrincipalName;
    const displayName = profile.displayName;

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

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
         SET display_name = $1,
             access_token = $2,
             refresh_token = $3,
             token_expires_at = $4,
             connection_status = 'connected',
             error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          displayName,
          encrypt(tokens.access_token),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          expiresAt,
          accountId,
        ]
      );
    } else {
      // Create new account
      const newAccounts = await query(
        `INSERT INTO email_accounts
         (user_id, provider, email_address, display_name, access_token, refresh_token, token_expires_at, connection_status, sync_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          'outlook',
          emailAddress,
          displayName,
          encrypt(tokens.access_token),
          tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          expiresAt,
          'connected',
          true,
        ]
      );

      accountId = newAccounts[0].id;
    }

    // Redirect back to settings with success message
    return res.redirect('/settings?success=outlook_connected');

  } catch (err) {
    console.error('Outlook OAuth callback error:', err);
    return res.redirect(`/settings?error=${encodeURIComponent('Failed to connect Outlook')}`);
  }
}
