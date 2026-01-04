-- Lead Generation Tables
-- For STS and PDC lead generation across 4 channels: inbound, outbound, referrals, partnerships

-- ====================
-- STS LEAD GENERATION TABLES
-- ====================

-- STS Inbound Leads (website forms, content downloads)
CREATE TABLE sts_inbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,               -- "website", "content_download", "webinar", "demo_request"
  name TEXT,
  email TEXT,
  company TEXT,
  message TEXT,
  page_visited TEXT,
  score INTEGER,                       -- 0-100 qualification score
  qualification TEXT,                  -- "hot", "warm", "nurture", "disqualify"
  enriched_data JSONB DEFAULT '{}',    -- Company data from enrichment APIs
  status TEXT DEFAULT 'new',           -- "new", "contacted", "qualified", "converted"
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Outbound Prospects (target companies)
CREATE TABLE sts_outbound_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  company_size TEXT,                   -- "50-200", "200-1000", "1000+"
  location TEXT,
  fit_score INTEGER,                   -- ICP fit score 0-100
  contacts JSONB DEFAULT '[]',         -- Array of contact objects
  trigger_events JSONB DEFAULT '[]',   -- Array of trigger events
  outreach_status TEXT DEFAULT 'not_contacted',  -- "not_contacted", "in_progress", "responded", "dead"
  last_outreach TIMESTAMPTZ,
  next_outreach TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Trigger Events (funding, hiring, news signals)
CREATE TABLE sts_trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,          -- "funding", "hiring", "expansion", "leadership_change", "news"
  description TEXT,
  source_url TEXT,
  relevance_score INTEGER,             -- How relevant this trigger is 0-100
  actioned BOOLEAN DEFAULT false,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Referrals (client and partner referrals)
CREATE TABLE sts_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_type TEXT NOT NULL,         -- "client", "partner", "network"
  referrer_name TEXT NOT NULL,
  referrer_company TEXT,
  referred_name TEXT,
  referred_company TEXT,
  referred_email TEXT,
  status TEXT DEFAULT 'requested',     -- "requested", "received", "contacted", "converted", "lost"
  request_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  converted_date TIMESTAMPTZ,
  thank_you_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Outreach Queue (email/LinkedIn outreach queue)
CREATE TABLE sts_outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES sts_outbound_prospects(id) ON DELETE SET NULL,
  outreach_type TEXT NOT NULL,         -- "cold_email", "linkedin", "follow_up"
  channel TEXT NOT NULL,                -- "email", "linkedin", "phone"
  subject TEXT,
  body TEXT,
  personalization JSONB DEFAULT '[]',  -- Array of personalization elements
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',       -- "pending", "sent", "bounced", "responded"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- PDC LEAD GENERATION TABLES
-- ====================

-- PDC Inbound Leads (website, social DMs)
CREATE TABLE pdc_inbound_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                -- "website", "instagram", "facebook", "referral", "webinar"
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  athlete_name TEXT,
  athlete_age INTEGER,
  sport TEXT,
  school TEXT,
  message TEXT,
  score INTEGER,                        -- 0-100 qualification score
  qualification TEXT,                   -- "hot", "warm", "nurture", "disqualify"
  status TEXT DEFAULT 'new',            -- "new", "contacted", "consultation_scheduled", "converted"
  auto_response_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Outbound Prospects (schools, clubs, organizations)
CREATE TABLE pdc_outbound_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_type TEXT NOT NULL,          -- "school", "club", "academy", "organization"
  name TEXT NOT NULL,
  location TEXT,
  sport TEXT,
  size TEXT,                            -- "small" (<50), "medium" (50-200), "large" (200+)
  contacts JSONB DEFAULT '[]',          -- Array of contact objects
  fit_score INTEGER,                    -- ICP fit score 0-100
  outreach_status TEXT DEFAULT 'not_contacted',  -- "not_contacted", "in_progress", "responded", "partner"
  last_outreach TIMESTAMPTZ,
  next_outreach TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Partner Prospects (wealth managers, NIL companies)
CREATE TABLE pdc_partner_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type TEXT NOT NULL,           -- "wealth_manager", "nil_company", "financial_advisor", "trainer", "school"
  name TEXT NOT NULL,
  organization TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  client_base TEXT,                     -- Description of their client base
  alignment_score INTEGER,              -- Partnership alignment 0-100
  status TEXT DEFAULT 'identified',     -- "identified", "contacted", "discussing", "partner", "dead"
  proposed_partnership TEXT,
  last_contact TIMESTAMPTZ,
  next_step TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Referral Requests (tracking referral asks)
CREATE TABLE pdc_referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_type TEXT NOT NULL,          -- "family", "partner", "coach", "school"
  referrer_id UUID,                     -- Link to pdc_athletes or pdc_referral_partners
  referrer_name TEXT NOT NULL,
  athlete_name TEXT,                    -- The athlete they referred to us about
  ask_message TEXT,
  ask_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',        -- "pending", "referred", "converted", "declined"
  referred_leads JSONB DEFAULT '[]',    -- Array of leads that came from this request
  thank_you_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Outreach Queue (outreach to schools, parents, partners)
CREATE TABLE pdc_outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_type TEXT NOT NULL,          -- "school", "club", "partner", "parent"
  prospect_id UUID,                     -- Link to relevant prospect table
  outreach_type TEXT NOT NULL,          -- "school_outreach", "partner_outreach", "parent_followup"
  channel TEXT NOT NULL,                -- "email", "phone", "linkedin"
  subject TEXT,
  body TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',        -- "pending", "sent", "responded", "bounced"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- INDEXES
-- ====================

-- STS Indexes
CREATE INDEX idx_sts_inbound_leads_source ON sts_inbound_leads(source);
CREATE INDEX idx_sts_inbound_leads_status ON sts_inbound_leads(status);
CREATE INDEX idx_sts_inbound_leads_created ON sts_inbound_leads(created_at DESC);
CREATE INDEX idx_sts_outbound_prospects_industry ON sts_outbound_prospects(industry);
CREATE INDEX idx_sts_outbound_prospects_outreach_status ON sts_outbound_prospects(outreach_status);
CREATE INDEX idx_sts_trigger_events_company ON sts_trigger_events(company_name);
CREATE INDEX idx_sts_trigger_events_actioned ON sts_trigger_events(actioned);
CREATE INDEX idx_sts_referrals_status ON sts_referrals(status);
CREATE INDEX idx_sts_outreach_queue_scheduled ON sts_outreach_queue(scheduled_for) WHERE status = 'pending';

-- PDC Indexes
CREATE INDEX idx_pdc_inbound_leads_source ON pdc_inbound_leads(source);
CREATE INDEX idx_pdc_inbound_leads_status ON pdc_inbound_leads(status);
CREATE INDEX idx_pdc_inbound_leads_created ON pdc_inbound_leads(created_at DESC);
CREATE INDEX idx_pdc_outbound_prospects_type ON pdc_outbound_prospects(prospect_type);
CREATE INDEX idx_pdc_outbound_prospects_outreach_status ON pdc_outbound_prospects(outreach_status);
CREATE INDEX idx_pdc_partner_prospects_type ON pdc_partner_prospects(partner_type);
CREATE INDEX idx_pdc_partner_prospects_status ON pdc_partner_prospects(status);
CREATE INDEX idx_pdc_referral_requests_status ON pdc_referral_requests(status);
CREATE INDEX idx_pdc_outreach_queue_scheduled ON pdc_outreach_queue(scheduled_for) WHERE status = 'pending';

-- ====================
-- TRIGGERS
-- ====================

-- Auto-update updated_at timestamps
CREATE TRIGGER sts_outbound_prospects_updated_at
  BEFORE UPDATE ON sts_outbound_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pdc_outbound_prospects_updated_at
  BEFORE UPDATE ON pdc_outbound_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pdc_partner_prospects_updated_at
  BEFORE UPDATE ON pdc_partner_prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Get STS lead gen summary
CREATE OR REPLACE FUNCTION get_sts_leadgen_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'new_inbound_leads', (SELECT COUNT(*) FROM sts_inbound_leads WHERE created_at >= CURRENT_DATE),
    'outbound_prospects_added', (SELECT COUNT(*) FROM sts_outbound_prospects WHERE created_at >= CURRENT_DATE),
    'triggers_detected', (SELECT COUNT(*) FROM sts_trigger_events WHERE discovered_at >= CURRENT_DATE),
    'referrals_requested', (SELECT COUNT(*) FROM sts_referrals WHERE request_date >= CURRENT_DATE),
    'outreach_queue', (SELECT COUNT(*) FROM sts_outreach_queue WHERE status = 'pending')
  );
$$ LANGUAGE SQL;

-- Get PDC lead gen summary
CREATE OR REPLACE FUNCTION get_pdc_leadgen_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'new_inbound_leads', (SELECT COUNT(*) FROM pdc_inbound_leads WHERE created_at >= CURRENT_DATE),
    'schools_contacted', (SELECT COUNT(*) FROM pdc_outbound_prospects WHERE outreach_status != 'not_contacted' AND updated_at >= CURRENT_DATE),
    'partners_contacted', (SELECT COUNT(*) FROM pdc_partner_prospects WHERE status != 'identified' AND updated_at >= CURRENT_DATE),
    'referrals_requested', (SELECT COUNT(*) FROM pdc_referral_requests WHERE ask_date >= CURRENT_DATE),
    'outreach_queue', (SELECT COUNT(*) FROM pdc_outreach_queue WHERE status = 'pending')
  );
$$ LANGUAGE SQL;
