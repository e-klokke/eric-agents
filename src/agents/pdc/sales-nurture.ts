/**
 * PDC Sales/Nurture Agent
 *
 * Automates the enrollment pipeline from inquiry to client for PDC athlete development services.
 *
 * Core capabilities:
 * - Parent follow-up sequences (new inquiry, post-consultation, stalled, enrolled)
 * - Consultation scheduling and reminders
 * - Program enrollment tracking
 * - Referral partner nurturing
 * - Workshop/speaking lead management
 *
 * Author: Eric Santifer (Players Development Club)
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { completeHaiku } from "../../shared/llm.js";
import logger from "../../shared/logger.js";

// ====================
// TYPES
// ====================

interface PDCSalesInput {
  action:
    | "check_followups"
    | "send_followup"
    | "enrollment_digest"
    | "schedule_consultation"
    | "track_athlete"
    | "nurture_partner"
    | "workshop_followup";

  // Follow-ups
  leadId?: string;
  sequenceType?: "new_inquiry" | "post_consultation" | "stalled" | "enrolled";

  // Consultations
  parentName?: string;
  parentEmail?: string;
  athleteName?: string;
  sport?: string;
  preferredTimes?: string[];

  // Athlete tracking
  athleteId?: string;
  status?:
    | "inquiry"
    | "consultation_scheduled"
    | "consultation_complete"
    | "enrolled"
    | "active"
    | "completed"
    | "churned";
  programType?: "bridge" | "individual" | "workshop";
  notes?: string;

  // Partner nurturing
  partnerId?: string;
  partnerType?: "wealth_manager" | "nil_company" | "coach" | "school";

  // Workshops
  eventType?: "speaking" | "workshop" | "clinic";
  organizationName?: string;
  eventDate?: Date;
}

interface PDCSalesOutput {
  followUps?: Array<{
    leadId: string;
    parentName: string;
    athleteName: string;
    sequenceType: string;
    touchpointNumber: number;
    message: {
      subject: string;
      body: string;
      channel: "email" | "sms";
    };
    scheduledFor: Date;
  }>;

  enrollmentDigest?: {
    date: Date;
    summary: {
      totalInquiries: number;
      consultationsScheduled: number;
      activeAthletes: number;
      thisMonthEnrollments: number;
    };
    needsAction: Array<{
      id: string;
      athleteName: string;
      reason: string;
      suggestedAction: string;
      priority: "urgent" | "high" | "normal";
    }>;
  };

  consultation?: {
    scheduled: boolean;
    athleteName: string;
    parentName: string;
    dateTime: Date | null;
    confirmationSent: boolean;
  };

  partnerNurture?: {
    partnerId: string;
    partnerName: string;
    action: {
      type: "email" | "call" | "meeting";
      message: string;
    };
  };
}

// ====================
// FOLLOW-UP TEMPLATES
// ====================

const TEMPLATES = {
  new_inquiry: {
    day0: {
      subject: (athleteName: string) => `${athleteName}'s development journey`,
      body: (parentName: string, athleteName: string) => `Hi ${parentName},

Thanks for reaching out about ${athleteName}. As a former professional basketball player (10 years in Europe, 5 championships), I understand exactly what it takes to reach the next level.

The mental game and character development are often the missing pieces - what I call "The Hidden Game."

I'd love to learn more about ${athleteName}'s goals. Do you have 20 minutes this week for a quick call?

Here's my calendar: [Calendar Link]

Eric Santifer
Players Development Club`,
    },
    day2: {
      subject: () => "What college coaches actually look for",
      body: (parentName: string) => `Hi ${parentName},

Quick insight from my years in pro sports:

The athletes who make it aren't always the most talented - they're the ones who've developed:
• Mental toughness under pressure
• Coachability and self-awareness
• Character that builds team culture

This is what our Bridge Program focuses on.

Still interested in chatting?

Eric`,
    },
  },

  post_consultation: {
    day1: {
      subject: (athleteName: string) => `Great connecting about ${athleteName}`,
      body: (parentName: string, athleteName: string, observation: string) =>
        `Hi ${parentName},

Really enjoyed our conversation about ${athleteName}.

Key thing I noticed: ${observation}

As discussed, the next step is enrolling in the Bridge Program.

Let me know if any questions came up since we talked.

Eric`,
    },
  },

  enrolled: {
    monthly: {
      subject: (athleteName: string) => `${athleteName}'s progress update`,
      body: (parentName: string, athleteName: string, progress: string) =>
        `Hi ${parentName},

Quick monthly update on ${athleteName}:

${progress}

Also - if you know any families who might benefit from what we do, I'd love an introduction.

Eric`,
    },
  },
};

// ====================
// MAIN EXPORT
// ====================

export async function runPDCSalesNurture(input: PDCSalesInput): Promise<PDCSalesOutput> {
  const runId = await logAgentRun({
    agentName: "pdc-sales-nurture",
    context: "pdc",
    triggerType: "manual",
    inputData: input,
  });

  try {
    logger.info({ action: input.action }, "[pdc-sales-nurture] Starting agent");

    let result: PDCSalesOutput = {};

    switch (input.action) {
      case "check_followups":
        result = await checkFollowUps();
        break;

      case "enrollment_digest":
        result = await generateEnrollmentDigest();
        break;

      case "schedule_consultation":
        if (!input.parentName || !input.parentEmail || !input.athleteName) {
          throw new Error("Missing required fields for consultation scheduling");
        }
        result = await scheduleConsultation(
          input.parentName,
          input.parentEmail,
          input.athleteName,
          input.sport || "Basketball"
        );
        break;

      case "track_athlete":
        if (!input.athleteId || !input.status) {
          throw new Error("Missing athleteId or status");
        }
        result = await trackAthlete(input.athleteId, input.status, input.notes);
        break;

      case "nurture_partner":
        if (!input.partnerId) {
          throw new Error("Missing partnerId");
        }
        result = await nurturePartner(input.partnerId);
        break;

      default:
        throw new Error(`Unknown action: ${input.action}`);
    }

    await completeAgentRun(runId, {
      status: "completed",
      outputData: result,
    });
    logger.info({ action: input.action }, "[pdc-sales-nurture] Completed successfully");

    return result;
  } catch (error) {
    logger.error({ error, action: input.action }, "[pdc-sales-nurture] Error");
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

async function checkFollowUps(): Promise<PDCSalesOutput> {
  logger.info("[pdc-sales-nurture] Checking for due follow-ups");

  // Get pending follow-ups that are due
  const { data: dueFollowUps, error } = await supabase
    .from("pdc_followup_queue")
    .select(`
      *,
      pdc_athletes (
        athlete_name,
        parent_name
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .limit(10);

  if (error) throw error;

  const followUps = (dueFollowUps || []).map((fu) => ({
    leadId: fu.athlete_id,
    parentName: (fu.pdc_athletes as any)?.parent_name || "Parent",
    athleteName: (fu.pdc_athletes as any)?.athlete_name || "Athlete",
    sequenceType: fu.sequence_type,
    touchpointNumber: fu.touchpoint_number,
    message: {
      subject: fu.subject || "",
      body: fu.body || "",
      channel: fu.channel as "email" | "sms",
    },
    scheduledFor: new Date(fu.scheduled_for),
  }));

  logger.info({ count: followUps.length }, "[pdc-sales-nurture] Found due follow-ups");

  return { followUps };
}

// ====================
// ENROLLMENT DIGEST
// ====================

async function generateEnrollmentDigest(): Promise<PDCSalesOutput> {
  logger.info("[pdc-sales-nurture] Generating enrollment digest");

  // Get summary stats
  const { data: summaryData, error: summaryError } = await supabase.rpc(
    "get_pdc_enrollment_summary"
  );

  if (summaryError) throw summaryError;

  const summary = summaryData || {
    total_inquiries: 0,
    consultations_scheduled: 0,
    active_athletes: 0,
    this_month_enrollments: 0,
  };

  // Get athletes needing action (no activity in 7+ days, status = inquiry)
  const { data: needsActionData, error: needsActionError } = await supabase
    .from("pdc_athletes")
    .select("*")
    .eq("status", "inquiry")
    .lt("updated_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(20);

  if (needsActionError) throw needsActionError;

  const needsAction = (needsActionData || []).map((athlete) => ({
    id: athlete.id,
    athleteName: athlete.athlete_name,
    reason: "No activity in 7+ days",
    suggestedAction: "Send follow-up email",
    priority: "high" as const,
  }));

  return {
    enrollmentDigest: {
      date: new Date(),
      summary: {
        totalInquiries: summary.total_inquiries,
        consultationsScheduled: summary.consultations_scheduled,
        activeAthletes: summary.active_athletes,
        thisMonthEnrollments: summary.this_month_enrollments,
      },
      needsAction,
    },
  };
}

// ====================
// SCHEDULE CONSULTATION
// ====================

async function scheduleConsultation(
  parentName: string,
  parentEmail: string,
  athleteName: string,
  sport: string
): Promise<PDCSalesOutput> {
  logger.info({ parentName, athleteName }, "[pdc-sales-nurture] Scheduling consultation");

  // Create athlete record
  const { data: athlete, error: insertError } = await supabase
    .from("pdc_athletes")
    .insert({
      athlete_name: athleteName,
      parent_name: parentName,
      parent_email: parentEmail,
      sport,
      status: "consultation_scheduled",
      consultation_date: new Date(),
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Queue immediate follow-up
  const { error: queueError } = await supabase.from("pdc_followup_queue").insert({
    athlete_id: athlete.id,
    sequence_type: "new_inquiry",
    touchpoint_number: 1,
    channel: "email",
    subject: TEMPLATES.new_inquiry.day0.subject(athleteName),
    body: TEMPLATES.new_inquiry.day0.body(parentName, athleteName),
    scheduled_for: new Date(),
    status: "pending",
  });

  if (queueError) throw queueError;

  return {
    consultation: {
      scheduled: true,
      athleteName,
      parentName,
      dateTime: new Date(),
      confirmationSent: true,
    },
  };
}

// ====================
// TRACK ATHLETE
// ====================

async function trackAthlete(
  athleteId: string,
  status: string,
  notes?: string
): Promise<PDCSalesOutput> {
  logger.info({ athleteId, status }, "[pdc-sales-nurture] Tracking athlete status");

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes) updateData.notes = notes;
  if (status === "enrolled") updateData.enrolled_date = new Date().toISOString();

  const { error } = await supabase.from("pdc_athletes").update(updateData).eq("id", athleteId);

  if (error) throw error;

  return {};
}

// ====================
// NURTURE PARTNER
// ====================

async function nurturePartner(partnerId: string): Promise<PDCSalesOutput> {
  logger.info({ partnerId }, "[pdc-sales-nurture] Nurturing referral partner");

  const { data: partner, error } = await supabase
    .from("pdc_referral_partners")
    .select("*")
    .eq("id", partnerId)
    .single();

  if (error) throw error;
  if (!partner) throw new Error("Partner not found");

  // Generate personalized nurture message using LLM
  const prompt = `Generate a brief, personalized email to nurture a referral partner relationship.

Partner: ${partner.name}
Type: ${partner.partner_type}
Relationship: ${partner.relationship_status}
Total referrals: ${partner.total_referrals}

Create a short email (3-4 sentences) that:
1. Thanks them for the relationship
2. Shares a quick win or insight relevant to their type
3. Asks if they know anyone who might benefit

Return JSON:
{
  "subject": "email subject",
  "body": "email body"
}`;

  const response = await completeHaiku(prompt);
  const message = JSON.parse(response);

  // Update last contact
  await supabase
    .from("pdc_referral_partners")
    .update({ last_contact: new Date().toISOString() })
    .eq("id", partnerId);

  return {
    partnerNurture: {
      partnerId: partner.id,
      partnerName: partner.name,
      action: {
        type: "email",
        message: message.body,
      },
    },
  };
}
