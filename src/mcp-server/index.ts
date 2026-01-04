#!/usr/bin/env node
/**
 * Eric's Agents MCP Server
 *
 * Exposes all 9 agents as Claude tools for natural language interaction
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Import all agents
import { runPersonalLeadResearch } from "../agents/personal/lead-research.js";
import { runPDCLeadResearch } from "../agents/pdc/lead-research.js";
import { runSTSLeadResearch } from "../agents/sts/lead-research.js";
import { runPDCSocialContent } from "../agents/pdc/social-content.js";
import { runSTSSocialContent } from "../agents/sts/social-content.js";
import { runPDCSalesNurture } from "../agents/pdc/sales-nurture.js";
import { runSTSSalesNurture } from "../agents/sts/sales-nurture.js";
import { runPDCLeadGeneration } from "../agents/pdc/lead-generation.js";
import { runSTSLeadGeneration } from "../agents/sts/lead-generation.js";

const server = new Server(
  {
    name: "eric-agents",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all agent tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ========== RESEARCH AGENTS ==========
    {
      name: "research_person",
      description: "🔍 PERSONAL RESEARCH: Research someone before a meeting, call, or networking. Returns background, common ground with Eric, conversation starters, and warnings.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Person's full name"
          },
          company: {
            type: "string",
            description: "Their current company (optional)"
          },
          context: {
            type: "string",
            description: "Why researching them - e.g., 'Meeting next week about AI strategy', 'Conference introduction'"
          },
          depth: {
            type: "string",
            enum: ["quick", "standard", "deep"],
            description: "Research thoroughness (default: standard)"
          }
        },
        required: ["name"],
      },
    },
    {
      name: "research_athlete",
      description: "🏀 PDC RESEARCH: Research an athlete for Players Development Club. Returns qualification score, program fit, outreach strategy. Use for potential clients or collaboration opportunities.",
      inputSchema: {
        type: "object",
        properties: {
          athleteName: {
            type: "string",
            description: "Athlete's full name"
          },
          sport: {
            type: "string",
            description: "Sport they play (Basketball, Football, Soccer, etc.)"
          },
          researchType: {
            type: "string",
            enum: ["lead", "collaboration"],
            description: "lead = potential client, collaboration = partnership/podcast guest"
          },
          context: {
            type: "string",
            description: "Additional context (optional)"
          }
        },
        required: ["athleteName", "sport", "researchType"],
      },
    },
    {
      name: "research_company",
      description: "🏢 STS RESEARCH: Research a company for Sino Technology Solutions. Returns tech stack, partner opportunities (Cisco/Dell/Oracle/Lenovo/HP), deal sizing, outreach strategy.",
      inputSchema: {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description: "Company name"
          },
          website: {
            type: "string",
            description: "Company website (optional but recommended)"
          },
          contactName: {
            type: "string",
            description: "Decision maker name (optional)"
          },
          contactTitle: {
            type: "string",
            description: "Decision maker title like CTO, CIO (optional)"
          },
          knownNeeds: {
            type: "string",
            description: "Any known technology needs (optional)"
          }
        },
        required: ["companyName"],
      },
    },

    // ========== CONTENT GENERATION AGENTS ==========
    {
      name: "generate_pdc_content",
      description: "✍️ PDC CONTENT: Generate social media posts for Players Development Club. Creates authentic athlete development content for Instagram, LinkedIn, X, Facebook. Saves drafts to database.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Content topic - e.g., 'mental toughness', 'pre-game routines', 'NIL deals for parents'"
          },
          pillar: {
            type: "string",
            enum: ["hidden_game", "character", "transition", "eric_journey", "parent_education"],
            description: "Content pillar: hidden_game (mental game), character (life skills), transition (level changes), eric_journey (Eric's pro experience), parent_education (guidance for parents)"
          },
          targetAudience: {
            type: "string",
            enum: ["athletes", "parents", "coaches", "general"],
            description: "Primary audience"
          }
        },
        required: ["topic"],
      },
    },
    {
      name: "generate_sts_content",
      description: "💼 STS CONTENT: Generate social media posts for Sino Technology Solutions. Creates technical thought leadership for LinkedIn, X, Facebook. Saves drafts to database.",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Content topic - e.g., 'cloud security', 'hybrid infrastructure', 'Zero Trust'"
          },
          pillar: {
            type: "string",
            enum: ["tech_trends", "partner_spotlight", "case_studies", "eric_expertise", "company_culture"],
            description: "Content pillar"
          },
          partnerFocus: {
            type: "string",
            enum: ["cisco", "dell", "oracle", "lenovo", "hp"],
            description: "Partner to highlight (optional)"
          }
        },
        required: ["topic"],
      },
    },

    // ========== SALES & NURTURE AGENTS ==========
    {
      name: "pdc_check_followups",
      description: "📅 PDC SALES: Check which PDC athletes need follow-up. Returns list of consultations, enrollments, or inactive athletes requiring attention.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "pdc_enrollment_digest",
      description: "📊 PDC SALES: Get PDC enrollment summary - inquiries, consultations, active athletes, monthly enrollments, action items.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "sts_check_followups",
      description: "📅 STS SALES: Check which STS companies need follow-up. Returns deals requiring attention by stage.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "sts_pipeline_digest",
      description: "📊 STS SALES: Get STS pipeline summary - total deals, stage breakdown, recent activity.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },

    // ========== LEAD GENERATION AGENTS ==========
    {
      name: "pdc_lead_digest",
      description: "📈 PDC LEAD GEN: Get summary of recent PDC leads - inbound inquiries, school prospects, recommended actions.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "sts_lead_digest",
      description: "📈 STS LEAD GEN: Get summary of recent STS leads - inbound leads, outbound prospects, triggers detected.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "sts_build_prospect_list",
      description: "🎯 STS LEAD GEN: Build targeted list of companies matching criteria. Returns scored prospects with fit analysis.",
      inputSchema: {
        type: "object",
        properties: {
          criteria: {
            type: "object",
            description: "Prospect criteria as JSON object with industry, companySize, location arrays",
            properties: {
              industry: {
                type: "array",
                items: { type: "string" },
                description: "Industries to target - e.g., ['Healthcare', 'Education', 'Financial Services']"
              },
              companySize: {
                type: "string",
                description: "Employee range - e.g., '100-1000 employees'"
              },
              location: {
                type: "array",
                items: { type: "string" },
                description: "Geographic locations - e.g., ['Tampa, FL', 'Orlando, FL']"
              }
            }
          }
        },
        required: ["criteria"],
      },
    },
  ],
}));

// Format agent output for display
function formatAgentOutput(result: any, agentType: string): string {
  let output = `\n${'='.repeat(70)}\n`;

  switch (agentType) {
    case 'personal':
      output += `🔍 PERSONAL RESEARCH: ${result.person?.name || 'Unknown'}\n`;
      output += `${'='.repeat(70)}\n\n`;
      output += `**Role:** ${result.person?.currentRole} at ${result.person?.company}\n\n`;
      output += `**Background:**\n${result.person?.background}\n\n`;
      if (result.commonGround?.length > 0) {
        output += `**Common Ground with Eric:**\n${result.commonGround.map((g: string) => `• ${g}`).join('\n')}\n\n`;
      }
      if (result.conversationStarters?.length > 0) {
        output += `**Conversation Starters:**\n${result.conversationStarters.map((s: string, i: number) => `${i+1}. ${s}`).join('\n')}\n\n`;
      }
      if (result.warnings?.length > 0) {
        output += `⚠️ **Warnings:**\n${result.warnings.map((w: string) => `• ${w}`).join('\n')}\n\n`;
      }
      output += `**Suggested Approach:** ${result.suggestedApproach}\n`;
      break;

    case 'pdc_research':
      output += `🏀 PDC RESEARCH: ${result.athleteName || 'Athlete'}\n`;
      output += `${'='.repeat(70)}\n\n`;
      output += `**Type:** ${result.researchType}\n`;
      output += `**Score:** ${result.score}/10\n`;
      output += `**Program Fit:** ${result.programFit}/10\n\n`;
      output += `**Recommendation:** ${result.recommendation}\n`;
      break;

    case 'sts_research':
      output += `🏢 STS RESEARCH: ${result.company?.name || 'Company'}\n`;
      output += `${'='.repeat(70)}\n\n`;
      output += `**Industry:** ${result.company?.industry} | ${result.company?.employeeCount} employees\n`;
      output += `**Score:** ${result.score?.overall}/10 | Deal Size: ${result.score?.dealSize}\n\n`;
      if (result.techStack?.gaps?.length > 0) {
        output += `**Tech Opportunities:**\n${result.techStack.gaps.map((g: string) => `• ${g}`).join('\n')}\n\n`;
      }
      output += `**Next Step:** ${result.outreachStrategy?.suggestedNextStep}\n`;
      break;

    case 'pdc_content':
      output += `✍️ PDC CONTENT GENERATED\n`;
      output += `${'='.repeat(70)}\n\n`;
      result.posts?.forEach((post: any) => {
        output += `**${post.platform.toUpperCase()}**\n`;
        output += `${post.postText}\n`;
        output += `Hashtags: ${post.hashtags.join(' ')}\n\n`;
      });
      output += `✅ Saved to social_queue table as drafts\n`;
      break;

    case 'sts_content':
      output += `💼 STS CONTENT GENERATED\n`;
      output += `${'='.repeat(70)}\n\n`;
      result.posts?.forEach((post: any) => {
        output += `**${post.platform.toUpperCase()}**\n`;
        output += `${post.postText}\n`;
        output += `Hashtags: ${post.hashtags.join(' ')}\n\n`;
      });
      output += `✅ Saved to social_queue table as drafts\n`;
      break;

    default:
      output += JSON.stringify(result, null, 2);
  }

  output += `\n${'='.repeat(70)}\n`;
  return output;
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    let agentType = '';

    switch (name) {
      case "research_person":
        agentType = 'personal';
        result = await runPersonalLeadResearch(args as any);
        break;

      case "research_athlete":
        agentType = 'pdc_research';
        result = await runPDCLeadResearch(args as any);
        break;

      case "research_company":
        agentType = 'sts_research';
        result = await runSTSLeadResearch(args as any);
        break;

      case "generate_pdc_content":
        agentType = 'pdc_content';
        result = await runPDCSocialContent({
          action: "generate",
          ...args as any,
        });
        break;

      case "generate_sts_content":
        agentType = 'sts_content';
        result = await runSTSSocialContent({
          action: "generate",
          ...args as any,
        });
        break;

      case "pdc_check_followups":
        result = await runPDCSalesNurture({ action: "check_followups" });
        break;

      case "pdc_enrollment_digest":
        result = await runPDCSalesNurture({ action: "enrollment_digest" });
        break;

      case "sts_check_followups":
        result = await runSTSSalesNurture({ action: "check_followups" });
        break;

      case "sts_pipeline_digest":
        result = await runSTSSalesNurture({ action: "pipeline_digest" });
        break;

      case "pdc_lead_digest":
        result = await runPDCLeadGeneration({ action: "lead_digest" });
        break;

      case "sts_lead_digest":
        result = await runSTSLeadGeneration({ action: "lead_digest" });
        break;

      case "sts_build_prospect_list":
        result = await runSTSLeadGeneration({
          action: "build_list",
          ...(args as any)
        });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Format output based on agent type
    const formattedOutput = agentType
      ? formatAgentOutput(result, agentType)
      : JSON.stringify(result, null, 2);

    return {
      content: [
        {
          type: "text",
          text: formattedOutput,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Eric's Agents MCP Server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
