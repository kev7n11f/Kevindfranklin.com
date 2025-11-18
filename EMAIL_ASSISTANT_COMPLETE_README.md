# Email Assistant - Complete Feature Documentation

A comprehensive AI-powered email management system built with Claude 4.5 Sonnet, React, and Vercel.

## 🎯 Complete Feature List

### ✅ Core Email Management
- **Multi-Provider Support**
  - Gmail (OAuth 2.0)
  - Microsoft 365/Outlook (OAuth 2.0)
  - iCloud Mail (IMAP/SMTP)
  - Spacemail (IMAP/SMTP)
  - Custom IMAP/SMTP providers

- **Email Operations**
  - List emails with pagination
  - Advanced filtering (priority, category, read/unread, search)
  - Batch operations (mark read/unread, star, archive, delete)
  - Individual quick actions
  - Email composition and replies
  - Manual and AI-generated drafts

### 🤖 AI-Powered Features (Claude 4.5 Sonnet)
- **Automatic Email Analysis**
  - Priority detection (Critical, High, Medium, Low)
  - Category classification (Work, Personal, Finance, Newsletter, Promotional, Social)
  - Sentiment analysis (Positive, Negative, Neutral, Urgent)
  - Smart summarization
  - Key points extraction
  - Action items identification

- **AI Draft Generation**
  - Context-aware reply composition
  - Multiple tone options (Professional, Casual, Formal)
  - Confidence scoring
  - AI reasoning display
  - Manual draft editing

- **Budget Management**
  - Real-time cost tracking ($3/1M input tokens, $15/1M output tokens)
  - Configurable spending limits
  - Automatic pause when limit reached
  - Detailed usage analytics
  - Monthly budget periods

### 🎨 User Interface
- **Dashboard**
  - Clean, modern design with Tailwind CSS
  - Multi-select with batch operations
  - Advanced filters and search
  - Priority and category badges
  - AI analysis indicators
  - Quick action buttons
  - Responsive layout

- **Email View**
  - Full email display (HTML/text)
  - AI summary with action items
  - Sentiment and category display
  - Attachment listing
  - Quick actions (star, archive, delete)
  - Both AI and manual reply options

- **Drafts Management**
  - List all drafts with status
  - Edit draft content
  - Send or delete drafts
  - Confidence score display
  - AI context and reasoning

- **Settings**
  - Email account management
  - Profile editing
  - AI/notification preferences
  - IMAP account configuration
  - Sync frequency settings

- **Analytics Dashboard**
  - Overview statistics
  - Category breakdown charts
  - Priority distribution
  - Top senders analysis
  - Daily activity timeline
  - Time range selection (7d, 30d, 90d, all)

- **Email Rules/Automation**
  - Custom rule builder
  - Condition-based triggers
  - Multiple actions per rule
  - Enable/disable rules
  - Applied count tracking

- **Notifications System**
  - Real-time notification center
  - Unread count badge
  - Mark as read/delete
  - Mark all as read
  - Auto-refresh every 30s

### ⌨️ Keyboard Shortcuts
- `g + d` - Go to Dashboard
- `g + r` - Go to Drafts
- `g + a` - Go to Analytics
- `g + u` - Go to Rules
- `g + b` - Go to Budget
- `g + s` - Go to Settings
- `/` - Focus search
- `r` - Refresh/sync emails
- `Esc` - Cancel/blur input
- `?` - Show shortcuts help

### 🔒 Security Features
- JWT authentication with 7-day expiration
- Bcrypt password hashing (10 rounds)
- AES-256-GCM encryption for credentials
- Rate limiting (100 requests per 15 minutes)
- CORS handling
- Input validation
- Session management
- Secure token storage

### 🗄️ Database (PostgreSQL/Neon)
- **users** - User accounts and settings
- **email_accounts** - Connected email accounts
- **emails** - Email messages with AI analysis
- **email_drafts** - Draft replies
- **email_rules** - Automation rules
- **budget_usage** - Monthly budget tracking
- **api_usage_logs** - Detailed API call logs
- **notifications** - User notifications
- **email_summaries** - Category summaries
- **sessions** - User sessions

### 🚀 Performance & UX
- **Loading States**
  - Skeleton components for all pages
  - Loading indicators
  - Optimistic UI updates
  - Smooth transitions

- **Error Handling**
  - Global error boundary
  - Graceful error recovery
  - User-friendly error messages
  - Stack traces in development
  - Retry functionality

- **Optimization**
  - Lazy loading
  - Pagination
  - Debounced search
  - Cached requests
  - Efficient re-renders

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Vercel Serverless Functions** - API
- **Neon PostgreSQL** - Database
- **Anthropic Claude AI** - Email analysis
- **Google Gmail API** - Gmail integration
- **Microsoft Graph API** - Outlook integration
- **Nodemailer** - SMTP support
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Vercel account
- Neon PostgreSQL database
- Anthropic API key
- (Optional) Gmail/Outlook OAuth credentials

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Encryption (32 characters minimum)
ENCRYPTION_KEY=your-32-character-encryption-key

# Claude AI API
ANTHROPIC_API_KEY=sk-ant-your-api-key
CLAUDE_MODEL=claude-sonnet-4-5-20241022
CLAUDE_MAX_TOKENS=4096

# Gmail API (Optional - OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/email/connect/gmail/callback

# Microsoft Graph API (Optional - OAuth)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/email/connect/outlook/callback

# Budget Settings
DEFAULT_MONTHLY_BUDGET_CENTS=1000
BUDGET_ALERT_THRESHOLD_PERCENT=80

# Application
NODE_ENV=production
```

### Generate Secure Keys

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 16
```

### Local Development

```bash
# Install dependencies
npm install
cd api && npm install
cd ../app && npm install

# Run database migrations
npm run migrate

# Start development servers
npm run dev
```

### Deployment to Vercel

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Select the root directory

2. **Configure Environment Variables**
   - Add all variables from `.env` in Vercel dashboard
   - Go to Settings → Environment Variables
   - Enable for Production, Preview, and Development

3. **Deploy**
   - Vercel will automatically build and deploy
   - Database migrations run automatically on deploy
   - Access your app at the provided URL

## 📚 Usage Guide

### Getting Started

1. **Register Account**
   - Navigate to `/register`
   - Enter email and password (8+ chars, uppercase, lowercase, number)
   - Account created with default budget ($10/month)

2. **Connect Email Accounts**
   - Go to Settings → Email Accounts
   - Click "Add Account"
   - Choose provider (Gmail, Outlook, iCloud, Spacemail)
   - Follow OAuth flow or enter IMAP credentials

3. **Sync Emails**
   - Click "Sync Emails" button in sidebar
   - Or wait for automatic sync (every 5 minutes)
   - AI analysis runs automatically (if enabled)

### Creating Email Rules

1. Go to Rules page
2. Click "New Rule"
3. Name your rule
4. Add conditions (e.g., "from contains @company.com")
5. Add actions (e.g., "set category to work")
6. Save and enable

### Viewing Analytics

1. Navigate to Analytics page
2. Select time range (7d, 30d, 90d, all)
3. View:
   - Overview stats
   - Category breakdown
   - Priority distribution
   - Top senders
   - Daily activity

### Managing Budget

1. Go to Budget page
2. View current usage and limits
3. Update monthly limit
4. Pause/resume AI spending
5. View detailed API usage logs

### Using Drafts

1. Open an email
2. Click "Generate AI Reply" or "Write Manual Reply"
3. AI draft appears in Drafts page
4. Review and edit if needed
5. Click "Send" to send

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile
- `PATCH /api/auth/settings` - Update settings

### Emails
- `GET /api/email/list` - List emails (filtered, paginated)
- `GET /api/email/:id` - Get single email
- `PATCH /api/email/:id` - Update email
- `DELETE /api/email/:id` - Delete email
- `POST /api/email/sync` - Trigger sync

### Email Accounts
- `GET /api/email/accounts` - List accounts
- `POST /api/email/connect/gmail` - Connect Gmail
- `POST /api/email/connect/outlook` - Connect Outlook
- `POST /api/email/connect/imap` - Connect IMAP
- `DELETE /api/email/accounts/:id` - Disconnect account

### Drafts
- `GET /api/drafts` - List drafts
- `POST /api/drafts/create` - Create draft
- `PATCH /api/drafts/:id` - Update draft
- `DELETE /api/drafts/:id` - Delete draft
- `POST /api/drafts/:id/send` - Send draft

### Rules
- `GET /api/rules` - List rules
- `POST /api/rules` - Create rule
- `PATCH /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

### Analytics
- `GET /api/analytics` - Get analytics data

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/mark-all-read` - Mark all as read

### Budget
- `GET /api/budget/status` - Get budget status
- `POST /api/budget/update` - Update budget limits

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
- Ensure all dependencies are in `dependencies`, not `devDependencies`
- Check Node.js version (18+ required)
- Verify environment variables are set

**Database Errors**
- Verify DATABASE_URL is correct
- Check SSL mode is `require` for Neon
- Ensure migrations ran successfully

**OAuth Not Working**
- Verify redirect URIs match exactly in provider settings
- Check client ID and secret are correct
- Ensure environment is Production

**AI Analysis Not Working**
- Verify ANTHROPIC_API_KEY is valid
- Check budget hasn't been exceeded
- Ensure autoAnalyze is enabled in settings

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues or questions:
- GitHub Issues: [your-repo/issues]
- Email: your@email.com

---

**Built with ❤️ using Claude 4.5 Sonnet**
