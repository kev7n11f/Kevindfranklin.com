# Email Assistant - Proper OAuth Setup Guide

## Architecture Overview

Your Email Assistant is correctly designed as a **multi-tenant application** where:

✅ **Each user manages their own email accounts**
✅ **User credentials are encrypted in the database**
✅ **Environment variables only contain YOUR app's OAuth credentials**

## What Goes in Environment Variables

The OAuth credentials in your `.env` file are **YOUR APPLICATION'S** credentials, not user credentials:

```env
# These allow YOUR APP to authenticate users with Google/Microsoft
GOOGLE_CLIENT_ID=your-app-client-id
GOOGLE_CLIENT_SECRET=your-app-client-secret
GOOGLE_REDIRECT_URI=https://www.kevindfranklin.com/api/email/connect/gmail-callback

MICROSOFT_CLIENT_ID=your-app-client-id
MICROSOFT_CLIENT_SECRET=your-app-client-secret
MICROSOFT_REDIRECT_URI=https://www.kevindfranklin.com/api/email/connect/outlook-callback
```

## How Users Add Their Email Accounts

### 1. User Flow (What Your Users Do)

1. Register/Login to kevindfranklin.com
2. Go to Settings → Email Accounts
3. Click "Connect Gmail" or "Connect Outlook" or "Add IMAP Account"
4. Authenticate with their email provider
5. Their credentials are encrypted and saved to the database

### 2. Supported Methods

#### OAuth (Gmail & Outlook) - Recommended

- Users click "Connect Gmail/Outlook"
- Redirected to Google/Microsoft login
- Grant permissions
- Tokens stored encrypted in database

#### IMAP/SMTP (Any provider)

- Users enter their email and password
- Support for iCloud, custom providers
- Credentials encrypted in database

### 3. What Gets Stored in Database

```sql
email_accounts table:
- user_id (who owns this account)
- provider (gmail, outlook, icloud, etc)
- email_address
- access_token (encrypted)
- refresh_token (encrypted)
- password_encrypted (for IMAP)
- imap_host, smtp_host settings
```

## Setting Up OAuth for Your Application

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "Email Assistant"
3. Enable APIs: Gmail API
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "Email Assistant"
   - Authorized redirect URIs:
     - `https://www.kevindfranklin.com/api/email/connect/gmail-callback`
     - `http://localhost:3000/api/email/connect/gmail-callback` (for dev)
5. Copy Client ID and Client Secret
6. Add to your `.env` and Vercel environment variables

### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. New registration:
   - Name: "Email Assistant"
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `https://www.kevindfranklin.com/api/email/connect/outlook-callback`
4. Copy Application (client) ID
5. Create a client secret (Certificates & secrets)
6. API permissions → Add:
   - User.Read
   - Mail.Read
   - Mail.ReadWrite
   - Mail.Send
   - offline_access
7. Grant admin consent
8. Add credentials to `.env` and Vercel

## Files Created/Updated

### ✅ OAuth Callback Handlers (New)

- `api/email/connect/gmail-callback.js` - Handles Google OAuth callback
- `api/email/connect/outlook-callback.js` - Handles Microsoft OAuth callback

### ✅ Updated Files

- `app/src/pages/Settings.jsx` - Handles OAuth redirect messages
- `db/connection.js` - Fixed to use POSTGRES_URL fallback
- `api/email/accounts.js` - Fixed column name mismatch
- `.env` - Removed user credentials, added OAuth setup instructions

## How It Works

### OAuth Flow Diagram

User clicks "Connect Gmail"
    ↓
Frontend calls GET /api/email/connect/gmail
    ↓
Backend generates OAuth URL with user's ID in state
    ↓
User redirected to Google login
    ↓
User grants permissions
    ↓
Google redirects to /api/email/connect/gmail-callback?code=xxx&state={userId}
    ↓
Backend exchanges code for tokens
    ↓
Tokens encrypted and saved to database for this user
    ↓
User redirected back to /settings with success message

### IMAP Flow

User fills IMAP form (email, password, hosts)
    ↓
Frontend submits to POST /api/email/connect/imap
    ↓
Backend tests IMAP connection
    ↓
If successful, credentials encrypted and saved to database
    ↓
User sees account in their list

## Security Features

✅ All user tokens/passwords encrypted with `ENCRYPTION_KEY`
✅ OAuth tokens auto-refresh
✅ JWT authentication required for all API calls
✅ Each user only sees their own accounts
✅ HTTPS enforced in production

## Testing Locally

1. Update `.env` with your OAuth credentials
2. Use ngrok or similar for HTTPS callback: `ngrok http 3000`
3. Update redirect URIs in Google/Microsoft console to your ngrok URL
4. Start dev server: `npm run dev`
5. Register account, go to settings, test connecting accounts

## Deployment Checklist

- [ ] Set up Google OAuth credentials
- [ ] Set up Microsoft OAuth credentials  
- [ ] Add all environment variables to Vercel:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `ENCRYPTION_KEY`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_REDIRECT_URI`
  - `ANTHROPIC_API_KEY`
- [ ] Deploy to Vercel
- [ ] Test OAuth flow with a real account

## Common Issues

### "401 Unauthorized" when connecting Gmail

- Check `GOOGLE_CLIENT_ID` is set
- Verify redirect URI matches exactly in Google Console

### "500 Internal Server Error" on accounts page  

- Check `DATABASE_URL` is set
- Run database migrations

### OAuth redirects to wrong URL

- Update `GOOGLE_REDIRECT_URI` / `MICROSOFT_REDIRECT_URI` in env
- Must match exactly what's in OAuth provider console

## Summary

Your application is **correctly architected** for multi-user email management:

- ✅ Users add their own accounts through the UI
- ✅ Credentials stored encrypted per user in database
- ✅ Environment variables only for app-level OAuth credentials
- ✅ Supports unlimited users, each with unlimited email accounts
- ✅ No need to modify code when users add accounts

This is the proper way to build a SaaS email management platform!
