/**
 * STS Sales/Nurture Agent
 *
 * Automates the sales pipeline from lead to close for STS enterprise technology deals.
 *
 * Core capabilities:
 * - Follow-up sequences (post-proposal, stalled, nurture)
 * - Deal pipeline tracking and reporting
 * - Proposal generation with partner products
 * - Meeting preparation with research
 * - Partner portal monitoring
 *
 * Author: Eric Santifer (Sino Technology Solutions)
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { completeSonnet } from "../../shared/llm.js";
import logger from "../../shared/logger.js";

// ====================
// TYPES
// ====================

interface STSSalesInput {
  action:
    | "check_followups"
    | "send_followup"
    | "pipeline_digest"
    | "generate_proposal"
    | "meeting_prep"
    | "track_deal"
    | "check_partners";

  // Follow-ups
  dealId?: string;
  sequenceType?: "post_proposal" | "stalled" | "nurture";

  // Proposals
  companyName?: string;
  requirements?: string;
  products?: string[];
  budget?: string;

  // Meeting prep
  meetingId?: string;
  attendees?: string[];

  // Deal tracking
  dealStatus?:
    | "prospect"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost";
  dealValue?: number;
  notes?: string;
}

interface STSSalesOutput {
  followUps?: Array<{
    dealId: string;
    companyName: string;
    contactName: string;
    sequenceType: string;
    touchpointNumber: number;
    email: {
      subject: string;
      body: string;
    };
    scheduledFor: Date;
  }>;

  pipelineDigest?: {
    date: Date;
    summary: {
      totalDeals: number;
      totalValue: number;
      byStage: Record<string, { count: number; value: number }>;
    };
    needsAction: Array<{
      dealId: string;
      companyName: string;
      reason: string;
      daysSinceActivity: number;
      suggestedAction: string;
      priority: "urgent" | "high" | "normal";
    }>;
  };

  proposal?: {
    companyName: string;
    generatedAt: Date;
    sections: {
      executiveSummary: string;
      solution: string;
      investment: string;
    };
  };

  meetingPrep?: {
    dealContext: string;
    talkingPoints: string[];
    objectionResponses: Record<string, string>;
  };
}

// ====================
// FOLLOW-UP TEMPLATES
// ====================

// Templates can be expanded later for automated email sequences

// ====================
// MAIN EXPORT
// ====================

export async function runSTSSalesNurture(input: STSSalesInput): Promise<STSSalesOutput> {
  const runId = await logAgentRun({
    agentName: "sts-sales-nurture",
    context: "sts",
    triggerType: "manual",
    inputData: input,
  });

  try {
    logger.info({ action: input.action }, "[sts-sales-nurture] Starting agent");

    let result: STSSalesOutput = {};

    switch (input.action) {
      case "check_followups":
        result = await checkFollowUps();
        break;

      case "pipeline_digest":
        result = await generatePipelineDigest();
        break;

      case "generate_proposal":
        if (!input.companyName || !input.requirements) {
          throw new Error("Missing company name or requirements for proposal");
        }
        result = await generateProposal(
          input.companyName,
          input.requirements,
          input.products,
          input.budget
        );
        break;

      case "meeting_prep":
        if (!input.dealId) {
          throw new Error("Missing dealId for meeting prep");
        }
        result = await prepareMeeting(input.dealId, input.attendees);
        break;

      case "track_deal":
        if (!input.dealId || !input.dealStatus) {
          throw new Error("Missing dealId or dealStatus");
        }
        result = await trackDeal(input.dealId, input.dealStatus, input.dealValue, input.notes);
        break;

      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    await completeAgentRun(runId, {
      status: "completed",
      outputData: result,
    });
    logger.info({ action: input.action }, "[sts-sales-nurture] Completed successfully");

    return result;
  } catch (error) {
    logger.error({ error, action: input.action }, "[sts-sales-nurture] Error");
    await completeAgentRun(runId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// ====================
// CHECK FOLLOW-UPS
// ====================

async function checkFollowUps(): Promise<STSSalesOutput> {
  logger.info("[sts-sales-nurture] Checking for due follow-ups");

  // Get pending follow-ups that are due
  const { data: dueFollowUps, error } = await supabase
    .from("sts_followup_queue")
    .select(`
      *,
      sts_deals (
        title,
        sts_companies (
          name
        )
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(10);

  if (error) throw error;

  const followUps = (dueFollowUps || []).map((fu) => ({
    dealId: fu.deal_id,
    companyName: (fu.sts_deals as any)?.sts_companies?.name || "Company",
    contactName: "Contact",
    sequenceType: fu.sequence_type,
    touchpointNumber: fu.touchpoint_number,
    email: {
      subject: fu.email_subject || "",
      body: fu.email_body || "",
    },
    scheduledFor: new Date(fu.scheduled_for),
  }));

  logger.info({ count: followUps.length }, "[sts-sales-nurture] Found due follow-ups");

  return { followUps };
}

// ====================
// PIPELINE DIGEST
// ====================

async function generatePipelineDigest(): Promise<STSSalesOutput> {
  logger.info("[sts-sales-nurture] Generating pipeline digest");

  // Get summary stats
  const { data: summaryData, error: summaryError } = await supabase.rpc(
    "get_sts_pipeline_summary"
  );

  if (summaryError) throw summaryError;

  const summary = summaryData || {
    total_deals: 0,
    total_value: 0,
    by_stage: {},
  };

  // Get deals needing action (no activity in 7+ days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: needsActionData, error: needsActionError } = await supabase
    .from("sts_deals")
    .select(`
      *,
      sts_companies (
        name
      )
    `)
    .not("stage", "in", '("closed_won","closed_lost")')
    .lt("last_activity", sevenDaysAgo)
    .limit(20);

  if (needsActionError) throw needsActionError;

  const needsAction = (needsActionData || []).map((deal) => {
    const daysSince = Math.floor(
      (Date.now() - new Date(deal.last_activity).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      dealId: deal.id,
      companyName: (deal.sts_companies as any)?.name || "Unknown",
      reason: `No activity in ${daysSince} days`,
      daysSinceActivity: daysSince,
      suggestedAction:
        deal.stage === "proposal" ? "Send follow-up email" : "Schedule check-in call",
      priority: (daysSince > 14 ? "urgent" : daysSince > 7 ? "high" : "normal") as
        | "urgent"
        | "high"
        | "normal",
    };
  });

  return {
    pipelineDigest: {
      date: new Date(),
      summary: {
        totalDeals: summary.total_deals,
        totalValue: summary.total_value,
        byStage: summary.by_stage || {},
      },
      needsAction,
    },
  };
}

// ====================
// GENERATE PROPOSAL
// ====================

async function generateProposal(
  companyName: string,
  requirements: string,
  products?: string[],
  budget?: string
): Promise<STSSalesOutput> {
  logger.info({ companyName }, "[sts-sales-nurture] Generating proposal");

  const prompt = `Generate a professional IT services proposal for a company.

Company: ${companyName}
Requirements: ${requirements}
${products ? `Requested products: ${products.join(", ")}` : ""}
${budget ? `Budget: ${budget}` : ""}

STS Context:
- 15+ years enterprise IT infrastructure experience
- Partners: Cisco, Dell, Oracle, Lenovo, HP
- Multi-vendor expertise (not locked to one partner)
- Local Tampa presence with enterprise capability

Create a proposal with these sections (return JSON):
{
  "executiveSummary": "2-3 sentence overview of solution",
  "solution": "Paragraph describing the technical solution",
  "investment": "High-level pricing structure (e.g., '$50K-75K for infrastructure refresh')"
}

Keep it concise and professional.`;

  const response = await completeSonnet(prompt);
  const proposal = JSON.parse(response);

  return {
    proposal: {
      companyName,
      generatedAt: new Date(),
      sections: proposal,
    },
  };
}

// ====================
// PREPARE MEETING
// ====================

async function prepareMeeting(dealId: string, attendees?: string[]): Promise<STSSalesOutput> {
  logger.info({ dealId }, "[sts-sales-nurture] Preparing for meeting");

  // Get deal context
  const { data: deal, error } = await supabase
    .from("sts_deals")
    .select(`
      *,
      sts_companies (
        name,
        industry,
        research_data
      )
    `)
    .eq("id", dealId)
    .single();

  if (error) throw error;
  if (!deal) throw new Error("Deal not found");

  const companyName = (deal.sts_companies as any)?.name || "Unknown Company";
  const industry = (deal.sts_companies as any)?.industry || "Unknown";

  const prompt = `Generate meeting prep materials for an enterprise IT sales meeting.

Company: ${companyName}
Industry: ${industry}
Deal Stage: ${deal.stage}
Deal Value: $${deal.value}
${attendees ? `Attendees: ${attendees.join(", ")}` : ""}

Create:
{
  "dealContext": "1-2 sentence summary of deal status",
  "talkingPoints": ["point 1", "point 2", "point 3"],
  "objectionResponses": {
    "price": "response to price objection",
    "timing": "response to timing concerns"
  }
}`;

  const response = await completeSonnet(prompt);
  const prep = JSON.parse(response);

  return {
    meetingPrep: prep,
  };
}

// ====================
// TRACK DEAL
// ====================

async function trackDeal(
  dealId: string,
  status: string,
  value?: number,
  notes?: string
): Promise<STSSalesOutput> {
  logger.info({ dealId, status }, "[sts-sales-nurture] Tracking deal");

  const updateData: any = {
    stage: status,
    last_activity: new Date().toISOString(),
  };

  if (value) updateData.value = value;
  if (notes) updateData.notes = notes;

  const { error } = await supabase.from("sts_deals").update(updateData).eq("id", dealId);

  if (error) throw error;

  return {};
}
