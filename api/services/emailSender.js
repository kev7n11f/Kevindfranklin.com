import { query } from '../../db/connection.js';
import { decrypt } from '../utils/encryption.js';
import nodemailer from 'nodemailer';

/**
 * Send an email through the appropriate provider
 * @param {object} options - Email options
 * @param {string} options.accountId - Email account ID
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body
 * @param {string} options.inReplyTo - Message ID to reply to (optional)
 */
export async function sendEmail({ accountId, to, subject, body, inReplyTo }) {
  // Get account details
  const accounts = await query(
    `SELECT * FROM email_accounts WHERE id = $1`,
    [accountId]
  );

  if (!accounts || accounts.length === 0) {
    throw new Error('Email account not found');
  }

  const account = accounts[0];

  if (!account.is_active) {
    throw new Error('Email account is not active');
  }

  // Route to appropriate sender based on provider
  switch (account.provider) {
    case 'gmail':
      return sendGmailEmail(account, { to, subject, body, inReplyTo });

    case 'outlook':
      return sendOutlookEmail(account, { to, subject, body, inReplyTo });

    case 'icloud':
    case 'spacemail':
    case 'custom':
      return sendSMTPEmail(account, { to, subject, body, inReplyTo });

    default:
      throw new Error(`Unsupported email provider: ${account.provider}`);
  }
}

/**
 * Send email via Gmail API
 */
async function sendGmailEmail(account, { to, subject, body, inReplyTo }) {
  const { google } = await import('googleapis');

  const accessToken = decrypt(account.access_token);
  const refreshToken = decrypt(account.refresh_token);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Create email in RFC 2822 format
  const email = [
    `From: ${account.email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
    inReplyTo ? `References: ${inReplyTo}` : '',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].filter(Boolean).join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });
}

/**
 * Send email via Microsoft Graph API
 */
async function sendOutlookEmail(account, { to, subject, body, inReplyTo }) {
  const axios = (await import('axios')).default;
  const accessToken = decrypt(account.access_token);

  const message = {
    subject,
    body: {
      contentType: 'Text',
      content: body,
    },
    toRecipients: [
      {
        emailAddress: {
          address: to,
        },
      },
    ],
  };

  await axios.post(
    'https://graph.microsoft.com/v1.0/me/sendMail',
    { message },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Send email via SMTP (iCloud, Spacemail, custom)
 */
async function sendSMTPEmail(account, { to, subject, body, inReplyTo }) {
  const password = decrypt(account.password);
  const credentials = JSON.parse(account.credentials || '{}');

  const transporter = nodemailer.createTransport({
    host: credentials.smtp_host,
    port: parseInt(credentials.smtp_port) || 587,
    secure: credentials.smtp_port === '465', // true for 465, false for other ports
    auth: {
      user: account.email,
      pass: password,
    },
  });

  const mailOptions = {
    from: account.email,
    to,
    subject,
    text: body,
  };

  if (inReplyTo) {
    mailOptions.inReplyTo = inReplyTo;
    mailOptions.references = inReplyTo;
  }

  await transporter.sendMail(mailOptions);
}

export default {
  sendEmail,
};
