/**
 * Eric's AI Agent System - HTTP Server
 *
 * Main server handling agent trigger endpoints
 * Port: 3000
 */

import "dotenv/config";
import http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import logger from "./shared/logger.js";
import { validateEnvironment } from "./shared/env.js";
import { checkRateLimit, getClientIP, RateLimitPresets } from "./shared/rate-limiter.js";

// Validate environment variables at startup
validateEnvironment();

// Start Telegram bot if token is configured
import "./telegram-bot.js";

// Import validation schemas
import {
  PersonalLeadInputSchema,
  PDCLeadInputSchema,
  STSLeadInputSchema,
  PDCContentInputSchema,
  STSContentInputSchema,
  validateInput,
} from "./shared/validation.js";

const PORT = process.env.PORT || 3000;

// Helper: Authentication check
function authenticate(req: IncomingMessage): boolean {
  const apiKey = req.headers['x-api-key'];
  return apiKey === process.env.API_KEY;
}

// Helper: Send JSON response
function json(res: ServerResponse, data: unknown, status: number = 200): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Helper: Create mobile-friendly success response
function successResponse(summary: string, data: unknown): object {
  return {
    success: true,
    summary,
    data,
    timestamp: new Date().toISOString(),
  };
}

// Helper: Create mobile-friendly error response
function errorResponse(error: string): object {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

// Helper: Parse JSON body
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

// Main request handler
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method || "GET";
  const url = req.url || "/";

  logger.info({ method, url }, "Incoming request");

  try {
    // Rate limiting for API endpoints
    if (url.startsWith("/trigger/")) {
      const clientIP = getClientIP(req);
      const rateLimit = checkRateLimit(clientIP, RateLimitPresets.STANDARD);

      if (!rateLimit.allowed) {
        res.setHeader("Retry-After", rateLimit.retryAfter?.toString() || "60");
        return json(
          res,
          errorResponse(`Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds.`),
          429
        );
      }
    }

    // Health check
    if (url === "/health" && method === "GET") {
      return json(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "eric-agents",
      });
    }

    // API info
    if (url === "/api/info" && method === "GET") {
      return json(res, {
        service: "Eric's AI Agent System",
        version: "1.1.0",
        endpoints: {
          health: "GET /health",
          info: "GET /api/info",
          personal_research: "POST /trigger/research/personal",
          pdc_research: "POST /trigger/research/pdc",
          sts_research: "POST /trigger/research/sts",
          pdc_content: "POST /trigger/content/pdc",
          sts_content: "POST /trigger/content/sts",
          // n8n Helper Endpoints
          sts_prospects_to_warm: "GET /api/sts/prospects/to-warm",
          sts_prospects_to_connect: "GET /api/sts/prospects/to-connect",
          sts_prospects_to_message: "GET /api/sts/prospects/to-message",
          sts_outreach_queue: "GET /api/sts/outreach/queue",
          pdc_partners_to_warm: "GET /api/pdc/partners/to-warm",
          pdc_partners_to_contact: "GET /api/pdc/partners/to-contact",
          pdc_schools_to_contact: "GET /api/pdc/schools/to-contact",
          pdc_outreach_queue: "GET /api/pdc/outreach/queue",
          // n8n Webhooks
          webhook_sts_inbound: "POST /webhook/sts/inbound",
          webhook_sts_trigger_event: "POST /webhook/sts/trigger-event",
          webhook_sts_linkedin_response: "POST /webhook/sts/linkedin-response",
          webhook_pdc_inbound: "POST /webhook/pdc/inbound",
          webhook_pdc_instagram: "POST /webhook/pdc/instagram",
          webhook_pdc_facebook: "POST /webhook/pdc/facebook",
          webhook_pdc_linkedin_response: "POST /webhook/pdc/linkedin-response",
        },
      });
    }

    // Personal Lead Research Agent
    if (url === "/trigger/research/personal" && method === "POST") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }
      const body = await parseBody(req);
      const validation = validateInput(PersonalLeadInputSchema, body);
      if (!validation.success) {
        return json(res, errorResponse(validation.error), 400);
      }
      const params = validation.data;
      const { runPersonalLeadResearch } = await import(
        "./agents/personal/lead-research.js"
      );
      const result = await runPersonalLeadResearch(params);
      const summary = `Research completed for ${params.name}${params.company ? ` at ${params.company}` : ""}. Found ${result.commonGround?.length || 0} connection points.`;
      return json(res, successResponse(summary, result));
    }

    // PDC Lead Research Agent
    if (url === "/trigger/research/pdc" && method === "POST") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }
      const body = await parseBody(req);
      const validation = validateInput(PDCLeadInputSchema, body);
      if (!validation.success) {
        return json(res, errorResponse(validation.error), 400);
      }
      const params = validation.data;
      const { runPDCLeadResearch } = await import(
        "./agents/pdc/lead-research.js"
      );
      const result = await runPDCLeadResearch(params);
      const summary = params.researchType === "market"
        ? `Market research completed for ${params.targetArea || "target area"} in ${params.targetSegment || "athlete development"}.`
        : params.researchType === "collaboration"
        ? `Collaboration research completed for ${params.organizationName}.`
        : `Lead research completed for ${params.athleteName}.`;
      return json(res, successResponse(summary, result));
    }

    // STS Lead Research Agent
    if (url === "/trigger/research/sts" && method === "POST") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }
      const body = await parseBody(req);
      const validation = validateInput(STSLeadInputSchema, body);
      if (!validation.success) {
        return json(res, errorResponse(validation.error), 400);
      }
      const params = validation.data;
      const { runSTSLeadResearch } = await import(
        "./agents/sts/lead-research.js"
      );
      const result = await runSTSLeadResearch(params);
      const partnerCount = Object.values(result.partnerOpportunities || {}).flat().length;
      const summary = `Company research completed for ${params.companyName}. Deal score: ${result.score?.overall || "N/A"}/10. Found ${partnerCount} partner opportunities.`;
      return json(res, successResponse(summary, result));
    }

    // PDC Social/Content Agent
    if (url === "/trigger/content/pdc" && method === "POST") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }
      const body = await parseBody(req);
      const validation = validateInput(PDCContentInputSchema, body);
      if (!validation.success) {
        return json(res, errorResponse(validation.error), 400);
      }
      const params = validation.data;
      const { runPDCSocialContent } = await import(
        "./agents/pdc/social-content.js"
      );
      const result = await runPDCSocialContent(params);
      const summary = `Generated ${result.posts?.length || 0} PDC social posts${params.topic ? ` about "${params.topic}"` : ""}.`;
      return json(res, successResponse(summary, result));
    }

    // STS Social/Content Agent
    if (url === "/trigger/content/sts" && method === "POST") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }
      const body = await parseBody(req);
      const validation = validateInput(STSContentInputSchema, body);
      if (!validation.success) {
        return json(res, errorResponse(validation.error), 400);
      }
      const params = validation.data;
      const { runSTSSocialContent } = await import(
        "./agents/sts/social-content.js"
      );
      const result = await runSTSSocialContent(params);
      const summary = `Generated ${result.posts?.length || 0} STS social posts${params.topic ? ` about "${params.topic}"` : ""}.`;
      return json(res, successResponse(summary, result));
    }

    // ==================== n8n HELPER ENDPOINTS ====================

    // STS: Get prospects for profile warming
    if (url === "/api/sts/prospects/to-warm" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");
        const { checkDailyLimit } = await import("./shared/linkedin-limits.js");

        const limit = checkDailyLimit("profile_visit", "sts");
        if (!(await limit).allowed) {
          return json(res, errorResponse("Daily profile visit limit reached"), 429);
        }

        const { data, error } = await supabase
          .from("sts_outbound_prospects")
          .select("*")
          .in("outreach_status", ["not_contacted", "warming"])
          .gte("fit_score", 6)
          .order("fit_score", { ascending: false })
          .limit(40);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} prospects for warming`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // STS: Get prospects for connection requests
    if (url === "/api/sts/prospects/to-connect" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");
        const { checkDailyLimit } = await import("./shared/linkedin-limits.js");

        const limit = await checkDailyLimit("connection_request", "sts");
        if (!limit.allowed) {
          return json(res, errorResponse("Daily connection request limit reached"), 429);
        }

        // Get prospects visited 2+ days ago but not yet connected
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const { data, error } = await supabase
          .from("sts_outbound_prospects")
          .select("*")
          .eq("outreach_status", "warming")
          .lt("last_visited", twoDaysAgo.toISOString())
          .gte("fit_score", 6)
          .order("fit_score", { ascending: false })
          .limit(20);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} prospects for connection`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // STS: Get prospects for messaging
    if (url === "/api/sts/prospects/to-message" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");
        const { checkDailyLimit } = await import("./shared/linkedin-limits.js");

        const limit = await checkDailyLimit("message", "sts");
        if (!limit.allowed) {
          return json(res, errorResponse("Daily message limit reached"), 429);
        }

        const { data, error } = await supabase
          .from("sts_outbound_prospects")
          .select("*")
          .in("outreach_status", ["connected"])
          .gte("fit_score", 7)
          .order("fit_score", { ascending: false })
          .limit(10);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} prospects for messaging`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // STS: Get outreach queue
    if (url === "/api/sts/outreach/queue" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { getQueuedOutreach } = await import("./shared/outreach-queue.js");
        const queued = await getQueuedOutreach("sts", { status: "queued", limit: 50 });

        return json(res, successResponse(`Found ${queued.length} queued messages`, queued));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Get partners for profile warming
    if (url === "/api/pdc/partners/to-warm" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");
        const { checkDailyLimit } = await import("./shared/linkedin-limits.js");

        const limit = await checkDailyLimit("profile_visit", "pdc");
        if (!limit.allowed) {
          return json(res, errorResponse("Daily profile visit limit reached"), 429);
        }

        const { data, error } = await supabase
          .from("pdc_partner_prospects")
          .select("*")
          .in("status", ["identified", "warming"])
          .gte("alignment_score", 6)
          .order("alignment_score", { ascending: false })
          .limit(30);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} partners for warming`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Get partners for contact
    if (url === "/api/pdc/partners/to-contact" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");
        const { checkDailyLimit } = await import("./shared/linkedin-limits.js");

        const limit = await checkDailyLimit("connection_request", "pdc");
        if (!limit.allowed) {
          return json(res, errorResponse("Daily connection request limit reached"), 429);
        }

        const { data, error } = await supabase
          .from("pdc_partner_prospects")
          .select("*")
          .eq("status", "warming")
          .gte("alignment_score", 6)
          .order("alignment_score", { ascending: false })
          .limit(10);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} partners for contact`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Get schools for contact
    if (url === "/api/pdc/schools/to-contact" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { supabase } = await import("./shared/supabase.js");

        const { data, error } = await supabase
          .from("pdc_partner_prospects")
          .select("*")
          .eq("partner_type", "school")
          .in("status", ["identified", "warming"])
          .gte("fit_score", 5)
          .order("fit_score", { ascending: false })
          .limit(15);

        if (error) throw error;

        return json(res, successResponse(`Found ${data?.length || 0} schools for contact`, data || []));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Get outreach queue
    if (url === "/api/pdc/outreach/queue" && method === "GET") {
      if (!authenticate(req)) {
        return json(res, errorResponse("Unauthorized"), 401);
      }

      try {
        const { getQueuedOutreach } = await import("./shared/outreach-queue.js");
        const queued = await getQueuedOutreach("pdc", { status: "queued", limit: 50 });

        return json(res, successResponse(`Found ${queued.length} queued messages`, queued));
      } catch (error) {
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // ==================== n8n WEBHOOK ENDPOINTS ====================

    // Webhook authentication helper
    const authenticateWebhook = (req: IncomingMessage): boolean => {
      const webhookSecret = req.headers['x-webhook-secret'];
      return webhookSecret === process.env.N8N_WEBHOOK_SECRET;
    };

    // Log webhook to database
    const logWebhook = async (
      webhookName: string,
      payload: any,
      processed: boolean,
      result?: any,
      error?: string
    ) => {
      const { supabase } = await import("./shared/supabase.js");
      await supabase.from("n8n_webhook_logs").insert({
        webhook_name: webhookName,
        payload,
        processed,
        result,
        error,
        processed_at: processed ? new Date().toISOString() : null,
      });
    };

    // STS: Inbound Lead Webhook
    if (url === "/webhook/sts/inbound" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { supabase } = await import("./shared/supabase.js");

        // Save to inbound_leads table
        const { data: lead, error } = await supabase
          .from("inbound_leads")
          .insert({
            context: "sts",
            source: body.source || "website",
            name: body.name,
            email: body.email,
            phone: body.phone,
            company: body.company,
            message: body.message,
            lead_score: body.lead_score || 5,
            metadata: body.metadata,
          })
          .select()
          .single();

        if (error) throw error;

        await logWebhook("sts/inbound", body, true, lead);
        return json(res, successResponse("Inbound lead captured", lead));
      } catch (error) {
        await logWebhook("sts/inbound", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // STS: Trigger Event Webhook
    if (url === "/webhook/sts/trigger-event" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        // Process trigger event (funding, hiring, news, etc.)
        const { supabase } = await import("./shared/supabase.js");

        // Update or create prospect with trigger event
        const { data: prospect, error } = await supabase
          .from("sts_outbound_prospects")
          .upsert({
            company_name: body.company_name,
            trigger_events: body.events,
            fit_score: body.fit_score,
            metadata: body.metadata,
          })
          .select()
          .single();

        if (error) throw error;

        await logWebhook("sts/trigger-event", body, true, prospect);
        return json(res, successResponse("Trigger event processed", prospect));
      } catch (error) {
        await logWebhook("sts/trigger-event", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // STS: LinkedIn Response Webhook
    if (url === "/webhook/sts/linkedin-response" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { markOutreachResponded } = await import("./shared/outreach-queue.js");

        if (body.outreach_id) {
          await markOutreachResponded(body.outreach_id, body.response_text);
        }

        await logWebhook("sts/linkedin-response", body, true);
        return json(res, successResponse("Response tracked", { received: true }));
      } catch (error) {
        await logWebhook("sts/linkedin-response", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Inbound Lead Webhook
    if (url === "/webhook/pdc/inbound" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { supabase } = await import("./shared/supabase.js");

        const { data: lead, error } = await supabase
          .from("inbound_leads")
          .insert({
            context: "pdc",
            source: body.source || "website",
            name: body.name,
            email: body.email,
            phone: body.phone,
            company: body.company,
            message: body.message,
            lead_score: body.lead_score || 5,
            metadata: body.metadata,
          })
          .select()
          .single();

        if (error) throw error;

        await logWebhook("pdc/inbound", body, true, lead);
        return json(res, successResponse("Inbound lead captured", lead));
      } catch (error) {
        await logWebhook("pdc/inbound", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Instagram DM Webhook
    if (url === "/webhook/pdc/instagram" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { supabase } = await import("./shared/supabase.js");

        const { data: lead, error } = await supabase
          .from("inbound_leads")
          .insert({
            context: "pdc",
            source: "instagram",
            name: body.sender_name || "Instagram User",
            message: body.message_text,
            metadata: {
              instagram_id: body.sender_id,
              dm_id: body.message_id,
            },
          })
          .select()
          .single();

        if (error) throw error;

        await logWebhook("pdc/instagram", body, true, lead);
        return json(res, successResponse("Instagram DM captured", lead));
      } catch (error) {
        await logWebhook("pdc/instagram", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: Facebook Message Webhook
    if (url === "/webhook/pdc/facebook" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { supabase } = await import("./shared/supabase.js");

        const { data: lead, error } = await supabase
          .from("inbound_leads")
          .insert({
            context: "pdc",
            source: "facebook",
            name: body.sender_name || "Facebook User",
            message: body.message_text,
            metadata: {
              facebook_id: body.sender_id,
              message_id: body.message_id,
            },
          })
          .select()
          .single();

        if (error) throw error;

        await logWebhook("pdc/facebook", body, true, lead);
        return json(res, successResponse("Facebook message captured", lead));
      } catch (error) {
        await logWebhook("pdc/facebook", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // PDC: LinkedIn Response Webhook
    if (url === "/webhook/pdc/linkedin-response" && method === "POST") {
      if (!authenticateWebhook(req)) {
        return json(res, errorResponse("Unauthorized webhook"), 401);
      }
      const body = await parseBody(req);

      try {
        const { markOutreachResponded } = await import("./shared/outreach-queue.js");

        if (body.outreach_id) {
          await markOutreachResponded(body.outreach_id, body.response_text);
        }

        await logWebhook("pdc/linkedin-response", body, true);
        return json(res, successResponse("Response tracked", { received: true }));
      } catch (error) {
        await logWebhook("pdc/linkedin-response", body, false, null, error instanceof Error ? error.message : "Unknown error");
        return json(res, errorResponse(error instanceof Error ? error.message : "Unknown error"), 500);
      }
    }

    // 404 - Not found
    return json(
      res,
      {
        error: "Not found",
        message: `Route ${method} ${url} not found`,
        hint: "Try GET /api/info for available endpoints",
      },
      404
    );
  } catch (error) {
    logger.error({ error, method, url }, "Request error");
    return json(
      res,
      errorResponse(error instanceof Error ? error.message : "Unknown error"),
      500
    );
  }
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  logger.info("╔════════════════════════════════════════════════╗");
  logger.info("║   Eric's AI Agent System                       ║");
  logger.info("╚════════════════════════════════════════════════╝");
  logger.info("");
  logger.info({ port: PORT }, `Server running on http://localhost:${PORT}`);
  logger.info("");
  logger.info("Available endpoints:");
  logger.info("  GET  /health                       - Health check");
  logger.info("  GET  /api/info                     - API information");
  logger.info("  POST /trigger/research/personal    - Personal lead research");
  logger.info("  POST /trigger/research/pdc         - PDC lead research");
  logger.info("  POST /trigger/research/sts         - STS lead research");
  logger.info("  POST /trigger/content/pdc          - PDC content generation");
  logger.info("  POST /trigger/content/sts          - STS content generation");
  logger.info("");
  logger.info("n8n Integration endpoints:");
  logger.info("  GET  /api/sts/prospects/to-warm    - STS prospects for warming");
  logger.info("  GET  /api/sts/prospects/to-connect - STS prospects for connection");
  logger.info("  GET  /api/pdc/partners/to-warm     - PDC partners for warming");
  logger.info("  POST /webhook/sts/inbound          - STS inbound lead webhook");
  logger.info("  POST /webhook/pdc/inbound          - PDC inbound lead webhook");
  logger.info("");
  logger.info("Press Ctrl+C to stop");
  logger.info("─".repeat(50));
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
