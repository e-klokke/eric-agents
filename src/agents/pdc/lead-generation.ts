/**
 * PDC Lead Generation Agent
 *
 * Generates new leads for PDC through four proven channels:
 * 1. Inbound - Website, social DMs, webinars
 * 2. Outbound - School/club outreach
 * 3. Referrals - Family and partner referrals
 * 4. Partnerships - Wealth managers, NIL companies
 *
 * Author: Eric Santifer (Players Development Club)
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { completeSonnet, completeHaiku } from "../../shared/llm.js";
import logger from "../../shared/logger.js";

// ====================
// TYPES
// ====================

interface PDCLeadGenInput {
  action:
    | "capture_inbound"
    | "build_list"
    | "find_contacts"
    | "generate_outreach"
    | "request_referral"
    | "track_referrals"
    | "find_partners"
    | "partner_outreach"
    | "lead_digest";

  // Inbound capture
  inboundLead?: {
    source: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    athleteName?: string;
    athleteAge?: number;
    sport?: string;
    school?: string;
    message?: string;
  };

  // List building
  listCriteria?: {
    targetType: "schools" | "clubs" | "organizations" | "partners";
    location?: string[];
    sport?: string[];
    level?: string[];
    size?: string;
    limit?: number;
  };

  // Contact finding
  organizationName?: string;
  targetRoles?: string[];

  // Outreach generation
  prospect?: {
    name: string;
    role: string;
    organization: string;
    sport?: string;
  };
  outreachType?: "school" | "club" | "partner" | "parent";

  // Referrals
  clientId?: string;
  referralType?: "family" | "partner" | "coach";

  // Partnerships
  partnerType?: "wealth_manager" | "nil_company" | "financial_advisor" | "school" | "trainer";
  partnerName?: string;
}

interface PDCLeadGenOutput {
  inboundResult?: {
    leadId: string;
    score: number;
    qualification: string;
    nextAction: string;
  };

  prospectList?: Array<{
    name: string;
    type: string;
    location: string;
    fitScore: number;
  }>;

  contacts?: Array<{
    name: string;
    role: string;
    email?: string;
  }>;

  outreach?: {
    type: string;
    subject?: string;
    body: string;
  };

  referralRequest?: {
    familyName: string;
    askMessage: string;
  };

  referralStatus?: Array<{
    referrerName: string;
    status: string;
  }>;

  partnerOpportunities?: Array<{
    partnerName: string;
    partnerType: string;
    alignmentScore: number;
  }>;

  partnerOutreach?: {
    partnerName: string;
    subject: string;
    body: string;
  };

  leadDigest?: {
    date: Date;
    summary: {
      newInboundLeads: number;
      schoolsContacted: number;
      partnersContacted: number;
      referralsRequested: number;
    };
    hotLeads: Array<{
      athleteName: string;
      sport: string;
      score: number;
    }>;
    todaysPriorities: string[];
  };
}

// ====================
// MAIN EXPORT
// ====================

export async function runPDCLeadGeneration(input: PDCLeadGenInput): Promise<PDCLeadGenOutput> {
  const runId = await logAgentRun({
    agentName: "pdc-lead-generation",
    context: "pdc",
    triggerType: "manual",
    inputData: input,
  });

  try {
    logger.info({ action: input.action }, "[pdc-leadgen] Starting agent");

    let result: PDCLeadGenOutput = {};

    switch (input.action) {
      case "capture_inbound":
        if (!input.inboundLead) throw new Error("Missing inboundLead");
        result = await captureInbound(input.inboundLead);
        break;

      case "build_list":
        if (!input.listCriteria) throw new Error("Missing listCriteria");
        result = await buildProspectList(input.listCriteria);
        break;

      case "find_contacts":
        if (!input.organizationName) throw new Error("Missing organizationName");
        result = await findContacts(input.organizationName, input.targetRoles);
        break;

      case "generate_outreach":
        if (!input.prospect) throw new Error("Missing prospect");
        result = await generateOutreach(input.prospect, input.outreachType);
        break;

      case "request_referral":
        if (!input.clientId) throw new Error("Missing clientId");
        result = await requestReferral(input.clientId, input.referralType);
        break;

      case "track_referrals":
        result = await trackReferrals();
        break;

      case "find_partners":
        result = await findPartners(input.partnerType);
        break;

      case "partner_outreach":
        if (!input.partnerType || !input.partnerName) {
          throw new Error("Missing partnerType or partnerName");
        }
        result = await generatePartnerOutreach(input.partnerType, input.partnerName);
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
    logger.info({ action: input.action }, "[pdc-leadgen] Completed successfully");

    return result;
  } catch (error) {
    logger.error({ error, action: input.action }, "[pdc-leadgen] Error");
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

async function captureInbound(lead: any): Promise<PDCLeadGenOutput> {
  logger.info({ athleteName: lead.athleteName }, "[pdc-leadgen] Capturing inbound lead");

  // Score the lead using LLM
  const scoringPrompt = `Score this athlete/family lead (0-100):

Parent: ${lead.parentName || "Unknown"}
Athlete: ${lead.athleteName || "Unknown"}
Age: ${lead.athleteAge || "Unknown"}
Sport: ${lead.sport || "Unknown"}
School: ${lead.school || "Unknown"}
Source: ${lead.source}
Message: ${lead.message || "No message"}

PDC ICP:
- Age: 14-22 (high school junior/senior, college freshmen)
- Sports: Basketball primary, all sports welcome
- Location: Tampa Bay preferred, Florida, Southeast, national (remote)
- Indicators: Transition period, struggling with mental game, parent engaged

Return JSON:
{
  "score": 75,
  "qualification": "hot|warm|nurture|disqualify",
  "reasoning": "brief explanation",
  "nextAction": "suggested next step"
}`;

  const response = await completeHaiku(scoringPrompt);
  const scoring = JSON.parse(response);

  // Store in database
  const { data: inserted, error } = await supabase
    .from("pdc_inbound_leads")
    .insert({
      source: lead.source,
      parent_name: lead.parentName,
      parent_email: lead.parentEmail,
      parent_phone: lead.parentPhone,
      athlete_name: lead.athleteName,
      athlete_age: lead.athleteAge,
      sport: lead.sport,
      school: lead.school,
      message: lead.message,
      score: scoring.score,
      qualification: scoring.qualification,
      status: "new",
      auto_response_sent: false,
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

async function buildProspectList(criteria: any): Promise<PDCLeadGenOutput> {
  logger.info({ criteria }, "[pdc-leadgen] Building prospect list");

  const prompt = `Generate a list of 5 realistic ${criteria.targetType} in Florida for athlete development outreach.

Criteria:
- Type: ${criteria.targetType}
- Location: ${criteria.location?.join(", ") || "Tampa Bay, Florida"}
- Sport: ${criteria.sport?.join(", ") || "Basketball, Multi-sport"}
- Level: ${criteria.level?.join(", ") || "High school"}

For each prospect, return:
{
  "${criteria.targetType}": [
    {
      "name": "Organization Name",
      "type": "${criteria.targetType}",
      "location": "City, FL",
      "sport": "Sport focus",
      "size": "Small/Medium/Large",
      "fitScore": 85,
      "contactRole": "Athletic Director/Coach/Program Director"
    }
  ]
}

Make them realistic organizations.`;

  const response = await completeSonnet(prompt);
  const list = JSON.parse(response);
  const prospects = list[criteria.targetType] || [];

  // Store prospects in database
  for (const prospect of prospects) {
    await supabase.from("pdc_outbound_prospects").insert({
      prospect_type: criteria.targetType,
      name: prospect.name,
      location: prospect.location,
      sport: prospect.sport,
      size: prospect.size,
      fit_score: prospect.fitScore,
      outreach_status: "not_contacted",
    });
  }

  return {
    prospectList: prospects.map((p: any) => ({
      name: p.name,
      type: p.type,
      location: p.location,
      fitScore: p.fitScore,
    })),
  };
}

// ====================
// FIND CONTACTS
// ====================

async function findContacts(organizationName: string, targetRoles?: string[]): Promise<PDCLeadGenOutput> {
  logger.info({ organizationName }, "[pdc-leadgen] Finding contacts");

  const roles = targetRoles || ["Athletic Director", "Head Coach", "Program Director"];

  const prompt = `Generate realistic contact information for ${organizationName}.

Target roles: ${roles.join(", ")}

Return JSON:
{
  "contacts": [
    {
      "name": "Full Name",
      "role": "Exact Role",
      "email": "firstname.lastname@school.edu"
    }
  ]
}

Use realistic naming patterns for school/sports organization contacts.`;

  const response = await completeHaiku(prompt);
  const contacts = JSON.parse(response);

  return {
    contacts: contacts.contacts,
  };
}

// ====================
// GENERATE OUTREACH
// ====================

async function generateOutreach(
  prospect: any,
  outreachType?: string
): Promise<PDCLeadGenOutput> {
  logger.info({ organization: prospect.organization }, "[pdc-leadgen] Generating outreach");

  const prompt = `Generate personalized outreach for athlete development program.

To: ${prospect.name}, ${prospect.role} at ${prospect.organization}
${prospect.sport ? `Sport: ${prospect.sport}` : ""}
Type: ${outreachType || "school"}

From: Eric Santifer, Players Development Club
Background: Former pro basketball player (10 years Europe, 5 championships), focused on mental game and character development for athletes

Create brief, professional outreach (3-4 sentences):
- Personalized opening
- Value proposition ("The Hidden Game" - mental/character development)
- Call-to-action (15-minute call)

Return JSON:
{
  "subject": "Subject line",
  "body": "Message body"
}`;

  const response = await completeSonnet(prompt);
  const outreach = JSON.parse(response);

  return {
    outreach: {
      type: outreachType || "school",
      subject: outreach.subject,
      body: outreach.body,
    },
  };
}

// ====================
// REQUEST REFERRAL
// ====================

async function requestReferral(clientId: string, referralType?: string): Promise<PDCLeadGenOutput> {
  logger.info({ clientId }, "[pdc-leadgen] Requesting referral");

  // Get athlete info
  const { data: athlete } = await supabase
    .from("pdc_athletes")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!athlete) throw new Error("Athlete not found");

  const familyName = athlete.parent_name || "Family";
  const athleteName = athlete.athlete_name;

  const prompt = `Generate a friendly referral request for a happy athlete family.

Family: ${familyName}
Athlete: ${athleteName}

Create a brief, warm message asking for referrals:
- Celebrate recent progress
- Ask if they know other families
- Make it easy and rewarding

Return JSON:
{
  "subject": "Subject line",
  "body": "Email body"
}`;

  const response = await completeHaiku(prompt);
  const referralAsk = JSON.parse(response);

  // Track the ask
  await supabase.from("pdc_referral_requests").insert({
    referrer_type: referralType || "family",
    referrer_name: familyName,
    athlete_name: athleteName,
    ask_message: referralAsk.body,
    ask_date: new Date().toISOString(),
    status: "pending",
  });

  return {
    referralRequest: {
      familyName,
      askMessage: referralAsk.body,
    },
  };
}

// ====================
// TRACK REFERRALS
// ====================

async function trackReferrals(): Promise<PDCLeadGenOutput> {
  logger.info("[pdc-leadgen] Tracking referrals");

  const { data: referrals } = await supabase
    .from("pdc_referral_requests")
    .select("*")
    .in("status", ["pending", "referred"])
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
// FIND PARTNERS
// ====================

async function findPartners(partnerType?: string): Promise<PDCLeadGenOutput> {
  logger.info({ partnerType }, "[pdc-leadgen] Finding partners");

  const type = partnerType || "wealth_manager";

  const prompt = `Generate a list of 3 potential ${type} partners for athlete development program in Tampa Bay/Florida.

Partner type: ${type}

For each partner, return:
{
  "partners": [
    {
      "partnerName": "Company/Firm Name",
      "partnerType": "${type}",
      "clientBase": "description of their clients",
      "alignmentScore": 85,
      "reasoning": "why they're a good partnership fit"
    }
  ]
}

Make them realistic local firms.`;

  const response = await completeSonnet(prompt);
  const partners = JSON.parse(response);

  // Store partner prospects
  for (const partner of partners.partners) {
    await supabase.from("pdc_partner_prospects").insert({
      partner_type: type,
      name: partner.partnerName,
      client_base: partner.clientBase,
      alignment_score: partner.alignmentScore,
      status: "identified",
    });
  }

  return {
    partnerOpportunities: partners.partners.map((p: any) => ({
      partnerName: p.partnerName,
      partnerType: p.partnerType,
      alignmentScore: p.alignmentScore,
    })),
  };
}

// ====================
// GENERATE PARTNER OUTREACH
// ====================

async function generatePartnerOutreach(
  partnerType: string,
  partnerName: string
): Promise<PDCLeadGenOutput> {
  logger.info({ partnerType, partnerName }, "[pdc-leadgen] Generating partner outreach");

  const prompt = `Generate partnership outreach email.

To: ${partnerName}
Partner type: ${partnerType}

From: Eric Santifer, Players Development Club
Background: Former pro basketball player, athlete development specialist

Partnership idea:
- They refer athlete families who need development coaching
- We refer families who need ${partnerType} services
- Co-host workshops on "Raising Successful Athletes"

Create professional partnership proposal (4-5 sentences):

Return JSON:
{
  "subject": "Subject line",
  "body": "Email body",
  "valueProposition": "key benefit for them"
}`;

  const response = await completeSonnet(prompt);
  const outreach = JSON.parse(response);

  return {
    partnerOutreach: {
      partnerName,
      subject: outreach.subject,
      body: outreach.body,
    },
  };
}

// ====================
// LEAD DIGEST
// ====================

async function generateLeadDigest(): Promise<PDCLeadGenOutput> {
  logger.info("[pdc-leadgen] Generating lead digest");

  const { data: summaryData } = await supabase.rpc("get_pdc_leadgen_summary");

  const summary = summaryData || {
    new_inbound_leads: 0,
    schools_contacted: 0,
    partners_contacted: 0,
    referrals_requested: 0,
  };

  // Get hot leads
  const { data: hotLeads } = await supabase
    .from("pdc_inbound_leads")
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
        schoolsContacted: summary.schools_contacted,
        partnersContacted: summary.partners_contacted,
        referralsRequested: summary.referrals_requested,
      },
      hotLeads: (hotLeads || []).map((l) => ({
        athleteName: l.athlete_name || "Unknown",
        sport: l.sport || "Unknown",
        score: l.score,
      })),
      todaysPriorities: [
        "Follow up on hot leads",
        "Contact schools on Tuesday/Thursday",
        "Partner outreach on Wednesday",
      ],
    },
  };
}
