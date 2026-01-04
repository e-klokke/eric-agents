-- n8n Integration Tables
-- Created: 2026-01-03
-- Purpose: Support n8n workflows with LinkedIn automation, outreach tracking, and webhook logging

-- LinkedIn Interactions Tracking
-- Tracks all LinkedIn automation activities (profile visits, connections, messages)
CREATE TABLE IF NOT EXISTS linkedin_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL CHECK (context IN ('sts', 'pdc')),
  prospect_id UUID,
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN (
      'profile_visit',
      'connection_request',
      'connection_accepted',
      'message_sent',
      'inmail_sent',
      'response_received'
    )
  ),
  linkedin_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  sent_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  response_at TIMESTAMPTZ,
  response_type TEXT CHECK (
    response_type IS NULL OR response_type IN ('positive', 'neutral', 'negative', 'automated')
  ),
  message_content TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- n8n Webhook Logs
-- Logs all webhook requests from n8n for debugging and audit
CREATE TABLE IF NOT EXISTS n8n_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  result JSONB,
  error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Outreach Queue
-- Central queue for all outbound outreach messages
CREATE TABLE IF NOT EXISTS outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL CHECK (context IN ('sts', 'pdc')),
  channel TEXT NOT NULL CHECK (
    channel IN ('linkedin_connection', 'linkedin_message', 'linkedin_inmail', 'email', 'instagram', 'facebook')
  ),
  prospect_id UUID,
  prospect_name TEXT NOT NULL,
  prospect_linkedin_url TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'queued' CHECK (
    status IN ('queued', 'sent', 'responded', 'failed', 'cancelled')
  ),
  sent_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  response_text TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily LinkedIn Activity Limits
-- Tracks daily counts to enforce LinkedIn safety limits
CREATE TABLE IF NOT EXISTS linkedin_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL CHECK (context IN ('sts', 'pdc')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_type TEXT NOT NULL CHECK (
    action_type IN ('profile_visit', 'connection_request', 'message', 'inmail')
  ),
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(context, date, action_type)
);

-- Partner Prospects (for PDC workflows)
CREATE TABLE IF NOT EXISTS pdc_partner_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT CHECK (
    partner_type IN ('wealth_manager', 'nil_company', 'school', 'athletic_director', 'other')
  ),
  name TEXT NOT NULL,
  organization TEXT,
  title TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  alignment_score INTEGER CHECK (alignment_score >= 0 AND alignment_score <= 10),
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 10),
  status TEXT DEFAULT 'identified' CHECK (
    status IN (
      'identified',
      'warming',
      'contacted',
      'connected',
      'meeting_scheduled',
      'partnership_proposed',
      'active_partner',
      'dormant',
      'not_interested'
    )
  ),
  last_visited TIMESTAMPTZ,
  last_contacted TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Outbound Prospects (for STS workflows)
CREATE TABLE IF NOT EXISTS sts_outbound_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_title TEXT,
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 10),
  outreach_status TEXT DEFAULT 'not_contacted' CHECK (
    outreach_status IN (
      'not_contacted',
      'warming',
      'connection_sent',
      'connected',
      'inmail_sent',
      'responded',
      'meeting_scheduled',
      'qualified',
      'not_interested'
    )
  ),
  last_visited TIMESTAMPTZ,
  last_contacted TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  trigger_events JSONB,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound Leads (both STS and PDC)
CREATE TABLE IF NOT EXISTS inbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL CHECK (context IN ('sts', 'pdc')),
  source TEXT CHECK (
    source IN ('website', 'instagram', 'facebook', 'linkedin', 'referral', 'other')
  ),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  message TEXT,
  lead_score INTEGER CHECK (lead_score >= 0 AND lead_score <= 10),
  status TEXT DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'qualified', 'consultation_scheduled', 'converted', 'not_interested')
  ),
  contacted_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_linkedin_interactions_context ON linkedin_interactions(context);
CREATE INDEX IF NOT EXISTS idx_linkedin_interactions_type ON linkedin_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_linkedin_interactions_created ON linkedin_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received ON n8n_webhook_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON n8n_webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_status ON outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_scheduled ON outreach_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_context ON outreach_queue(context);
CREATE INDEX IF NOT EXISTS idx_linkedin_limits_date ON linkedin_daily_limits(context, date, action_type);
CREATE INDEX IF NOT EXISTS idx_pdc_partners_status ON pdc_partner_prospects(status);
CREATE INDEX IF NOT EXISTS idx_pdc_partners_score ON pdc_partner_prospects(alignment_score DESC);
CREATE INDEX IF NOT EXISTS idx_sts_prospects_status ON sts_outbound_prospects(outreach_status);
CREATE INDEX IF NOT EXISTS idx_sts_prospects_score ON sts_outbound_prospects(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_inbound_leads_context ON inbound_leads(context);
CREATE INDEX IF NOT EXISTS idx_inbound_leads_status ON inbound_leads(status);
CREATE INDEX IF NOT EXISTS idx_inbound_leads_created ON inbound_leads(created_at DESC);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS linkedin_interactions_updated_at ON linkedin_interactions;
CREATE TRIGGER linkedin_interactions_updated_at
  BEFORE UPDATE ON linkedin_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS outreach_queue_updated_at ON outreach_queue;
CREATE TRIGGER outreach_queue_updated_at
  BEFORE UPDATE ON outreach_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS linkedin_daily_limits_updated_at ON linkedin_daily_limits;
CREATE TRIGGER linkedin_daily_limits_updated_at
  BEFORE UPDATE ON linkedin_daily_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS pdc_partner_prospects_updated_at ON pdc_partner_prospects;
CREATE TRIGGER pdc_partner_prospects_updated_at
  BEFORE UPDATE ON pdc_partner_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sts_outbound_prospects_updated_at ON sts_outbound_prospects;
CREATE TRIGGER sts_outbound_prospects_updated_at
  BEFORE UPDATE ON sts_outbound_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS inbound_leads_updated_at ON inbound_leads;
CREATE TRIGGER inbound_leads_updated_at
  BEFORE UPDATE ON inbound_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to increment LinkedIn daily limit count
CREATE OR REPLACE FUNCTION increment_limit(
  p_context TEXT,
  p_date DATE,
  p_action_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO linkedin_daily_limits (context, date, action_type, count)
  VALUES (p_context, p_date, p_action_type, 1)
  ON CONFLICT (context, date, action_type)
  DO UPDATE SET count = linkedin_daily_limits.count + 1;
END;
$$ LANGUAGE plpgsql;
