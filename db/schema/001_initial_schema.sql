-- Email Assistant Database Schema for Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Email accounts table (multi-provider support)
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', 'icloud', 'spacemail'
    email_address VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),

    -- OAuth tokens (encrypted)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- IMAP/SMTP credentials (encrypted)
    imap_host VARCHAR(255),
    imap_port INTEGER,
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    username TEXT,
    password_encrypted TEXT,

    -- Sync settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 5,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_from_date TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    connection_status VARCHAR(50) DEFAULT 'pending', -- 'connected', 'error', 'pending'
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, email_address)
);

-- Emails table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Email metadata
    message_id VARCHAR(500) UNIQUE NOT NULL,
    thread_id VARCHAR(500),
    subject TEXT,
    from_address VARCHAR(255),
    from_name VARCHAR(255),
    to_addresses JSONB, -- Array of {email, name}
    cc_addresses JSONB,
    bcc_addresses JSONB,
    reply_to VARCHAR(255),

    -- Content (encrypted)
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,

    -- Attachments
    has_attachments BOOLEAN DEFAULT false,
    attachments JSONB, -- Array of attachment metadata

    -- Dates
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,

    -- Labels/folders
    labels JSONB DEFAULT '[]'::jsonb,
    folder VARCHAR(255),

    -- AI Analysis
    priority_score INTEGER, -- 1-100
    priority_level VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
    category VARCHAR(100), -- 'customer', 'newsletter', 'personal', etc.
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative', 'urgent'
    action_items JSONB, -- Extracted action items
    summary TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_emails_user_id (user_id),
    INDEX idx_emails_account_id (email_account_id),
    INDEX idx_emails_received_at (received_at DESC),
    INDEX idx_emails_priority (priority_level, received_at DESC),
    INDEX idx_emails_category (category),
    INDEX idx_emails_thread_id (thread_id),
    INDEX idx_emails_is_read (is_read)
);

-- Email drafts table
CREATE TABLE email_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    original_email_id UUID REFERENCES emails(id) ON DELETE CASCADE,

    -- Draft content
    to_addresses JSONB NOT NULL,
    cc_addresses JSONB DEFAULT '[]'::jsonb,
    bcc_addresses JSONB DEFAULT '[]'::jsonb,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,

    -- AI generation metadata
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    ai_prompt TEXT,
    generation_tokens INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'reviewed', 'sent', 'discarded'
    is_synced BOOLEAN DEFAULT false, -- Synced to email provider
    remote_draft_id VARCHAR(500), -- ID in email provider

    -- User interaction
    user_edited BOOLEAN DEFAULT false,
    user_approved BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_drafts_user_id (user_id),
    INDEX idx_drafts_status (status),
    INDEX idx_drafts_email_id (original_email_id)
);

-- Email rules/filters
CREATE TABLE email_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority rules execute first

    -- Conditions (JSON query structure)
    conditions JSONB NOT NULL, -- {from: [...], subject: [...], hasAttachment: bool, etc.}

    -- Actions
    actions JSONB NOT NULL, -- {setPriority: 'high', setCategory: 'customer', autoReply: {...}, etc.}

    -- Stats
    times_applied INTEGER DEFAULT 0,
    last_applied_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_rules_user_id (user_id),
    INDEX idx_rules_priority (priority DESC)
);

-- Budget tracking table
CREATE TABLE budget_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Usage metrics
    api_calls_total INTEGER DEFAULT 0,
    api_calls_claude INTEGER DEFAULT 0,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,

    -- Costs (in cents)
    estimated_cost_cents INTEGER DEFAULT 0,

    -- Limits
    budget_limit_cents INTEGER DEFAULT 1000, -- $10 default
    alert_threshold_percent INTEGER DEFAULT 80, -- Alert at 80%

    -- Status
    alerts_sent INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT false,
    pause_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_budget_user_period (user_id, period_start, period_end),
    UNIQUE(user_id, period_start)
);

-- API usage logs (for detailed tracking)
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    draft_id UUID REFERENCES email_drafts(id) ON DELETE SET NULL,

    -- API details
    api_provider VARCHAR(50) NOT NULL, -- 'claude', 'gmail', 'outlook'
    operation VARCHAR(100) NOT NULL, -- 'analyze_email', 'generate_draft', 'fetch_emails'

    -- Usage
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_cents INTEGER,

    -- Performance
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_api_logs_user_id (user_id),
    INDEX idx_api_logs_created_at (created_at DESC)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL, -- 'important_email', 'budget_alert', 'sync_error'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at DESC)
);

-- Email summaries table (daily/weekly summaries)
CREATE TABLE email_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    summary_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'category'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Summary content
    category VARCHAR(100), -- For category-based summaries
    email_count INTEGER DEFAULT 0,
    summary_text TEXT,
    highlights JSONB, -- Key points, important emails
    stats JSONB, -- Email volume, response times, etc.

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_summaries_user_id (user_id),
    INDEX idx_summaries_period (period_start, period_end),
    INDEX idx_summaries_type (summary_type)
);

-- Sessions table (for JWT token management)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Device info
    user_agent TEXT,
    ip_address INET,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_expires_at (expires_at)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON email_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_rules_updated_at BEFORE UPDATE ON email_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_usage_updated_at BEFORE UPDATE ON budget_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
