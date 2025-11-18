# Email Assistant - AI-Powered Email Management

A comprehensive, full-featured email management application that uses Claude 4.5 Sonnet AI to intelligently prioritize, categorize, and help you manage emails across multiple accounts.

## 🚀 Features

### Core Functionality
- **Multi-Account Support**: Gmail, Microsoft 365/Outlook, iCloud Mail, Spacemail
- **AI-Powered Analysis**: Automatic email prioritization, categorization, and summarization
- **Smart Draft Composition**: AI-generated email replies saved as drafts
- **Real-Time Sync**: Automatic email synchronization across all accounts
- **Budget Management**: Track and limit AI API usage costs
- **Action Item Extraction**: Automatically detect tasks and deadlines from emails

### AI Capabilities (Claude 4.5 Sonnet)
- **Priority Scoring**: 1-100 score with levels (Critical, High, Medium, Low)
- **Category Detection**: Customer, Work, Personal, Newsletter, Automated, Spam
- **Sentiment Analysis**: Positive, Neutral, Negative, Urgent
- **Smart Summaries**: Concise 1-2 sentence summaries for each email
- **Contextual Replies**: Professional draft responses based on email content
- **Batch Summaries**: Category-based daily/weekly email summaries

### Budget & Cost Control
- **Usage Tracking**: Monitor API calls, tokens, and estimated costs
- **Spending Limits**: Set monthly budget caps with automatic alerts
- **Pause/Resume**: Manually control AI spending
- **Detailed Logs**: View all API usage with timestamps and costs

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Zustand for state management
- Lucide React for icons

**Backend:**
- Vercel Serverless Functions (Node.js)
- Neon PostgreSQL (serverless database)
- JWT authentication
- AES-256-GCM encryption for credentials

**AI & Email Services:**
- Anthropic Claude 4.5 Sonnet API
- Gmail API (OAuth 2.0)
- Microsoft Graph API (OAuth 2.0)
- IMAP/SMTP for iCloud and Spacemail

**Deployment:**
- Vercel (frontend + serverless functions)
- Neon PostgreSQL (database)
- Custom domain: kevindfranklin.com/app

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Vercel account
- Neon PostgreSQL database
- API keys and OAuth credentials

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd Kevindfranklin.com

# Install root dependencies
npm install

# Install app dependencies
cd app
npm install

# Install API dependencies
cd ../api
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRES_IN=7d

# Encryption (32+ characters)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Claude AI API
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
CLAUDE_MODEL=claude-sonnet-4-5-20241022
CLAUDE_MAX_TOKENS=4096

# Gmail API (OAuth)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Microsoft Graph API (M365/Outlook)
MICROSOFT_CLIENT_ID=your-microsoft-application-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/auth/microsoft/callback

# Budget Settings
DEFAULT_MONTHLY_BUDGET_CENTS=1000
BUDGET_ALERT_THRESHOLD_PERCENT=80

# Application URLs
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Sync
DEFAULT_SYNC_FREQUENCY_MINUTES=5
MAX_EMAILS_PER_SYNC=100
```

### 3. Set Up OAuth Applications

#### Gmail (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://yourdomain.com/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### Microsoft 365 (Azure Portal)
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add permissions: `User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `offline_access`
5. Add redirect URI: `https://yourdomain.com/api/auth/microsoft/callback`
6. Generate client secret
7. Copy Application ID and Client Secret to `.env`

#### Claude AI (Anthropic)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Generate an API key
3. Copy to `.env` as `ANTHROPIC_API_KEY`

### 4. Initialize Database

```bash
# Run database migrations
node db/migrations/migrate.js
```

This will create all necessary tables:
- users
- email_accounts
- emails
- email_drafts
- email_rules
- budget_usage
- api_usage_logs
- notifications
- email_summaries
- sessions

### 5. Run Development Server

```bash
# Terminal 1: Run React app
cd app
npm run dev

# Terminal 2: API will run on Vercel dev (optional for local testing)
vercel dev
```

The app will be available at `http://localhost:3000`

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Link Project

```bash
vercel link
```

### 3. Configure Environment Variables

```bash
# Add all environment variables to Vercel
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
vercel env add ANTHROPIC_API_KEY
# ... add all other env variables
```

Or use the Vercel dashboard to add environment variables.

### 4. Connect Neon Database

In Vercel dashboard:
1. Go to Project Settings > Integrations
2. Add Neon integration
3. Select your Neon database
4. Vercel will automatically configure `DATABASE_URL`

### 5. Deploy

```bash
# Deploy to production
vercel --prod
```

### 6. Configure Custom Domain

1. In Vercel dashboard, go to Project Settings > Domains
2. Add `kevindfranklin.com` or subdomain
3. Update DNS records as instructed
4. SSL certificates are automatically provisioned

## 📖 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Email Account Management

#### Connect Gmail
```http
GET /api/email/connect/gmail
Authorization: Bearer <token>

Response: { authUrl: "https://accounts.google.com/..." }
```

```http
POST /api/email/connect/gmail
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "oauth_authorization_code"
}
```

#### Connect Outlook
```http
GET /api/email/connect/outlook
Authorization: Bearer <token>

Response: { authUrl: "https://login.microsoftonline.com/..." }
```

```http
POST /api/email/connect/outlook
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "oauth_authorization_code"
}
```

#### Connect iCloud/Spacemail (IMAP)
```http
POST /api/email/connect/imap
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "icloud",
  "email_address": "user@icloud.com",
  "password": "app-specific-password"
}
```

### Email Operations

#### List Emails
```http
GET /api/email/list?page=1&limit=50&priority=high&is_read=false&search=query
Authorization: Bearer <token>
```

#### Get Email
```http
GET /api/email/:id
Authorization: Bearer <token>
```

#### Update Email
```http
PATCH /api/email/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_read": true,
  "is_starred": false,
  "is_archived": false
}
```

#### Delete Email
```http
DELETE /api/email/:id
Authorization: Bearer <token>
```

#### Sync Emails
```http
POST /api/email/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_id": "uuid" // Optional, syncs all if omitted
}
```

### Draft Management

#### Generate Draft Reply
```http
POST /api/drafts/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "email_id": "uuid",
  "tone": "professional",
  "instructions": "Keep it brief"
}
```

### Budget Management

#### Get Budget Status
```http
GET /api/budget/status
Authorization: Bearer <token>
```

#### Update Budget
```http
PATCH /api/budget/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "budget_limit_cents": 2000,
  "is_paused": false
}
```

## 💰 Cost Estimation

### Claude 4.5 Sonnet Pricing
- **Input**: $3.00 per 1M tokens
- **Output**: $15.00 per 1M tokens

### Typical Usage per Email
- **Analysis**: ~1,000 input + ~200 output tokens = $0.006
- **Draft Reply**: ~1,500 input + ~500 output tokens = $0.012

### Monthly Estimates
- **100 emails/day**: ~$54/month
- **500 emails/day**: ~$270/month
- **1000 emails/day**: ~$540/month

**Note**: Set budget limits to control costs. The application will pause AI processing when limits are reached.

## 🔒 Security Features

### Data Protection
- **Encryption**: All email credentials encrypted with AES-256-GCM
- **JWT Tokens**: Secure session management with 7-day expiry
- **Password Hashing**: bcrypt with salt rounds
- **HTTPS Only**: All connections secured with SSL/TLS

### Rate Limiting
- **API Protection**: 100 requests per 15 minutes per IP
- **Budget Limits**: Automatic AI spending controls
- **Session Management**: Automatic cleanup of expired sessions

### Best Practices
- Never commit `.env` files
- Rotate API keys regularly
- Use app-specific passwords for IMAP accounts
- Enable 2FA on all email accounts
- Review budget alerts promptly

## 📱 Usage Guide

### 1. Register Account
- Visit `/register`
- Create account with strong password
- Login automatically redirects to dashboard

### 2. Connect Email Accounts
- Go to Settings
- Click "Connect" for Gmail, Outlook, iCloud, or Spacemail
- Follow OAuth flow for Gmail/Outlook
- Enter credentials for iCloud/Spacemail
- Multiple accounts supported

### 3. Sync Emails
- Click "Sync Emails" button in sidebar
- Initial sync fetches last 7 days
- Subsequent syncs fetch new emails only
- Automatic sync every 5 minutes (configurable)

### 4. View Prioritized Inbox
- Dashboard shows all emails sorted by priority
- Filter by priority level, read status, category
- Search across all accounts
- AI-generated summaries displayed

### 5. Generate Draft Replies
- Open any email
- Click "Generate Reply"
- AI creates draft based on email context
- Edit and send from your email client

### 6. Manage Budget
- Go to Budget page
- View current usage and limits
- Update monthly budget limit
- Pause/resume AI spending
- Review detailed API usage logs

## 🛠️ Advanced Configuration

### Custom Email Rules
The database supports custom email rules (UI coming soon):

```sql
INSERT INTO email_rules (user_id, name, conditions, actions, priority)
VALUES (
  'user-uuid',
  'VIP Sender Rule',
  '{"from": ["boss@company.com", "client@important.com"]}',
  '{"setPriority": "critical", "setCategory": "work"}',
  100
);
```

### Sync Frequency
Modify `DEFAULT_SYNC_FREQUENCY_MINUTES` in `.env` to change how often emails are synced.

### Email Retention
By default, emails are kept forever. To implement retention:

```sql
DELETE FROM emails
WHERE created_at < NOW() - INTERVAL '90 days'
AND is_starred = false
AND is_archived = true;
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
node -e "require('./db/connection.js').query('SELECT 1')"
```

### OAuth Callback Errors
- Verify redirect URIs match exactly in Google/Microsoft consoles
- Ensure HTTPS is used in production
- Check that scopes are properly configured

### Email Sync Failures
- Check email account credentials
- Verify IMAP/SMTP settings for iCloud/Spacemail
- Review `email_accounts` table for error messages
- Check rate limits on email providers

### Budget Not Updating
- Verify `ANTHROPIC_API_KEY` is correct
- Check `api_usage_logs` table for errors
- Ensure budget_usage table has current month entry

## 📈 Roadmap

### Planned Features
- [ ] Email templates for common responses
- [ ] Snooze/reminder functionality
- [ ] Unified attachment manager
- [ ] Advanced email analytics dashboard
- [ ] Mobile responsive design improvements
- [ ] Email threading view
- [ ] Calendar integration
- [ ] Smart scheduling suggestions
- [ ] Webhook support for real-time sync
- [ ] Email rules UI
- [ ] Data retention configuration UI
- [ ] Export/backup functionality

## 🤝 Contributing

This is a personal project for Kevin D. Franklin's email management. Feel free to fork and customize for your own use.

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Kevin D. Franklin**
- Website: [kevindfranklin.com](https://www.kevindfranklin.com)
- Email: info@kevindfranklin.com

## 🙏 Acknowledgments

- Anthropic for Claude 4.5 Sonnet API
- Vercel for hosting and serverless functions
- Neon for serverless PostgreSQL database
- Google and Microsoft for email APIs

---

**Last Updated**: November 2025
