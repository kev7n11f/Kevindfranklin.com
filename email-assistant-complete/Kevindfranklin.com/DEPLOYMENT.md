# Deployment Guide - Email Assistant

## Quick Start Deployment

### Step 1: Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Vercel account created
- [ ] Neon PostgreSQL database created
- [ ] Google Cloud Console project (for Gmail)
- [ ] Azure AD app registration (for Outlook)
- [ ] Anthropic API key
- [ ] Custom domain configured (optional)

### Step 2: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project
3. Copy the connection string
4. Save as `DATABASE_URL` for later

### Step 3: Configure OAuth Applications

#### Google (Gmail)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: "Email Assistant"
3. Enable Gmail API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/email/connect/gmail` (development)
   - `https://yourdomain.com/api/email/connect/gmail` (production)
7. Save Client ID and Client Secret

#### Microsoft (Outlook)

1. Visit [Azure Portal](https://portal.azure.com/)
2. Go to Azure Active Directory → App registrations
3. New registration: "Email Assistant"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI: Web → `https://yourdomain.com/api/email/connect/outlook`
6. Go to API permissions → Add permissions:
   - Microsoft Graph
   - Delegated permissions: `User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`
   - Grant admin consent
7. Go to Certificates & secrets → New client secret
8. Save Application (client) ID and Client secret value

#### Anthropic (Claude AI)

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Go to API Keys
3. Create new API key
4. Save the key (starts with `sk-ant-`)

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd /path/to/Kevindfranklin.com
vercel link

# Add environment variables (interactive)
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REDIRECT_URI
vercel env add MICROSOFT_CLIENT_ID
vercel env add MICROSOFT_CLIENT_SECRET
vercel env add MICROSOFT_REDIRECT_URI
vercel env add DEFAULT_MONTHLY_BUDGET_CENTS
# ... add all other variables from .env.example

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `cd app && npm run build`
   - Output Directory: `app/dist`
5. Add environment variables:
   - Go to Settings → Environment Variables
   - Add all variables from `.env.example`
6. Deploy

### Step 5: Connect Neon to Vercel

1. In Vercel dashboard, go to Project Settings
2. Navigate to Integrations
3. Search for "Neon"
4. Click "Add" and follow the setup
5. Select your Neon database
6. Vercel automatically adds `DATABASE_URL`

### Step 6: Initialize Database

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-neon-connection-string"

# Run migrations
node db/migrations/migrate.js
```

Or use Vercel CLI:

```bash
# Run migration on Vercel
vercel exec -- node db/migrations/migrate.js
```

### Step 7: Configure Custom Domain

1. In Vercel dashboard, go to Project Settings → Domains
2. Add your domain: `app.kevindfranklin.com` (or subdomain)
3. Configure DNS:

```
Type: CNAME
Name: app (or your subdomain)
Value: cname.vercel-dns.com
```

4. Wait for SSL certificate provisioning (automatic)

### Step 8: Update OAuth Redirect URIs

Now that you have your production URL, update redirect URIs:

#### Google Console
- Add: `https://app.kevindfranklin.com/api/email/connect/gmail`

#### Azure Portal
- Add: `https://app.kevindfranklin.com/api/email/connect/outlook`

### Step 9: Test the Application

1. Visit your deployed URL
2. Register a new account
3. Try connecting an email account
4. Sync emails
5. Generate a draft reply
6. Check budget tracking

### Step 10: Set Up Budget Alerts (Optional)

You can create a cron job to send budget alerts:

```bash
# Create a Vercel cron function
# File: api/cron/budget-alerts.js
```

```javascript
import { query } from '../../db/connection.js';

export default async function handler(req, res) {
  // Check for users exceeding budget
  const results = await query(`
    SELECT u.email, b.estimated_cost_cents, b.budget_limit_cents
    FROM budget_usage b
    JOIN users u ON b.user_id = u.id
    WHERE b.estimated_cost_cents >= b.budget_limit_cents * 0.8
    AND b.alerts_sent < 3
  `);

  // Send alerts (implement email notification)

  res.status(200).json({ alerts: results.length });
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/budget-alerts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Environment Variables Reference

### Required Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=random-secret-min-32-chars
ENCRYPTION_KEY=random-key-min-32-chars
ANTHROPIC_API_KEY=sk-ant-...
```

### OAuth Variables (Required for each provider)

```env
# Gmail
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/email/connect/gmail

# Outlook
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/email/connect/outlook
```

### Optional Variables

```env
# Budget
DEFAULT_MONTHLY_BUDGET_CENTS=1000
BUDGET_ALERT_THRESHOLD_PERCENT=80

# Sync
DEFAULT_SYNC_FREQUENCY_MINUTES=5
MAX_EMAILS_PER_SYNC=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Generating Secure Secrets

```bash
# JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] All environment variables configured
- [ ] OAuth apps configured with correct redirect URIs
- [ ] Custom domain configured and SSL active
- [ ] Test user registration and login
- [ ] Test email account connection
- [ ] Test email sync
- [ ] Test draft generation
- [ ] Verify budget tracking works
- [ ] Monitor logs for errors
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure backups for Neon database

## Monitoring & Maintenance

### View Logs

```bash
# Vercel CLI
vercel logs

# Or in Vercel dashboard
# Go to Deployments → Select deployment → View logs
```

### Database Backups

Neon automatically backs up your database. To create manual backup:

1. Go to Neon Console
2. Select your project
3. Go to Backups
4. Create manual backup

### Update Deployment

```bash
# Commit changes
git add .
git commit -m "Update email assistant"
git push

# Vercel auto-deploys from git
# Or manually deploy
vercel --prod
```

## Troubleshooting

### Issue: OAuth callbacks fail

**Solution**: Verify redirect URIs match exactly in OAuth consoles

### Issue: Database connection errors

**Solution**: Check `DATABASE_URL` is correct and Neon database is running

### Issue: AI not analyzing emails

**Solution**:
- Verify `ANTHROPIC_API_KEY`
- Check budget hasn't been exceeded
- Review `api_usage_logs` table

### Issue: Email sync not working

**Solution**:
- Check email account credentials
- Verify OAuth tokens haven't expired
- Check `email_accounts` table for error messages

## Support

For issues or questions:
- Email: info@kevindfranklin.com
- Review logs in Vercel dashboard
- Check database for error messages

---

**Deployment Time**: ~30-60 minutes
**Difficulty**: Intermediate
