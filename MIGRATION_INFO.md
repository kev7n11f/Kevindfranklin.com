# Automatic Database Migration

This project is configured to automatically run database migrations during deployment to Vercel.

## How It Works

When you deploy to Vercel:

1. **Install Phase**: `npm install` runs, which also installs API dependencies
2. **Build Phase**: `npm run build` executes, which:
   - Runs `npm run migrate` (executes `scripts/auto-migrate.js`)
   - Automatically creates/updates all database tables in Neon
   - Then builds the React app

## Migration Script

The migration is handled by `scripts/auto-migrate.js`:

- ✅ Reads the schema from `db/schema/001_initial_schema.sql`
- ✅ Executes all SQL statements in order
- ✅ Skips tables/objects that already exist (idempotent)
- ✅ Uses the `POSTGRES_URL` environment variable
- ✅ Provides detailed logging during deployment

## Environment Variables Required

Make sure these are set in Vercel:

- `POSTGRES_URL` - Your Neon database connection string
- `POSTGRES_PRISMA_URL` - Prisma connection string
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection

## Manual Migration (if needed)

If you need to run migrations manually:

```bash
# Install dependencies first
npm install

# Run migration
npm run migrate
```

Or directly:

```bash
node scripts/auto-migrate.js
```

## Troubleshooting

### Migration fails during deployment

Check Vercel build logs for error messages. Common issues:

1. **Missing POSTGRES_URL**: Make sure environment variable is set
2. **Connection timeout**: Verify Neon database is active
3. **Permission errors**: Check database user has CREATE permissions

### Re-run migration

Migrations are safe to run multiple times. They will skip existing tables.

To force a fresh migration:
1. Drop all tables in Neon Console
2. Redeploy or run `npm run migrate`

## Database Schema

The schema creates these tables:

- `users` - User accounts
- `email_accounts` - Connected email providers
- `emails` - Synced email messages
- `email_drafts` - AI-generated drafts
- `email_rules` - Custom email rules
- `budget_usage` - API usage tracking
- `api_usage_logs` - Detailed API logs
- `notifications` - User notifications
- `email_summaries` - Category summaries
- `sessions` - JWT session management

---

**Migration runs automatically on every Vercel deployment!** ✅
