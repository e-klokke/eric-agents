/**
 * PDC Lead Research Agent
 *
 * Researches for Players Development Club:
 * - Market opportunities (schools, wealth managers, NIL companies)
 * - Athlete/parent leads
 * - Collaboration partners (wealth management, NIL, financial advisors)
 *
 * Triggered: manually via CLI or HTTP
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { complete, extractJSON } from "../../shared/llm.js";
import { storeMemory, searchMemories } from "../../shared/memory.js";
import { webSearch, formatSearchResults } from "../../shared/web-search.js";

// Types
export interface PDCLeadInput {
  researchType: "market" | "lead" | "collaboration";

  // Market research
  targetArea?: string;
  targetSegment?: string;

  // Lead research
  athleteName?: string;
  parentName?: string;
  sport?: string;
  school?: string;
  source?: string;

  // Collaboration research
  organizationName?: string;
  contactName?: string;
  collaborationType?: string;
}

export interface PDCLeadReport {
  researchType: string;
  marketInsights?: unknown;
  leadProfile?: unknown;
  collaborationProfile?: unknown;
  outreachStrategy: {
    approach: string;
    talkingPoints: string[];
    valueProposition: string;
    suggestedMessage: string;
  };
  score: {
    opportunityScore: number;
    urgencyScore: number;
    accessibilityScore: number;
    overall: number;
  };
}

// Note: webSearch is now imported from shared/web-search.ts

// Build research prompt based on type
function buildResearchPrompt(
  input: PDCLeadInput,
  searchResults: string,
  priorMemories: Array<{ content: string; metadata?: Record<string, unknown> }>
): string {
  const baseContext = `You are researching for Players Development Club (PDC).

PDC OVERVIEW:
- Athlete development coaching focused on mental game and character
- Founded by Eric (10 years pro basketball in Europe, 5 Championships, 8 MVP awards)
- Programs: Bridge Program (26-week curriculum), Individual Coaching
- Target: High school & college athletes (basketball primary)
- Geography: Tampa Bay + remote

SEARCH RESULTS:
${searchResults}

${priorMemories.length > 0 ? `PRIOR KNOWLEDGE:\n${priorMemories.map(m => m.content).join("\n\n")}` : ""}
`;

  if (input.researchType === "market") {
    return `${baseContext}

MARKET RESEARCH TASK: ${input.targetArea || "General"} - ${input.targetSegment || "All segments"}

Focus on:
1. Wealth management firms serving sports families
2. NIL collectives, agencies, platforms
3. Financial advisors with athlete specialization
4. High schools/colleges with strong athletic programs
5. Family financial planners (scholarship/NIL focus)

Return JSON with this structure:
{
  "marketInsights": {
    "wealthManagers": [{"firmName": "", "focus": "", "sportsFocus": true/false, "partnerPotential": 1-10}],
    "nilCompanies": [{"name": "", "type": "collective|agency|platform", "partnerPotential": 1-10}],
    "schools": [{"name": "", "athleteCount": "", "opportunityScore": 1-10}],
    "marketGaps": ["unmet need 1"],
    "recommendations": ["action 1"]
  }
}`;
  }

  if (input.researchType === "lead") {
    return `${baseContext}

LEAD RESEARCH: ${input.athleteName || "Athlete"} - ${input.sport || "Sport"}

Research the athlete/family for qualification and fit with PDC programs.

Return JSON:
{
  "leadProfile": {
    "athlete": {"name": "", "sport": "", "level": "", "nilStatus": ""},
    "parent": {"name": "", "involvement": "", "financialSophistication": ""},
    "developmentNeeds": ["need 1"],
    "programFit": {"bridgeProgram": 1-10, "reasoning": ""},
    "qualificationScore": 1-10,
    "referralPotential": {"toWealthManagement": true/false, "reasoning": ""}
  }
}`;
  }

  // Collaboration
  return `${baseContext}

COLLABORATION RESEARCH: ${input.organizationName || "Organization"}
Type: ${input.collaborationType || "General"}

Focus on partnership opportunities with wealth managers, NIL companies, financial advisors.

PDC VALUE PROPOSITIONS:
- To Wealth Managers: "Your clients' kids need development coaching, not just financial planning"
- To NIL Companies: "NIL success requires the right mindset, not just deals"
- To Advisors: "Holistic athlete development referral network"

Return JSON:
{
  "collaborationProfile": {
    "organization": {"name": "", "type": "", "clientBase": ""},
    "contact": {"name": "", "title": "", "background": ""},
    "alignmentScore": 1-10,
    "partnershipModels": [{"type": "referral|co-marketing|joint-program", "description": "", "potential": "high|medium|low"}],
    "mutualBenefits": {"forPDC": ["benefit 1"], "forPartner": ["benefit 1"]}
  }
}`;
}

// Main execution
export async function runPDCLeadResearch(
  input: PDCLeadInput
): Promise<PDCLeadReport> {
  const runId = await logAgentRun({
    agentName: "pdc-lead-research",
    context: "pdc",
    triggerType: "manual",
    inputData: input,
  });

  try {
    console.log("🚀 Starting PDC Lead Research...\n");
    console.log(`📋 Type: ${input.researchType}`);
    console.log("");

    // Check prior knowledge
    console.log("🔍 Checking existing memories...");
    const searchTerm = input.organizationName || input.athleteName || input.targetArea || "";
    const priorMemories = await searchMemories({
      query: searchTerm,
      context: "pdc",
      limit: 3,
    });

    // Gather web research
    console.log("🌐 Gathering information...");
    const searchResponse = await webSearch(searchTerm, {
      maxResults: 5,
      searchDepth: "basic",
      includeAnswer: true,
    });
    const searchResults = formatSearchResults(searchResponse);

    // Analyze with Claude
    console.log("🤔 Analyzing research...");
    const prompt = buildResearchPrompt(input, searchResults, priorMemories);
    const analysis = await complete({
      model: "SONNET",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2500,
      temperature: 0.7,
    });

    // Parse results
    let report: PDCLeadReport;
    try {
      const parsed = extractJSON(analysis.content);
      report = {
        researchType: input.researchType,
        ...parsed,
        outreachStrategy: {
          approach: "Direct, authentic, focused on athlete development",
          talkingPoints: ["Eric's 10 years pro experience", "Character development focus", "Transition preparation"],
          valueProposition: "Comprehensive athlete development beyond just skills",
          suggestedMessage: "Personalized outreach based on research",
        },
        score: {
          opportunityScore: 7,
          urgencyScore: 5,
          accessibilityScore: 6,
          overall: 6,
        },
      };
    } catch (error) {
      throw new Error("Failed to parse research results");
    }

    // Store to memory and database
    console.log("💾 Storing research...");
    await storeMemory({
      context: "pdc",
      category: "entity",
      content: `${input.researchType} research: ${JSON.stringify(report).substring(0, 500)}`,
      metadata: { type: input.researchType, ...input },
      source: "pdc-lead-research",
    });

    // Store to pdc_leads table
    const { error: dbError } = await supabase.from("pdc_leads").insert({
      lead_type: input.researchType,
      name: input.organizationName || input.athleteName || input.targetArea || "Unknown",
      organization: input.organizationName || input.school,
      research_data: report,
      score: report.score.overall,
      status: "new",
    });

    if (dbError) console.warn("⚠️  Database insert warning:", dbError.message);

    await completeAgentRun(runId, {
      status: "completed",
      outputData: report,
    });

    // Display output
    console.log("\n" + "═".repeat(70));
    console.log("PDC LEAD RESEARCH REPORT");
    console.log("═".repeat(70));
    console.log(`\n📊 Research Type: ${input.researchType.toUpperCase()}`);
    console.log(`⭐ Overall Score: ${report.score.overall}/10\n`);

    if (report.marketInsights) {
      console.log("🎯 MARKET INSIGHTS");
      const insights = report.marketInsights as any; // Display-only type assertion
      if (insights.wealthManagers) {
        console.log(`   Wealth Managers: ${insights.wealthManagers.length} found`);
      }
      if (insights.nilCompanies) {
        console.log(`   NIL Companies: ${insights.nilCompanies.length} found`);
      }
    }

    if (report.leadProfile) {
      console.log("👤 LEAD PROFILE");
      const profile = report.leadProfile as any; // Display-only type assertion
      console.log(`   Athlete: ${profile.athlete?.name || "Unknown"}`);
      console.log(`   Program Fit: ${profile.programFit?.bridgeProgram || 0}/10`);
    }

    if (report.collaborationProfile) {
      console.log("🤝 COLLABORATION OPPORTUNITY");
      const collab = report.collaborationProfile as any; // Display-only type assertion
      console.log(`   Organization: ${collab.organization?.name || "Unknown"}`);
      console.log(`   Alignment: ${collab.alignmentScore || 0}/10`);
    }

    console.log("\n💡 OUTREACH STRATEGY");
    console.log(`   ${report.outreachStrategy.valueProposition}`);
    console.log("\n" + "═".repeat(70));

    return report;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await completeAgentRun(runId, { status: "failed", errorMessage });
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run agent:research:pdc <type> [params...]");
    console.log("");
    console.log("Types:");
    console.log("  market <area> <segment>          - Research market opportunities");
    console.log("  lead <athlete> <sport> <school>  - Research athlete/parent lead");
    console.log("  collaboration <org> <type>       - Research partnership opportunity");
    console.log("");
    console.log("Examples:");
    console.log('  npm run agent:research:pdc market "Tampa Bay" "wealth_management"');
    console.log('  npm run agent:research:pdc lead "Marcus Johnson" "Basketball" "Tampa Prep"');
    console.log('  npm run agent:research:pdc collaboration "Morgan Stanley" "wealth_management"');
    process.exit(1);
  }

  const type = args[0] as "market" | "lead" | "collaboration";
  let input: PDCLeadInput = { researchType: type };

  if (type === "market") {
    input.targetArea = args[1];
    input.targetSegment = args[2];
  } else if (type === "lead") {
    input.athleteName = args[1];
    input.sport = args[2];
    input.school = args[3];
  } else if (type === "collaboration") {
    input.organizationName = args[1];
    input.collaborationType = args[2];
  }

  runPDCLeadResearch(input)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Agent failed:", error);
      process.exit(1);
    });
}
