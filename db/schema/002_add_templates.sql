-- Add email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- general, work, personal, sales, support
    tone VARCHAR(50) DEFAULT 'professional', -- professional, friendly, formal, casual
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_usage_count ON email_templates(usage_count DESC);

-- Add comments
COMMENT ON TABLE email_templates IS 'Email templates for quick composition';
COMMENT ON COLUMN email_templates.tone IS 'Writing tone: professional, friendly, formal, casual';
COMMENT ON COLUMN email_templates.usage_count IS 'Number of times template has been used';
