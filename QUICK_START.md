# Email Assistant - Quick Start Guide

Get your Email Assistant up and running in under 10 minutes!

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18 or higher installed
- ✅ A Neon PostgreSQL database (free tier works!)
- ✅ An Anthropic API key (for Claude AI)

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/kev7n11f/Kevindfranklin.com.git
cd Kevindfranklin.com

# Install all dependencies
npm install
```

## Step 2: Set Up Environment Variables (3 minutes)

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your actual credentials:

```bash
# Required - Get these first!
DATABASE_URL=your-neon-database-url
ANTHROPIC_API_KEY=your-anthropic-api-key
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### Quick Links to Get Your Keys:
1. **Neon Database:** https://neon.tech (Free tier available)
   - Create a project → Copy connection string → Paste as DATABASE_URL
2. **Anthropic API:** https://console.anthropic.com
   - API Keys → Create Key → Copy → Paste as ANTHROPIC_API_KEY

## Step 3: Initialize Database (1 minute)

```bash
# Run migrations
npm run migrate
```

You should see: ✅ "Database migrations completed successfully"

## Step 4: Start the Application (1 minute)

```bash
# Start development server
npm run dev
```

Open your browser to: **http://localhost:5173**

## Step 5: Create Your Account (1 minute)

1. Click **"Register"**
2. Enter your email and password (8+ chars, uppercase, lowercase, number)
3. Click **"Sign Up"**

You're in! 🎉

## Step 6: Connect Your First Email Account (2 minutes)

### Option A: Gmail (OAuth - Recommended)

**Note:** Requires Google Cloud Console setup (see full README for details)

1. Go to **Settings** → **Email Accounts**
2. Click **"Connect Gmail"**
3. Follow OAuth flow

### Option B: Any IMAP Provider (Easiest for testing)

1. Go to **Settings** → **Email Accounts**
2. Click **"Add IMAP Account"**
3. Enter details:
   - **Email:** your@email.com
   - **IMAP Server:** imap.gmail.com (or your provider)
   - **IMAP Port:** 993
   - **Username:** your@email.com
   - **Password:** your-app-password
   - **SMTP Server:** smtp.gmail.com
   - **SMTP Port:** 587

**Gmail App Password:**
- Enable 2FA → Google Account → Security → App Passwords → Generate

4. Click **"Connect"**

## Step 7: Sync and Enjoy! (30 seconds)

1. Click the **"Sync Emails"** button in the sidebar
2. Watch as your emails load
3. See AI analysis in action! 🤖

## What's Next?

### Explore Key Features:

**📧 Dashboard**
- View all your emails
- Filter by priority, category, or status
- Use multi-select for batch operations

**✨ AI Features** (in Settings → Enable AI Analysis)
- Automatic priority detection
- Smart categorization
- Email summarization
- Action items extraction

**💰 Budget Management**
- Track AI costs in real-time
- Set monthly spending limits
- View detailed usage logs

**⚡ Automation Rules**
- Create custom email rules
- Auto-categorize by sender
- Skip AI for newsletters
- Archive promotional emails

**📊 Analytics**
- Email statistics
- Category breakdown
- Top senders analysis
- Activity timeline

**⌨️ Keyboard Shortcuts**
- Press **?** to see all shortcuts
- `g + d` → Dashboard
- `g + a` → Analytics
- `/` → Search

## Common Issues

### "Database connection failed"
- ✅ Check DATABASE_URL is correct
- ✅ Ensure SSL mode is `?sslmode=require`
- ✅ Verify Neon database is running

### "Invalid API key"
- ✅ Check ANTHROPIC_API_KEY is correct
- ✅ Ensure no extra spaces in .env
- ✅ Verify API key is active at console.anthropic.com

### "Email sync failed"
- ✅ Verify IMAP credentials are correct
- ✅ Check if 2FA is enabled (use app password)
- ✅ Ensure IMAP is enabled on your email account

### "Build errors"
- ✅ Run `npm install` in root, api/, and app/ directories
- ✅ Check Node.js version (18+)
- ✅ Clear node_modules and reinstall

## Need Help?

- 📖 **Full Documentation:** See EMAIL_ASSISTANT_COMPLETE_README.md
- 🐛 **Found a bug?** Open an issue on GitHub
- 💡 **Feature request?** Check CONTRIBUTING.md
- 📊 **Project status?** See PROJECT_STATUS.md

## Deploy to Production (Bonus)

Ready to deploy? Here's the fastest way:

### Deploy to Vercel (5 minutes)

1. **Push to GitHub** (if not already)
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Import your GitHub repo

3. **Configure Environment Variables**
   - Copy all variables from your `.env`
   - Paste in Vercel dashboard → Settings → Environment Variables

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🚀

## Tips for Success

### 🎯 Start Small
- Connect one email account first
- Test with a few emails
- Explore features gradually

### 💡 Use AI Wisely
- Enable AI analysis for important emails only
- Skip AI for newsletters (use rules)
- Monitor your budget

### ⚡ Power User Tips
- Learn keyboard shortcuts (press `?`)
- Create automation rules early
- Review analytics weekly

### 🔒 Security Best Practices
- Use strong passwords (16+ characters)
- Enable 2FA on your email accounts
- Use app passwords instead of main password
- Regularly review connected accounts

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database migrated (`npm run migrate`)
- [ ] App running (`npm run dev`)
- [ ] Account created
- [ ] First email account connected
- [ ] Emails synced
- [ ] AI analysis working
- [ ] Explored key features

## You're All Set! 🎉

Congratulations! You now have a fully functional AI-powered email assistant.

### Next Steps:
1. **Connect more email accounts** in Settings
2. **Set up automation rules** to save time
3. **Explore analytics** to understand your inbox
4. **Customize AI settings** to match your preferences
5. **Share feedback** to help improve the project

Happy emailing! 📬

---

**Questions?** Check the full README or open an issue on GitHub.
**Want to contribute?** See CONTRIBUTING.md for guidelines.
