/**
 * Supabase Client & Utilities
 *
 * Provides:
 * - Supabase client initialization
 * - Agent run logging and completion tracking
 * - Database access for all agents
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Types
export interface AgentRunInput {
  agentName: string;
  context: "personal" | "pdc" | "sts" | "shared";
  triggerType: "manual" | "scheduled" | "event" | "webhook";
  inputData?: unknown;
}

export interface AgentRunCompletion {
  status: "completed" | "failed";
  outputData?: unknown;
  errorMessage?: string;
}

/**
 * Log the start of an agent run
 * Returns the run ID for tracking
 */
export async function logAgentRun(input: AgentRunInput): Promise<string> {
  const { data, error } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: input.agentName,
      context: input.context,
      trigger_type: input.triggerType,
      status: "running",
      input_data: input.inputData,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌ Failed to log agent run:", error);
    throw error;
  }

  return data.id;
}

/**
 * Mark an agent run as completed or failed
 */
export async function completeAgentRun(
  runId: string,
  completion: AgentRunCompletion
): Promise<void> {
  const { error } = await supabase
    .from("agent_runs")
    .update({
      status: completion.status,
      output_data: completion.outputData,
      error_message: completion.errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    console.error("❌ Failed to complete agent run:", error);
    throw error;
  }
}

/**
 * Get recent agent runs
 */
export async function getRecentRuns(limit: number = 10) {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ Failed to fetch agent runs:", error);
    throw error;
  }

  return data;
}

/**
 * Get runs by agent name
 */
export async function getRunsByAgent(agentName: string, limit: number = 10) {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("agent_name", agentName)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ Failed to fetch agent runs:", error);
    throw error;
  }

  return data;
}
