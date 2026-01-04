/**
 * Outreach Queue Management
 *
 * Manages queued outreach messages for LinkedIn, email, and social channels
 */

import { supabase } from "./supabase.js";
import logger from "./logger.js";

type Context = "sts" | "pdc";
type Channel =
  | "linkedin_connection"
  | "linkedin_message"
  | "linkedin_inmail"
  | "email"
  | "instagram"
  | "facebook";
type Status = "queued" | "sent" | "responded" | "failed" | "cancelled";

interface QueueOutreachParams {
  context: Context;
  channel: Channel;
  prospectId?: string;
  prospectName: string;
  prospectLinkedinUrl?: string;
  subject?: string;
  body: string;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

interface OutreachItem {
  id: string;
  context: Context;
  channel: Channel;
  prospect_id?: string;
  prospect_name: string;
  prospect_linkedin_url?: string;
  subject?: string;
  body: string;
  scheduled_for?: string;
  status: Status;
  sent_at?: string;
  response_at?: string;
  response_text?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface GetQueuedParams {
  channel?: Channel;
  status?: Status;
  limit?: number;
}

/**
 * Queue an outreach message
 */
export async function queueOutreach(
  params: QueueOutreachParams
): Promise<OutreachItem> {
  try {
    const { data, error } = await supabase
      .from("outreach_queue")
      .insert({
        context: params.context,
        channel: params.channel,
        prospect_id: params.prospectId,
        prospect_name: params.prospectName,
        prospect_linkedin_url: params.prospectLinkedinUrl,
        subject: params.subject,
        body: params.body,
        scheduled_for: params.scheduledFor?.toISOString(),
        status: "queued",
        metadata: params.metadata,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, params }, "Error queuing outreach");
      throw error;
    }

    logger.info(
      {
        id: data.id,
        context: params.context,
        channel: params.channel,
        prospectName: params.prospectName,
      },
      "Outreach queued"
    );

    return data as OutreachItem;
  } catch (error) {
    logger.error({ error, params }, "Failed to queue outreach");
    throw error;
  }
}

/**
 * Get queued outreach messages
 */
export async function getQueuedOutreach(
  context: Context,
  params: GetQueuedParams = {}
): Promise<OutreachItem[]> {
  try {
    let query = supabase
      .from("outreach_queue")
      .select("*")
      .eq("context", context)
      .order("scheduled_for", { ascending: true, nullsFirst: false });

    if (params.channel) {
      query = query.eq("channel", params.channel);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error, context, params }, "Error getting queued outreach");
      throw error;
    }

    logger.debug(
      { context, count: data?.length || 0, params },
      "Retrieved queued outreach"
    );

    return (data || []) as OutreachItem[];
  } catch (error) {
    logger.error({ error, context, params }, "Failed to get queued outreach");
    throw error;
  }
}

/**
 * Mark outreach as sent
 */
export async function markOutreachSent(
  outreachId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const updateData: any = {
      status: "sent",
      sent_at: new Date().toISOString(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await supabase
      .from("outreach_queue")
      .update(updateData)
      .eq("id", outreachId);

    if (error) {
      logger.error({ error, outreachId }, "Error marking outreach as sent");
      throw error;
    }

    logger.info({ outreachId }, "Outreach marked as sent");
  } catch (error) {
    logger.error({ error, outreachId }, "Failed to mark outreach as sent");
    throw error;
  }
}

/**
 * Mark outreach as responded
 */
export async function markOutreachResponded(
  outreachId: string,
  responseText?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("outreach_queue")
      .update({
        status: "responded",
        response_at: new Date().toISOString(),
        response_text: responseText,
      })
      .eq("id", outreachId);

    if (error) {
      logger.error(
        { error, outreachId },
        "Error marking outreach as responded"
      );
      throw error;
    }

    logger.info({ outreachId }, "Outreach marked as responded");
  } catch (error) {
    logger.error(
      { error, outreachId },
      "Failed to mark outreach as responded"
    );
    throw error;
  }
}

/**
 * Mark outreach as failed
 */
export async function markOutreachFailed(
  outreachId: string,
  errorMessage: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("outreach_queue")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("id", outreachId);

    if (error) {
      logger.error({ error, outreachId }, "Error marking outreach as failed");
      throw error;
    }

    logger.warn({ outreachId, errorMessage }, "Outreach marked as failed");
  } catch (error) {
    logger.error({ error, outreachId }, "Failed to mark outreach as failed");
    throw error;
  }
}

/**
 * Get outreach stats for a date range
 */
export async function getOutreachStats(
  context: Context,
  startDate: Date,
  endDate: Date
): Promise<{
  total: number;
  queued: number;
  sent: number;
  responded: number;
  failed: number;
  responseRate: number;
}> {
  try {
    const { data, error } = await supabase
      .from("outreach_queue")
      .select("status")
      .eq("context", context)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      logger.error({ error, context }, "Error getting outreach stats");
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      queued: 0,
      sent: 0,
      responded: 0,
      failed: 0,
      responseRate: 0,
    };

    if (data) {
      for (const item of data) {
        if (item.status === "queued") stats.queued++;
        else if (item.status === "sent") stats.sent++;
        else if (item.status === "responded") stats.responded++;
        else if (item.status === "failed") stats.failed++;
      }

      // Calculate response rate
      const totalSent = stats.sent + stats.responded;
      if (totalSent > 0) {
        stats.responseRate = Math.round((stats.responded / totalSent) * 100);
      }
    }

    logger.debug({ context, stats }, "Outreach stats retrieved");

    return stats;
  } catch (error) {
    logger.error({ error, context }, "Failed to get outreach stats");
    throw error;
  }
}

/**
 * Cancel queued outreach
 */
export async function cancelOutreach(outreachId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("outreach_queue")
      .update({ status: "cancelled" })
      .eq("id", outreachId)
      .eq("status", "queued"); // Only cancel if still queued

    if (error) {
      logger.error({ error, outreachId }, "Error cancelling outreach");
      throw error;
    }

    logger.info({ outreachId }, "Outreach cancelled");
  } catch (error) {
    logger.error({ error, outreachId }, "Failed to cancel outreach");
    throw error;
  }
}
