/**
 * LinkedIn Daily Limits Tracker
 *
 * Enforces safety limits for LinkedIn automation to avoid account restrictions
 */

import { supabase } from "./supabase.js";
import logger from "./logger.js";

// LinkedIn daily action limits
const DAILY_LIMITS = {
  profile_visit: 100,
  connection_request: 25,
  message: 50,
  inmail: 10,
} as const;

type ActionType = keyof typeof DAILY_LIMITS;
type Context = "sts" | "pdc";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}

interface DailyStats {
  profile_visit: number;
  connection_request: number;
  message: number;
  inmail: number;
}

/**
 * Check if daily limit has been reached for an action
 */
export async function checkDailyLimit(
  action: ActionType,
  context: Context
): Promise<LimitCheckResult> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const { data, error } = await supabase
      .from("linkedin_daily_limits")
      .select("count")
      .eq("context", context)
      .eq("date", today)
      .eq("action_type", action)
      .maybeSingle();

    if (error) {
      logger.error({ error, action, context }, "Error checking daily limit");
      throw error;
    }

    const current = data?.count || 0;
    const limit = DAILY_LIMITS[action];
    const remaining = Math.max(0, limit - current);
    const allowed = current < limit;

    logger.debug(
      { action, context, current, limit, remaining, allowed },
      "Daily limit check"
    );

    return {
      allowed,
      current,
      limit,
      remaining,
    };
  } catch (error) {
    logger.error({ error, action, context }, "Failed to check daily limit");
    throw error;
  }
}

/**
 * Increment daily count for an action
 */
export async function incrementDailyCount(
  action: ActionType,
  context: Context
): Promise<void> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // Use upsert to increment or create
    const { error } = await supabase.from("linkedin_daily_limits").upsert(
      {
        context,
        date: today,
        action_type: action,
        count: 1,
      },
      {
        onConflict: "context,date,action_type",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      // If upsert fails, try to increment existing record
      const { error: updateError } = await supabase.rpc("increment_limit", {
        p_context: context,
        p_date: today,
        p_action_type: action,
      });

      if (updateError) {
        logger.error(
          { error: updateError, action, context },
          "Error incrementing daily count"
        );
        throw updateError;
      }
    }

    logger.debug({ action, context }, "Incremented daily count");
  } catch (error) {
    logger.error({ error, action, context }, "Failed to increment daily count");
    throw error;
  }
}

/**
 * Get current daily stats for all actions
 */
export async function getDailyStats(context: Context): Promise<DailyStats> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const { data, error } = await supabase
      .from("linkedin_daily_limits")
      .select("action_type, count")
      .eq("context", context)
      .eq("date", today);

    if (error) {
      logger.error({ error, context }, "Error fetching daily stats");
      throw error;
    }

    // Initialize stats with zeros
    const stats: DailyStats = {
      profile_visit: 0,
      connection_request: 0,
      message: 0,
      inmail: 0,
    };

    // Fill in actual counts
    if (data) {
      for (const row of data) {
        if (row.action_type in stats) {
          stats[row.action_type as ActionType] = row.count;
        }
      }
    }

    logger.debug({ context, stats }, "Daily stats retrieved");

    return stats;
  } catch (error) {
    logger.error({ error, context }, "Failed to get daily stats");
    throw error;
  }
}

/**
 * Reset daily counts (called by cron job at midnight)
 */
export async function resetDailyCounts(): Promise<void> {
  try {
    // Delete records older than 7 days (keep recent history)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const { error } = await supabase
      .from("linkedin_daily_limits")
      .delete()
      .lt("date", sevenDaysAgoStr);

    if (error) {
      logger.error({ error }, "Error resetting daily counts");
      throw error;
    }

    logger.info("Daily counts reset successfully");
  } catch (error) {
    logger.error({ error }, "Failed to reset daily counts");
    throw error;
  }
}

/**
 * Get limits summary with remaining capacity
 */
export async function getLimitsSummary(context: Context): Promise<{
  action: ActionType;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}[]> {
  const stats = await getDailyStats(context);

  return Object.keys(DAILY_LIMITS).map((action) => {
    const actionType = action as ActionType;
    const current = stats[actionType];
    const limit = DAILY_LIMITS[actionType];
    const remaining = Math.max(0, limit - current);
    const percentage = Math.round((current / limit) * 100);

    return {
      action: actionType,
      current,
      limit,
      remaining,
      percentage,
    };
  });
}
