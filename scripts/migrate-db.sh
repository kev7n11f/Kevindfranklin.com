#!/bin/bash
set -e

echo "🔄 Running database migrations..."

# Check if we have the required environment variable
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ ERROR: POSTGRES_URL not set"
    exit 1
fi

# Set DATABASE_URL from POSTGRES_URL for the migration script
export DATABASE_URL="$POSTGRES_URL"

# Run the migration
node db/migrations/migrate.js

echo "✅ Database migrations completed successfully!"
