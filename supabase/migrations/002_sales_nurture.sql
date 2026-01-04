-- Sales and Nurture Agent Tables
-- For PDC athlete pipeline and STS enterprise deal pipeline

-- ====================
-- PDC SALES TABLES
-- ====================

-- PDC Athletes (replaces/extends pdc_leads)
CREATE TABLE pdc_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_name TEXT NOT NULL,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  sport TEXT,
  position TEXT,
  school TEXT,
  grade TEXT,
  status TEXT DEFAULT 'inquiry',          -- inquiry, consultation_scheduled, consultation_complete, proposal_sent, enrolled, active, completed, churned
  program_type TEXT,                      -- bridge, individual, workshop
  source TEXT,                            -- website, referral, event, social
  referral_partner_id UUID,
  consultation_date TIMESTAMPTZ,
  enrolled_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Follow-up Queue
CREATE TABLE pdc_followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES pdc_athletes(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,            -- new_inquiry, post_consultation, stalled, enrolled
  touchpoint_number INTEGER DEFAULT 1,
  channel TEXT DEFAULT 'email',           -- email, sms
  subject TEXT,
  body TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',          -- pending, sent, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Referral Partners
CREATE TABLE pdc_referral_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT,
  partner_type TEXT,                      -- wealth_manager, nil_company, coach, school
  email TEXT,
  phone TEXT,
  relationship_status TEXT DEFAULT 'new', -- new, developing, strong, dormant
  last_contact TIMESTAMPTZ,
  total_referrals INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Referrals Tracking
CREATE TABLE pdc_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES pdc_referral_partners(id),
  athlete_id UUID REFERENCES pdc_athletes(id),
  status TEXT DEFAULT 'pending',          -- pending, contacted, converted, lost
  converted_at TIMESTAMPTZ,
  thank_you_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC Events (workshops, speaking)
CREATE TABLE pdc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,               -- speaking, workshop, clinic
  organization_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  event_date DATE,
  status TEXT DEFAULT 'inquiry',          -- inquiry, scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- STS SALES TABLES
-- ====================

-- STS Deals Pipeline
CREATE TABLE sts_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES sts_companies(id),
  title TEXT NOT NULL,
  value NUMERIC,
  stage TEXT DEFAULT 'prospect',          -- prospect, qualified, proposal, negotiation, closed_won, closed_lost
  probability INTEGER DEFAULT 10,         -- 0-100
  expected_close DATE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  next_action TEXT,
  next_action_date DATE,
  notes TEXT,
  competitor_mentioned TEXT[],
  products JSONB DEFAULT '[]',            -- Array of {partner, product, price}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Follow-up Queue
CREATE TABLE sts_followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES sts_deals(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,            -- post_proposal, stalled, nurture
  touchpoint_number INTEGER DEFAULT 1,
  email_subject TEXT,
  email_body TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',          -- pending, sent, failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS Partner Updates
CREATE TABLE sts_partner_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner TEXT NOT NULL,                  -- Cisco, Dell, Oracle, Lenovo, HP
  update_type TEXT,                       -- rebate, promotion, certification, product, program
  title TEXT,
  summary TEXT,
  action_required BOOLEAN DEFAULT false,
  deadline DATE,
  impact TEXT,                            -- high, medium, low
  acknowledged BOOLEAN DEFAULT false,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- INDEXES
-- ====================

-- PDC Indexes
CREATE INDEX idx_pdc_athletes_status ON pdc_athletes(status);
CREATE INDEX idx_pdc_athletes_parent_email ON pdc_athletes(parent_email);
CREATE INDEX idx_pdc_followup_queue_scheduled ON pdc_followup_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_pdc_followup_queue_athlete ON pdc_followup_queue(athlete_id);
CREATE INDEX idx_pdc_referral_partners_type ON pdc_referral_partners(partner_type);
CREATE INDEX idx_pdc_referrals_partner ON pdc_referrals(partner_id);
CREATE INDEX idx_pdc_referrals_athlete ON pdc_referrals(athlete_id);
CREATE INDEX idx_pdc_events_date ON pdc_events(event_date);

-- STS Indexes
CREATE INDEX idx_sts_deals_stage ON sts_deals(stage);
CREATE INDEX idx_sts_deals_company ON sts_deals(company_id);
CREATE INDEX idx_sts_deals_expected_close ON sts_deals(expected_close);
CREATE INDEX idx_sts_deals_last_activity ON sts_deals(last_activity);
CREATE INDEX idx_sts_followup_queue_scheduled ON sts_followup_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_sts_followup_queue_deal ON sts_followup_queue(deal_id);
CREATE INDEX idx_sts_partner_updates_partner ON sts_partner_updates(partner);
CREATE INDEX idx_sts_partner_updates_discovered ON sts_partner_updates(discovered_at);

-- ====================
-- TRIGGERS
-- ====================

-- Auto-update updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pdc_athletes_updated_at
  BEFORE UPDATE ON pdc_athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pdc_referral_partners_updated_at
  BEFORE UPDATE ON pdc_referral_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pdc_events_updated_at
  BEFORE UPDATE ON pdc_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sts_deals_updated_at
  BEFORE UPDATE ON sts_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Get PDC enrollment pipeline summary
CREATE OR REPLACE FUNCTION get_pdc_enrollment_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_inquiries', (SELECT COUNT(*) FROM pdc_athletes),
    'consultations_scheduled', (SELECT COUNT(*) FROM pdc_athletes WHERE status = 'consultation_scheduled'),
    'active_athletes', (SELECT COUNT(*) FROM pdc_athletes WHERE status = 'active'),
    'this_month_enrollments', (SELECT COUNT(*) FROM pdc_athletes WHERE enrolled_date >= date_trunc('month', CURRENT_DATE))
  );
$$ LANGUAGE SQL;

-- Get STS pipeline summary
CREATE OR REPLACE FUNCTION get_sts_pipeline_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_deals', (SELECT COUNT(*) FROM sts_deals WHERE stage NOT IN ('closed_won', 'closed_lost')),
    'total_value', (SELECT COALESCE(SUM(value), 0) FROM sts_deals WHERE stage NOT IN ('closed_won', 'closed_lost')),
    'by_stage', (
      SELECT json_object_agg(stage, json_build_object('count', cnt, 'value', val))
      FROM (
        SELECT
          stage,
          COUNT(*) as cnt,
          COALESCE(SUM(value), 0) as val
        FROM sts_deals
        WHERE stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage
      ) sub
    )
  );
$$ LANGUAGE SQL;
