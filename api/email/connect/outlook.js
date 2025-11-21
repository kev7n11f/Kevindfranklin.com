import { authenticate } from '../../middleware/auth.js';
import { query } from '../../../db/connection.js';
import { encrypt } from '../../utils/encryption.js';
import { success, error, handleCors, badRequest } from '../../utils/response.js';
import crypto from 'crypto';

const MICROSOFT_AUTH_ENDPOINT = 'https://login.microsoftonline.com';
const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'offline_access',
];

// PKCE helper functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      // Step 1: Generate authorization URL with PKCE
      const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = process.env.MICROSOFT_REDIRECT_URI;

      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authUrl = new URL(`${MICROSOFT_AUTH_ENDPOINT}/${tenantId}/oauth2/v2.0/authorize`);
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('scope', SCOPES.join(' '));
      authUrl.searchParams.append('response_mode', 'query');
      authUrl.searchParams.append('state', JSON.stringify({ userId: user.id, codeVerifier }));
      authUrl.searchParams.append('prompt', 'consent');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');

      return success(res, { authUrl: authUrl.toString() }, 'Authorization URL generated');

    } else if (req.method === 'POST') {
      // Step 2: Handle OAuth callback with code
      const { code } = req.body;

      if (!code) {
        return badRequest(res, 'Authorization code is required');
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
          redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
          grant_type: 'authorization_code',
          scope: SCOPES.join(' '),
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Microsoft token exchange error:', errorData);
        return error(res, 'Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();

      // Get user email
      const profileResponse = await fetch(`${GRAPH_ENDPOINT}/me`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        return error(res, 'Failed to fetch user profile');
      }

      const profile = await profileResponse.json();
      const emailAddress = profile.mail || profile.userPrincipalName;
      const displayName = profile.displayName;

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Check if account already exists
      const existingAccounts = await query(
        'SELECT id FROM email_accounts WHERE user_id = $1 AND email_address = $2',
        [user.id, emailAddress]
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
               display_name = $4,
               connection_status = 'connected',
               error_message = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            encrypt(tokens.access_token),
            encrypt(tokens.refresh_token),
            expiresAt,
            displayName,
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
            user.id,
            'outlook',
            emailAddress,
            displayName,
            encrypt(tokens.access_token),
            encrypt(tokens.refresh_token),
            expiresAt,
            'connected',
            true,
          ]
        );

        accountId = newAccounts[0].id;
      }

      return success(res, {
        accountId,
        email: emailAddress,
        provider: 'outlook',
      }, 'Outlook account connected successfully');

    } else {
      return error(res, 'Method not allowed', 405);
    }

  } catch (err) {
    console.error('Outlook OAuth error:', err);
    return error(res, 'Failed to connect Outlook account');
  }
}
