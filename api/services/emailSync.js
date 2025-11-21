import { google } from 'googleapis';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { query } from '../../db/connection.js';
import { decrypt, encrypt } from '../utils/encryption.js';
import { analyzeEmail } from './claude.js';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';
const MICROSOFT_TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/**
 * Sync emails for a specific account
 */
export async function syncEmailAccount(accountId) {
  try {
    const accounts = await query(
      'SELECT * FROM email_accounts WHERE id = $1 AND is_active = true',
      [accountId]
    );

    if (!accounts || accounts.length === 0) {
      throw new Error('Account not found');
    }

    const account = accounts[0];

    console.log(`Syncing emails for ${account.email_address} (${account.provider})`);

    let newEmails = [];

    switch (account.provider) {
      case 'gmail':
        newEmails = await syncGmail(account);
        break;
      case 'outlook':
        newEmails = await syncOutlook(account);
        break;
      case 'icloud':
      case 'spacemail':
        newEmails = await syncImap(account);
        break;
      default:
        throw new Error(`Unsupported provider: ${account.provider}`);
    }

    // Update last sync time
    await query(
      'UPDATE email_accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
      [accountId]
    );

    console.log(`Synced ${newEmails.length} new emails for ${account.email_address}`);

    return { success: true, count: newEmails.length };

  } catch (error) {
    console.error(`Email sync error for account ${accountId}:`, error);

    // Update error status
    await query(
      `UPDATE email_accounts
       SET connection_status = 'error',
           error_message = $1
       WHERE id = $2`,
      [error.message, accountId]
    );

    throw error;
  }
}

/**
 * Refresh Gmail OAuth token
 */
async function refreshGmailToken(account) {
  if (!account.refresh_token) {
    throw new Error('No refresh token available for Gmail account');
  }

  const refreshToken = decrypt(account.refresh_token);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    // Google library automatically refreshes the token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Calculate new expiration time
    const expiresAt = new Date(credentials.expiry_date);

    // Update account with new tokens
    await query(
      `UPDATE email_accounts
       SET access_token = $1,
           token_expires_at = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [
        encrypt(credentials.access_token),
        expiresAt,
        account.id,
      ]
    );

    console.log(`Successfully refreshed Gmail token for ${account.email_address}`);

    return {
      access_token: credentials.access_token,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    throw new Error(`Failed to refresh Gmail token: ${error.message}`);
  }
}

/**
 * Sync Gmail emails
 */
async function syncGmail(account) {
  let accessToken = decrypt(account.access_token);
  const refreshToken = account.refresh_token ? decrypt(account.refresh_token) : null;

  // Check if token is expired and refresh if needed
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    console.log(`Gmail token expired for ${account.email_address}, refreshing...`);
    const refreshedTokens = await refreshGmailToken(account);
    accessToken = refreshedTokens.access_token;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Set up automatic token refresh on API calls
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000);
      await query(
        `UPDATE email_accounts
         SET access_token = $1,
             token_expires_at = $2
         WHERE id = $3`,
        [encrypt(tokens.access_token), expiresAt, account.id]
      );
      console.log(`Auto-refreshed Gmail token for ${account.email_address}`);
    }
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Get last sync date
  const syncFrom = account.sync_from_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const query_str = `after:${Math.floor(syncFrom.getTime() / 1000)}`;

  // List messages
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query_str,
    maxResults: parseInt(process.env.MAX_EMAILS_PER_SYNC) || 100,
  });

  const messages = response.data.messages || [];
  const newEmails = [];

  for (const message of messages) {
    try {
      // Fetch full message
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      // Parse and store email
      const emailData = parseGmailMessage(fullMessage.data, account);
      const storedEmail = await storeEmail(emailData, account);

      if (storedEmail) {
        newEmails.push(storedEmail);

        // Trigger AI analysis in background
        analyzeEmailAsync(account.user_id, storedEmail);
      }

    } catch (msgError) {
      console.error(`Error processing Gmail message ${message.id}:`, msgError);
    }
  }

  return newEmails;
}

/**
 * Parse Gmail message to standard format
 */
function parseGmailMessage(message, account) {
  const headers = message.payload.headers;
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

  let bodyText = '';
  let bodyHtml = '';

  // Extract body
  if (message.payload.body?.data) {
    bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  return {
    message_id: message.id,
    thread_id: message.threadId,
    subject: getHeader('Subject') || '(No Subject)',
    from_address: parseEmailAddress(getHeader('From')).email,
    from_name: parseEmailAddress(getHeader('From')).name,
    to_addresses: parseEmailAddresses(getHeader('To')),
    cc_addresses: parseEmailAddresses(getHeader('Cc')),
    body_text: bodyText,
    body_html: bodyHtml,
    snippet: message.snippet,
    received_at: new Date(parseInt(message.internalDate)),
    is_read: !message.labelIds?.includes('UNREAD'),
    is_starred: message.labelIds?.includes('STARRED'),
    labels: message.labelIds || [],
    has_attachments: message.payload.parts?.some(p => p.filename) || false,
  };
}

/**
 * Refresh Outlook OAuth token
 */
async function refreshOutlookToken(account) {
  if (!account.refresh_token) {
    throw new Error('No refresh token available for Outlook account');
  }

  const refreshToken = decrypt(account.refresh_token);
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials not configured');
  }

  try {
    const response = await fetch(MICROSOFT_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || response.statusText}`);
    }

    const tokens = await response.json();

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Update account with new tokens
    await query(
      `UPDATE email_accounts
       SET access_token = $1,
           refresh_token = $2,
           token_expires_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        encrypt(tokens.access_token),
        tokens.refresh_token ? encrypt(tokens.refresh_token) : account.refresh_token,
        expiresAt,
        account.id,
      ]
    );

    console.log(`Successfully refreshed Outlook token for ${account.email_address}`);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error('Error refreshing Outlook token:', error);
    throw new Error(`Failed to refresh Outlook token: ${error.message}`);
  }
}

/**
 * Sync Outlook emails
 */
async function syncOutlook(account) {
  let accessToken = decrypt(account.access_token);

  // Check if token is expired and refresh if needed
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    console.log(`Outlook token expired for ${account.email_address}, refreshing...`);
    const refreshedTokens = await refreshOutlookToken(account);
    accessToken = refreshedTokens.access_token;
  }

  const syncFrom = account.sync_from_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filterDate = syncFrom.toISOString();

  const response = await fetch(
    `${GRAPH_ENDPOINT}/me/messages?$filter=receivedDateTime ge ${filterDate}&$top=${parseInt(process.env.MAX_EMAILS_PER_SYNC) || 100}&$orderby=receivedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Outlook API error: ${response.statusText}`);
  }

  const data = await response.json();
  const messages = data.value || [];
  const newEmails = [];

  for (const message of messages) {
    try {
      const emailData = parseOutlookMessage(message, account);
      const storedEmail = await storeEmail(emailData, account);

      if (storedEmail) {
        newEmails.push(storedEmail);
        analyzeEmailAsync(account.user_id, storedEmail);
      }

    } catch (msgError) {
      console.error(`Error processing Outlook message ${message.id}:`, msgError);
    }
  }

  return newEmails;
}

/**
 * Parse Outlook message to standard format
 */
function parseOutlookMessage(message, account) {
  return {
    message_id: message.id,
    thread_id: message.conversationId,
    subject: message.subject || '(No Subject)',
    from_address: message.from?.emailAddress?.address,
    from_name: message.from?.emailAddress?.name,
    to_addresses: message.toRecipients?.map(r => ({ email: r.emailAddress.address, name: r.emailAddress.name })) || [],
    cc_addresses: message.ccRecipients?.map(r => ({ email: r.emailAddress.address, name: r.emailAddress.name })) || [],
    body_text: message.bodyPreview || message.body?.content,
    body_html: message.body?.contentType === 'html' ? message.body.content : null,
    snippet: message.bodyPreview,
    received_at: new Date(message.receivedDateTime),
    is_read: message.isRead,
    is_starred: message.flag?.flagStatus === 'flagged',
    has_attachments: message.hasAttachments,
  };
}

/**
 * Sync IMAP emails (iCloud, Spacemail)
 */
async function syncImap(account) {
  return new Promise((resolve, reject) => {
    const password = decrypt(account.password_encrypted);

    const imap = new Imap({
      user: account.username,
      password: password,
      host: account.imap_host,
      port: account.imap_port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const newEmails = [];

    imap.once('ready', async () => {
      try {
        imap.openBox('INBOX', false, async (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Search for recent emails
          const syncFrom = account.sync_from_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const searchCriteria = ['ALL', ['SINCE', syncFrom]];

          imap.search(searchCriteria, (err, uids) => {
            if (err) {
              imap.end();
              return reject(err);
            }

            if (!uids || uids.length === 0) {
              imap.end();
              return resolve([]);
            }

            // Limit number of emails
            const maxEmails = parseInt(process.env.MAX_EMAILS_PER_SYNC) || 100;
            const fetchUids = uids.slice(-maxEmails);

            const fetch = imap.fetch(fetchUids, { bodies: '', markSeen: false });

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream, info) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Email parse error:', err);
                    return;
                  }

                  try {
                    const emailData = parseImapMessage(parsed, account, seqno);
                    const storedEmail = await storeEmail(emailData, account);

                    if (storedEmail) {
                      newEmails.push(storedEmail);
                      analyzeEmailAsync(account.user_id, storedEmail);
                    }
                  } catch (storeErr) {
                    console.error('Error storing IMAP email:', storeErr);
                  }
                });
              });
            });

            fetch.once('end', () => {
              imap.end();
              resolve(newEmails);
            });

            fetch.once('error', (err) => {
              imap.end();
              reject(err);
            });
          });
        });
      } catch (err) {
        imap.end();
        reject(err);
      }
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

/**
 * Parse IMAP message to standard format
 */
function parseImapMessage(parsed, account, seqno) {
  return {
    message_id: parsed.messageId || `${account.id}-${seqno}`,
    thread_id: parsed.inReplyTo || parsed.references?.[0],
    subject: parsed.subject || '(No Subject)',
    from_address: parsed.from?.value?.[0]?.address,
    from_name: parsed.from?.value?.[0]?.name,
    to_addresses: parsed.to?.value?.map(a => ({ email: a.address, name: a.name })) || [],
    cc_addresses: parsed.cc?.value?.map(a => ({ email: a.address, name: a.name })) || [],
    body_text: parsed.text,
    body_html: parsed.html || null,
    snippet: parsed.text?.slice(0, 200),
    received_at: parsed.date || new Date(),
    has_attachments: parsed.attachments?.length > 0,
    attachments: parsed.attachments?.map(a => ({ filename: a.filename, size: a.size, contentType: a.contentType })),
  };
}

/**
 * Store email in database
 */
async function storeEmail(emailData, account) {
  try {
    // Check if email already exists
    const existing = await query(
      'SELECT id FROM emails WHERE message_id = $1',
      [emailData.message_id]
    );

    if (existing && existing.length > 0) {
      return null; // Already stored
    }

    const result = await query(
      `INSERT INTO emails
       (email_account_id, user_id, message_id, thread_id, subject, from_address, from_name,
        to_addresses, cc_addresses, body_text, body_html, snippet, received_at, is_read,
        is_starred, labels, has_attachments, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        account.id,
        account.user_id,
        emailData.message_id,
        emailData.thread_id,
        emailData.subject,
        emailData.from_address,
        emailData.from_name,
        JSON.stringify(emailData.to_addresses || []),
        JSON.stringify(emailData.cc_addresses || []),
        emailData.body_text,
        emailData.body_html,
        emailData.snippet,
        emailData.received_at,
        emailData.is_read || false,
        emailData.is_starred || false,
        JSON.stringify(emailData.labels || []),
        emailData.has_attachments || false,
        JSON.stringify(emailData.attachments || []),
      ]
    );

    return result[0];

  } catch (err) {
    console.error('Error storing email:', err);
    throw err;
  }
}

/**
 * Trigger AI analysis asynchronously (don't wait)
 */
async function analyzeEmailAsync(userId, email) {
  try {
    console.log(`[AI Analysis] Starting analysis for email ${email.id} from ${email.from_address}`);
    const analysis = await analyzeEmail(userId, email);

    console.log(`[AI Analysis] Successfully analyzed email ${email.id}:`, {
      priority: analysis.priority_level,
      category: analysis.category,
      sentiment: analysis.sentiment
    });

    // Update email with AI analysis
    await query(
      `UPDATE emails
       SET priority_score = $1,
           priority_level = $2,
           category = $3,
           sentiment = $4,
           action_items = $5,
           summary = $6,
           tags = $7,
           ai_analyzed_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        analysis.priority_score,
        analysis.priority_level,
        analysis.category,
        analysis.sentiment,
        JSON.stringify(analysis.action_items || []),
        analysis.summary,
        JSON.stringify(analysis.tags || []),
        email.id,
      ]
    );

    // Check if this is a high priority email and create notification
    if (analysis.priority_level === 'critical' || analysis.priority_level === 'high') {
      await query(
        `INSERT INTO notifications (user_id, email_id, type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          email.id,
          'important_email',
          `${analysis.priority_level.toUpperCase()}: ${email.subject}`,
          `From: ${email.from_name || email.from_address}\n${analysis.summary}`,
        ]
      );
    }

  } catch (err) {
    console.error(`[AI Analysis] FAILED for email ${email.id}:`, {
      error: err.message,
      stack: err.stack,
      emailFrom: email.from_address,
      emailSubject: email.subject,
      userId
    });
    // Don't throw - analysis failures shouldn't stop email sync
  }
}

/**
 * Helper functions
 */
function parseEmailAddress(str) {
  if (!str) return { email: '', name: '' };

  const match = str.match(/(.+?)\s*<(.+?)>/) || str.match(/(.+)/);

  if (match) {
    return {
      name: match[2] ? match[1].trim().replace(/"/g, '') : '',
      email: (match[2] || match[1]).trim(),
    };
  }

  return { email: str.trim(), name: '' };
}

function parseEmailAddresses(str) {
  if (!str) return [];

  return str.split(',').map(s => parseEmailAddress(s.trim()));
}

export default {
  syncEmailAccount,
};
