import { authenticate } from '../../middleware/auth.js';
import { query } from '../../../db/connection.js';
import { encrypt } from '../../utils/encryption.js';
import { success, error, handleCors, badRequest } from '../../utils/response.js';
import { validateEmailAccount } from '../../utils/validators.js';
import Imap from 'imap';

// Provider-specific IMAP/SMTP settings
const PROVIDER_SETTINGS = {
  gmail: {
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
  },
  outlook: {
    imap_host: 'outlook.office365.com',
    imap_port: 993,
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
  },
  icloud: {
    imap_host: 'imap.mail.me.com',
    imap_port: 993,
    smtp_host: 'smtp.mail.me.com',
    smtp_port: 587,
  },
  yahoo: {
    imap_host: 'imap.mail.yahoo.com',
    imap_port: 993,
    smtp_host: 'smtp.mail.yahoo.com',
    smtp_port: 587,
  },
  spacemail: {
    imap_host: 'mail.spacemail.com',
    imap_port: 993,
    smtp_host: 'mail.spacemail.com',
    smtp_port: 465,
  },
};

/**
 * Test IMAP connection
 */
function testImapConnection(config) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    
    let timeout = setTimeout(() => {
      imap.end();
      reject(new Error('Connection timeout after 15 seconds'));
    }, 15000);

    imap.once('ready', () => {
      clearTimeout(timeout);
      imap.end();
      resolve(true);
    });

    imap.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    try {
      imap.connect();
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}

export default async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return;

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await authenticate(req, res);
  if (!user) return;

  try {
    const {
      provider, // 'icloud' or 'spacemail'
      email_address,
      password,
      imap_host,
      imap_port,
      smtp_host,
      smtp_port,
    } = req.body;

    // Validation
    const validation = validateEmailAccount({
      email_address,
      provider,
      password,
    });

    if (!validation.valid) {
      return badRequest(res, validation.errors.join(', '));
    }

    // Get provider settings or use custom settings
    let settings;

    if (PROVIDER_SETTINGS[provider]) {
      // Use predefined settings for known providers
      settings = PROVIDER_SETTINGS[provider];
    } else if (provider === 'custom') {
      // Custom provider - use provided settings
      if (!imap_host || !smtp_host) {
        return badRequest(res, 'IMAP and SMTP host are required for custom provider');
      }
      settings = {
        imap_host,
        imap_port: imap_port || 993,
        smtp_host,
        smtp_port: smtp_port || 587,
      };
    } else {
      return badRequest(res, 'Invalid provider');
    }

    // Test IMAP connection
    try {
      await testImapConnection({
        user: email_address,
        password: password,
        host: settings.imap_host,
        port: settings.imap_port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });
    } catch (connErr) {
      console.error('IMAP connection test failed:', connErr);
      
      // Provide better error messages
      let errorMsg = 'Failed to connect to email server. ';
      if (connErr.message.includes('AUTHENTICATIONFAILED') || connErr.message.includes('Invalid credentials')) {
        errorMsg += 'Invalid email or password.';
      } else if (connErr.message.includes('timeout')) {
        errorMsg += 'Connection timeout - check server settings.';
      } else if (connErr.message.includes('ENOTFOUND')) {
        errorMsg += 'Server not found - check IMAP host.';
      } else {
        errorMsg += 'Please verify your email, password, and server settings.';
      }
      
      return error(res, errorMsg);
    }

    // Check if account already exists
    const existingAccounts = await query(
      'SELECT id FROM email_accounts WHERE user_id = $1 AND email_address = $2',
      [user.id, email_address]
    );

    let accountId;

    if (existingAccounts && existingAccounts.length > 0) {
      // Update existing account
      accountId = existingAccounts[0].id;

      await query(
        `UPDATE email_accounts
         SET imap_host = $1,
             imap_port = $2,
             smtp_host = $3,
             smtp_port = $4,
             username = $5,
             password_encrypted = $6,
             connection_status = 'connected',
             error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          settings.imap_host,
          settings.imap_port,
          settings.smtp_host,
          settings.smtp_port,
          email_address,
          encrypt(password),
          accountId,
        ]
      );
    } else {
      // Create new account
      const newAccounts = await query(
        `INSERT INTO email_accounts
         (user_id, provider, email_address, imap_host, imap_port, smtp_host, smtp_port, username, password_encrypted, connection_status, sync_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          user.id,
          provider,
          email_address,
          settings.imap_host,
          settings.imap_port,
          settings.smtp_host,
          settings.smtp_port,
          email_address,
          encrypt(password),
          'connected',
          true,
        ]
      );

      accountId = newAccounts[0].id;
    }

    return success(res, {
      accountId,
      email: email_address,
      provider,
    }, `${provider} account connected successfully`);

  } catch (err) {
    console.error('IMAP connection error:', err);
    return error(res, 'Failed to connect email account');
  }
}
