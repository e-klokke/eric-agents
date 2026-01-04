/**
 * Database Type Definitions
 *
 * TypeScript interfaces matching the Supabase schema
 * Auto-generated from migrations: 001_schema.sql, 002_sales_nurture.sql, 003_leadgen_tables.sql
 */

// ====================
// CORE TABLES (001_schema.sql)
// ====================

export interface AgentRun {
  id: string;
  agent_name: string;
  context: "personal" | "pdc" | "sts" | "shared";
  trigger_type: "manual" | "scheduled" | "event" | "webhook";
  status: "running" | "completed" | "failed";
  input_data?: any;
  output_data?: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface Memory {
  id: string;
  context: "personal" | "pdc" | "sts" | "shared";
  category: "knowledge" | "entity" | "conversation" | "decision";
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  source?: string;
  created_at: string;
}

export interface PDCLead {
  id: string;
  lead_type: "athlete" | "collaboration" | "market";
  name: string;
  organization?: string;
  contact_info?: Record<string, any>;
  research_data?: Record<string, any>;
  score?: number;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  created_at: string;
  updated_at: string;
}

export interface STSCompany {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  contact_name?: string;
  contact_title?: string;
  research_data?: Record<string, any>;
  score?: number;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  created_at: string;
  updated_at: string;
}

export interface ContentLibraryItem {
  id: string;
  context: "pdc" | "sts";
  content_type: "video" | "article" | "podcast" | "notes" | "quote";
  title?: string;
  content?: string;
  key_quotes: string[];
  themes: string[];
  source_url?: string;
  status: "draft" | "processed" | "archived";
  created_at: string;
}

export interface SocialPost {
  id: string;
  context: "pdc" | "sts";
  content_id?: string;
  platform: "instagram" | "linkedin" | "x" | "facebook" | "youtube";
  post_type?: "single" | "carousel" | "thread" | "reel_caption" | "story";
  post_text: string;
  hashtags: string[];
  media_urls: string[];
  scheduled_for?: string;
  published_at?: string;
  platform_post_id?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  engagement_metrics: Record<string, any>;
  created_at: string;
}

// ====================
// PDC SALES TABLES (002_sales_nurture.sql)
// ====================

export interface PDCAthlete {
  id: string;
  athlete_name: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  sport?: string;
  position?: string;
  school?: string;
  grade?: string;
  status: "inquiry" | "consultation_scheduled" | "consultation_complete" | "proposal_sent" | "enrolled" | "active" | "completed" | "churned";
  program_type?: "bridge" | "individual" | "workshop";
  source?: string;
  referral_partner_id?: string;
  consultation_date?: string;
  enrolled_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PDCFollowupQueue {
  id: string;
  athlete_id: string;
  sequence_type: "new_inquiry" | "post_consultation" | "stalled" | "enrolled";
  touchpoint_number: number;
  channel: "email" | "sms";
  subject?: string;
  body?: string;
  scheduled_for?: string;
  sent_at?: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

export interface PDCReferralPartner {
  id: string;
  name: string;
  organization?: string;
  partner_type?: "wealth_manager" | "nil_company" | "coach" | "school";
  email?: string;
  phone?: string;
  relationship_status: "new" | "developing" | "strong" | "dormant";
  last_contact?: string;
  total_referrals: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PDCReferral {
  id: string;
  partner_id?: string;
  athlete_id?: string;
  status: "pending" | "contacted" | "converted" | "lost";
  converted_at?: string;
  thank_you_sent: boolean;
  created_at: string;
}

export interface PDCEvent {
  id: string;
  event_type: "speaking" | "workshop" | "clinic";
  organization_name?: string;
  contact_name?: string;
  contact_email?: string;
  event_date?: string;
  status: "inquiry" | "scheduled" | "completed" | "cancelled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ====================
// STS SALES TABLES (002_sales_nurture.sql)
// ====================

export interface STSDeal {
  id: string;
  company_id?: string;
  title: string;
  value?: number;
  stage: "prospect" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  expected_close?: string;
  last_activity: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  competitor_mentioned?: string[];
  products: Array<{ partner: string; product: string; price: number }>;
  created_at: string;
  updated_at: string;
}

export interface STSFollowupQueue {
  id: string;
  deal_id: string;
  sequence_type: "post_proposal" | "stalled" | "nurture";
  touchpoint_number: number;
  email_subject?: string;
  email_body?: string;
  scheduled_for?: string;
  sent_at?: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

export interface STSPartnerUpdate {
  id: string;
  partner: "Cisco" | "Dell" | "Oracle" | "Lenovo" | "HP";
  update_type?: "rebate" | "promotion" | "certification" | "product" | "program";
  title?: string;
  summary?: string;
  action_required: boolean;
  deadline?: string;
  impact?: "high" | "medium" | "low";
  acknowledged: boolean;
  discovered_at: string;
}

// ====================
// STS LEAD GEN TABLES (003_leadgen_tables.sql)
// ====================

export interface STSInboundLead {
  id: string;
  source: string;
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  page_visited?: string;
  score?: number;
  qualification?: "hot" | "warm" | "nurture" | "disqualify";
  enriched_data: Record<string, any>;
  status: "new" | "contacted" | "qualified" | "converted";
  assigned_to?: string;
  created_at: string;
}

export interface STSOutboundProspect {
  id: string;
  company_name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  fit_score?: number;
  contacts: Array<{ name: string; title: string; email?: string }>;
  trigger_events: Array<{ type: string; description: string; date: string }>;
  outreach_status: "not_contacted" | "in_progress" | "responded" | "dead";
  last_outreach?: string;
  next_outreach?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface STSTriggerEvent {
  id: string;
  company_name: string;
  trigger_type: "funding" | "hiring" | "expansion" | "leadership_change" | "news";
  description?: string;
  source_url?: string;
  relevance_score?: number;
  actioned: boolean;
  discovered_at: string;
}

export interface STSReferral {
  id: string;
  referrer_type: "client" | "partner" | "network";
  referrer_name: string;
  referrer_company?: string;
  referred_name?: string;
  referred_company?: string;
  referred_email?: string;
  status: "requested" | "received" | "contacted" | "converted" | "lost";
  request_date?: string;
  received_date?: string;
  converted_date?: string;
  thank_you_sent: boolean;
  notes?: string;
  created_at: string;
}

export interface STSOutreachQueue {
  id: string;
  prospect_id?: string;
  outreach_type: "cold_email" | "linkedin" | "follow_up";
  channel: "email" | "linkedin" | "phone";
  subject?: string;
  body?: string;
  personalization: string[];
  scheduled_for?: string;
  sent_at?: string;
  response_received: boolean;
  status: "pending" | "sent" | "bounced" | "responded";
  created_at: string;
}

// ====================
// PDC LEAD GEN TABLES (003_leadgen_tables.sql)
// ====================

export interface PDCInboundLead {
  id: string;
  source: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  athlete_name?: string;
  athlete_age?: number;
  sport?: string;
  school?: string;
  message?: string;
  score?: number;
  qualification?: "hot" | "warm" | "nurture" | "disqualify";
  status: "new" | "contacted" | "consultation_scheduled" | "converted";
  auto_response_sent: boolean;
  created_at: string;
}

export interface PDCOutboundProspect {
  id: string;
  prospect_type: "school" | "club" | "academy" | "organization";
  name: string;
  location?: string;
  sport?: string;
  size?: "small" | "medium" | "large";
  contacts: Array<{ name: string; role: string; email?: string }>;
  fit_score?: number;
  outreach_status: "not_contacted" | "in_progress" | "responded" | "partner";
  last_outreach?: string;
  next_outreach?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PDCPartnerProspect {
  id: string;
  partner_type: "wealth_manager" | "nil_company" | "financial_advisor" | "trainer" | "school";
  name: string;
  organization?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  client_base?: string;
  alignment_score?: number;
  status: "identified" | "contacted" | "discussing" | "partner" | "dead";
  proposed_partnership?: string;
  last_contact?: string;
  next_step?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PDCReferralRequest {
  id: string;
  referrer_type: "family" | "partner" | "coach" | "school";
  referrer_id?: string;
  referrer_name: string;
  athlete_name?: string;
  ask_message?: string;
  ask_date?: string;
  status: "pending" | "referred" | "converted" | "declined";
  referred_leads: Array<{ name: string; email: string; date: string }>;
  thank_you_sent: boolean;
  created_at: string;
}

export interface PDCOutreachQueue {
  id: string;
  prospect_type: "school" | "club" | "partner" | "parent";
  prospect_id?: string;
  outreach_type: "school_outreach" | "partner_outreach" | "parent_followup";
  channel: "email" | "phone" | "linkedin";
  subject?: string;
  body?: string;
  scheduled_for?: string;
  sent_at?: string;
  response_received: boolean;
  status: "pending" | "sent" | "responded" | "bounced";
  created_at: string;
}

// ====================
// DATABASE SCHEMA TYPE
// ====================

export interface Database {
  // Core tables
  agent_runs: AgentRun;
  memories: Memory;
  pdc_leads: PDCLead;
  sts_companies: STSCompany;
  content_library: ContentLibraryItem;
  social_queue: SocialPost;

  // PDC Sales tables
  pdc_athletes: PDCAthlete;
  pdc_followup_queue: PDCFollowupQueue;
  pdc_referral_partners: PDCReferralPartner;
  pdc_referrals: PDCReferral;
  pdc_events: PDCEvent;

  // STS Sales tables
  sts_deals: STSDeal;
  sts_followup_queue: STSFollowupQueue;
  sts_partner_updates: STSPartnerUpdate;

  // STS Lead Gen tables
  sts_inbound_leads: STSInboundLead;
  sts_outbound_prospects: STSOutboundProspect;
  sts_trigger_events: STSTriggerEvent;
  sts_referrals: STSReferral;
  sts_outreach_queue: STSOutreachQueue;

  // PDC Lead Gen tables
  pdc_inbound_leads: PDCInboundLead;
  pdc_outbound_prospects: PDCOutboundProspect;
  pdc_partner_prospects: PDCPartnerProspect;
  pdc_referral_requests: PDCReferralRequest;
  pdc_outreach_queue: PDCOutreachQueue;
}

// ====================
// HELPER TYPES
// ====================

// Table names as union type
export type TableName = keyof Database;

// Generic row type for any table
export type Row<T extends TableName> = Database[T];

// Insert type (without auto-generated fields like id, created_at, updated_at)
export type Insert<T extends TableName> = Partial<Database[T]> &
  Omit<Database[T], "id" | "created_at" | "updated_at">;

// Update type (all fields optional)
export type Update<T extends TableName> = Partial<Database[T]>;

// ====================
// RPC FUNCTION RETURN TYPES
// ====================

export interface STSLeadGenSummary {
  new_inbound_leads: number;
  outbound_prospects_added: number;
  triggers_detected: number;
  referrals_requested: number;
  outreach_queue: number;
}

export interface PDCLeadGenSummary {
  new_inbound_leads: number;
  schools_contacted: number;
  partners_contacted: number;
  referrals_requested: number;
  outreach_queue: number;
}

export interface STSPipelineSummary {
  total_deals: number;
  total_value: number;
  by_stage: Record<
    string,
    {
      count: number;
      value: number;
    }
  >;
}

export interface PDCEnrollmentSummary {
  total_inquiries: number;
  consultations_scheduled: number;
  active_athletes: number;
  this_month_enrollments: number;
}
