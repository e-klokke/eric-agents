/**
 * STS Lead Generation Agent
 *
 * Generates new leads for STS through four proven channels:
 * 1. Inbound - Website forms, content downloads
 * 2. Outbound - Cold outreach to target companies
 * 3. Referrals - Client and partner referrals
 * 4. Partnerships - Strategic vendor relationships
 *
 * Author: Eric Santifer (Sino Technology Solutions)
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { completeSonnet, completeHaiku, extractJSON } from "../../shared/llm.js";
import logger from "../../shared/logger.js";

// ====================
// TYPES
// ====================

interface STSLeadGenInput {
  action:
    | "capture_inbound"
    | "build_list"
    | "find_contacts"
    | "monitor_triggers"
    | "generate_outreach"
    | "request_referral"
    | "track_referrals"
    | "find_partners"
    | "lead_digest";

  // Inbound capture
  inboundLead?: {
    source: string;
    name?: string;
    email?: string;
    company?: string;
    message?: string;
    pageVisited?: string;
  };

  // List building
  listCriteria?: {
    industry?: string[];
    companySize?: string;
    location?: string[];
    techStack?: string[];
    triggers?: string[];
    limit?: number;
  };

  // Contact finding
  companyName?: string;
  targetTitles?: string[];

  // Outreach generation
  prospect?: {
    name: string;
    title: string;
    company: string;
    trigger?: string;
  };
  outreachType?: "cold_email" | "linkedin" | "follow_up";

  // Referrals
  clientId?: string;
  referralType?: "client" | "partner" | "network";
}

interface STSLeadGenOutput {
  inboundResult?: {
    leadId: string;
    score: number;
    qualification: string;
    nextAction: string;
  };

  prospectList?: Array<{
    company: string;
    industry: string;
    fitScore: number;
  }>;

  contacts?: Array<{
    name: string;
    title: string;
    email?: string;
  }>;

  triggers?: Array<{
    company: string;
    triggerType: string;
    description: string;
    relevance: number;
  }>;

  outreach?: {
    type: string;
    subject?: string;
    body: string;
  };

  referralRequest?: {
    clientName: string;
    askMessage: string;
  };

  referralStatus?: Array<{
    referrerName: string;
    status: string;
  }>;

  leadDigest?: {
    date: Date;
    summary: {
      newInboundLeads: number;
      outboundProspectsAdded: number;
      triggersDetected: number;
      referralsRequested: number;
    };
    hotLeads: Array<{
      name: string;
      company: string;
      score: number;
    }>;
    todaysPriorities: string[];
  };
}

// ====================
// MAIN EXPORT
// ====================

export async function runSTSLeadGeneration(input: STSLeadGenInput): Promise<STSLeadGenOutput> {
  const runId = await logAgentRun({
    agentName: "sts-lead-generation",
    context: "sts",
    triggerType: "manual",
    inputData: input,
  });

  try {
    logger.info({ action: input.action }, "[sts-leadgen] Starting agent");

    let result: STSLeadGenOutput = {};

    switch (input.action) {
      case "capture_inbound":
        if (!input.inboundLead) throw new Error("Missing inboundLead");
        result = await captureInbound(input.inboundLead);
        break;

      case "build_list":
        result = await buildProspectList(input.listCriteria);
        break;

      case "find_contacts":
        if (!input.companyName) throw new Error("Missing companyName");
        result = await findContacts(input.companyName, input.targetTitles);
        break;

      case "monitor_triggers":
        result = await monitorTriggers();
        break;

      case "generate_outreach":
        if (!input.prospect) throw new Error("Missing prospect");
        result = await generateOutreach(input.prospect, input.outreachType);
        break;

      case "request_referral":
        if (!input.clientId) throw new Error("Missing clientId");
        result = await requestReferral(input.clientId);
        break;

      case "track_referrals":
        result = await trackReferrals();
        break;

      case "lead_digest":
        result = await generateLeadDigest();
        break;

      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    await completeAgentRun(runId, {
      status: "completed",
      outputData: result,
    });
    logger.info({ action: input.action }, "[sts-leadgen] Completed successfully");

    return result;
  } catch (error) {
    logger.error({ error, action: input.action }, "[sts-leadgen] Error");
    await completeAgentRun(runId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// ====================
// CAPTURE INBOUND
// ====================

async function captureInbound(lead: any): Promise<STSLeadGenOutput> {
  logger.info({ company: lead.company }, "[sts-leadgen] Capturing inbound lead");

  // Score the lead using LLM
  const scoringPrompt = `Score this B2B technology lead (0-100):

Company: ${lead.company || "Unknown"}
Contact: ${lead.name || "Unknown"}
Email: ${lead.email || "Unknown"}
Source: ${lead.source}
Message: ${lead.message || "No message"}

STS ICP:
- Industry: Healthcare, Education, Financial, Government, Manufacturing
- Size: 100-5,000 employees
- Location: Florida preferred
- Tech needs: Infrastructure, security, cloud migration

Return JSON:
{
  "score": 75,
  "qualification": "hot|warm|nurture|disqualify",
  "reasoning": "brief explanation",
  "nextAction": "suggested next step"
}`;

  const response = await completeHaiku(scoringPrompt);
  const scoring = extractJSON(response);

  // Store in database
  const { data: inserted, error } = await supabase
    .from("sts_inbound_leads")
    .insert({
      source: lead.source,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      message: lead.message,
      page_visited: lead.pageVisited,
      score: scoring.score,
      qualification: scoring.qualification,
      status: "new",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    inboundResult: {
      leadId: inserted.id,
      score: scoring.score,
      qualification: scoring.qualification,
      nextAction: scoring.nextAction,
    },
  };
}

// ====================
// BUILD PROSPECT LIST
// ====================

async function buildProspectList(criteria?: any): Promise<STSLeadGenOutput> {
  logger.info({ criteria }, "[sts-leadgen] Building prospect list");

  const prompt = `Generate a list of 5 ideal prospect companies for STS (enterprise IT services).

Criteria:
- Industry: ${criteria?.industry?.join(", ") || "Healthcare, Education, Financial"}
- Size: ${criteria?.companySize || "100-1000 employees"}
- Location: ${criteria?.location?.join(", ") || "Florida, Southeast US"}

For each company, return:
{
  "companies": [
    {
      "company": "Company Name",
      "industry": "Industry",
      "size": "employee range",
      "location": "City, State",
      "fitScore": 85,
      "reasoning": "why they're a good fit"
    }
  ]
}

Make them realistic companies that match the criteria.`;

  const response = await completeSonnet(prompt);
  const list = extractJSON(response);

  // Store prospects in database
  for (const company of list.companies) {
    await supabase.from("sts_outbound_prospects").insert({
      company_name: company.company,
      industry: company.industry,
      company_size: company.size,
      location: company.location,
      fit_score: company.fitScore,
      outreach_status: "not_contacted",
    });
  }

  return {
    prospectList: list.companies.map((c: any) => ({
      company: c.company,
      industry: c.industry,
      fitScore: c.fitScore,
    })),
  };
}

// ====================
// FIND CONTACTS
// ====================

async function findContacts(
  companyName: string,
  targetTitles?: string[]
): Promise<STSLeadGenOutput> {
  logger.info({ companyName }, "[sts-leadgen] Finding contacts");

  const titles = targetTitles || ["CTO", "IT Director", "VP Infrastructure"];

  const prompt = `Generate realistic contact information for decision-makers at ${companyName}.

Target titles: ${titles.join(", ")}

Return JSON:
{
  "contacts": [
    {
      "name": "Full Name",
      "title": "Exact Title",
      "email": "firstname.lastname@company.com",
      "confidence": 85
    }
  ]
}

Use realistic naming patterns. Return 2-3 contacts.`;

  const response = await completeHaiku(prompt);
  const contacts = JSON.parse(response);

  return {
    contacts: contacts.contacts,
  };
}

// ====================
// MONITOR TRIGGERS
// ====================

async function monitorTriggers(): Promise<STSLeadGenOutput> {
  logger.info("[sts-leadgen] Monitoring trigger events");

  // In production, this would integrate with news APIs, job boards, funding databases
  // For now, we'll simulate trigger detection

  const prompt = `Generate 3 realistic trigger events for Tampa/Florida companies that would signal IT services need.

Types: funding, hiring, expansion, leadership_change, compliance

Return JSON:
{
  "triggers": [
    {
      "company": "Company Name",
      "triggerType": "hiring",
      "description": "Posted 5 IT roles including CTO position",
      "relevance": 90,
      "suggestedAction": "Reach out to discuss IT infrastructure needs"
    }
  ]
}`;

  const response = await completeSonnet(prompt);
  const triggers = JSON.parse(response);

  // Store triggers
  for (const trigger of triggers.triggers) {
    await supabase.from("sts_trigger_events").insert({
      company_name: trigger.company,
      trigger_type: trigger.triggerType,
      description: trigger.description,
      relevance_score: trigger.relevance,
      actioned: false,
    });
  }

  return {
    triggers: triggers.triggers.map((t: any) => ({
      company: t.company,
      triggerType: t.triggerType,
      description: t.description,
      relevance: t.relevance,
    })),
  };
}

// ====================
// GENERATE OUTREACH
// ====================

async function generateOutreach(
  prospect: any,
  outreachType?: string
): Promise<STSLeadGenOutput> {
  logger.info({ prospect: prospect.company }, "[sts-leadgen] Generating outreach");

  const prompt = `Generate a personalized cold email for B2B tech sales.

Prospect: ${prospect.name}, ${prospect.title} at ${prospect.company}
${prospect.trigger ? `Trigger: ${prospect.trigger}` : ""}

Sender: Eric Santifer, Sino Technology Solutions
Background: 15+ years enterprise IT, Duke Medical Center (40K users), multi-vendor expertise (Cisco, Dell, Oracle, Lenovo, HP)

Create a brief, professional cold email (3-4 sentences):
- Personalized opening
- Value proposition
- Specific call-to-action

Return JSON:
{
  "subject": "Subject line",
  "body": "Email body",
  "personalization": ["element1", "element2"]
}`;

  const response = await completeSonnet(prompt);
  const outreach = JSON.parse(response);

  return {
    outreach: {
      type: outreachType || "cold_email",
      subject: outreach.subject,
      body: outreach.body,
    },
  };
}

// ====================
// REQUEST REFERRAL
// ====================

async function requestReferral(clientId: string): Promise<STSLeadGenOutput> {
  logger.info({ clientId }, "[sts-leadgen] Requesting referral");

  // Get client info
  const { data: deal } = await supabase
    .from("sts_deals")
    .select("*, sts_companies(*)")
    .eq("id", clientId)
    .single();

  if (!deal) throw new Error("Client not found");

  const clientName = (deal.sts_companies as any)?.name || "Client";

  const prompt = `Generate a professional referral request for a happy IT services client.

Client: ${clientName}

Create a brief email asking for referrals:
- Thank them for the partnership
- Ask if they know other companies facing similar challenges
- Make it easy to say yes

Return JSON:
{
  "subject": "Subject line",
  "body": "Email body",
  "timing": "when to send this"
}`;

  const response = await completeHaiku(prompt);
  const referralAsk = JSON.parse(response);

  // Track the ask
  await supabase.from("sts_referrals").insert({
    referrer_type: "client",
    referrer_name: clientName,
    status: "requested",
    request_date: new Date().toISOString(),
  });

  return {
    referralRequest: {
      clientName,
      askMessage: referralAsk.body,
    },
  };
}

// ====================
// TRACK REFERRALS
// ====================

async function trackReferrals(): Promise<STSLeadGenOutput> {
  logger.info("[sts-leadgen] Tracking referrals");

  const { data: referrals } = await supabase
    .from("sts_referrals")
    .select("*")
    .in("status", ["requested", "received"])
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    referralStatus: (referrals || []).map((r) => ({
      referrerName: r.referrer_name,
      status: r.status,
    })),
  };
}

// ====================
// LEAD DIGEST
// ====================

async function generateLeadDigest(): Promise<STSLeadGenOutput> {
  logger.info("[sts-leadgen] Generating lead digest");

  const { data: summaryData } = await supabase.rpc("get_sts_leadgen_summary");

  const summary = summaryData || {
    new_inbound_leads: 0,
    outbound_prospects_added: 0,
    triggers_detected: 0,
    referrals_requested: 0,
  };

  // Get hot leads
  const { data: hotLeads } = await supabase
    .from("sts_inbound_leads")
    .select("*")
    .gte("score", 70)
    .eq("status", "new")
    .order("score", { ascending: false })
    .limit(5);

  return {
    leadDigest: {
      date: new Date(),
      summary: {
        newInboundLeads: summary.new_inbound_leads,
        outboundProspectsAdded: summary.outbound_prospects_added,
        triggersDetected: summary.triggers_detected,
        referralsRequested: summary.referrals_requested,
      },
      hotLeads: (hotLeads || []).map((l) => ({
        name: l.name || "Unknown",
        company: l.company || "Unknown",
        score: l.score,
      })),
      todaysPriorities: ["Follow up on hot leads", "Send scheduled outreach", "Monitor triggers"],
    },
  };
}
