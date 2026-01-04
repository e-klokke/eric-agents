/**
 * Personal Lead Research Agent
 *
 * Researches people before meetings, calls, and networking:
 * - Gathers background information
 * - Finds common ground with Eric
 * - Generates conversation starters
 * - Identifies potential warnings
 *
 * Triggered: manually via CLI or HTTP
 */

import "dotenv/config";
import { logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { complete, extractJSON } from "../../shared/llm.js";
import { storeMemory, searchMemories } from "../../shared/memory.js";
import { webSearch, formatSearchResults } from "../../shared/web-search.js";

// Types
export interface PersonalLeadInput {
  name: string;
  company?: string;
  context?: string;
  linkedInUrl?: string;
  depth?: "quick" | "standard" | "deep";
}

export interface PersonalLeadReport {
  person: {
    name: string;
    currentRole: string;
    company: string;
    background: string;
    careerHistory: string[];
    education: string[];
    interests: string[];
    recentActivity: string[];
  };
  commonGround: string[];
  conversationStarters: string[];
  warnings: string[];
  suggestedApproach: string;
  researchSources: string[];
}

// Note: webSearch is now imported from shared/web-search.ts

// Helper: Build research prompt
function buildResearchPrompt(
  input: PersonalLeadInput,
  searchResults: string,
  priorMemories: Array<{ content: string; metadata?: Record<string, unknown> }>
): string {
  return `You are researching ${input.name}${input.company ? ` from ${input.company}` : ""} for Eric.

CONTEXT: ${input.context || "General networking/meeting preparation"}

ERIC'S BACKGROUND (for finding common ground):
- Former professional basketball player (10 years in Europe: Denmark, Portugal, Estonia, Norway, Germany)
- 5 Championships, 8 MVP awards
- CEO of Sino Technology Solutions (STS) - enterprise tech consulting
- Founder of Players Development Club (PDC) - athlete development coaching
- Technical background: Duke Medical Center IT, CEH Master certification
- Based in Tampa, FL and Portugal

SEARCH RESULTS:
${searchResults}

${priorMemories.length > 0 ? `PRIOR KNOWLEDGE:\n${priorMemories.map(m => m.content).join("\n\n")}` : ""}

TASK: Create a comprehensive research report in JSON format with this exact structure:

{
  "person": {
    "name": "Full name",
    "currentRole": "Current title",
    "company": "Current company",
    "background": "2-3 sentence summary",
    "careerHistory": ["Notable previous role 1", "Notable previous role 2"],
    "education": ["Degree/School"],
    "interests": ["Interest 1", "Interest 2"],
    "recentActivity": ["Recent news/activity 1", "Recent news/activity 2"]
  },
  "commonGround": [
    "Specific connection with Eric (e.g., both worked in healthcare tech, both played basketball, both have Portugal connection)"
  ],
  "conversationStarters": [
    "Natural opener based on common ground",
    "Question about their recent work",
    "Comment about shared interest"
  ],
  "warnings": [
    "Things to avoid (if any)",
    "Sensitive topics (if any)"
  ],
  "suggestedApproach": "1-2 sentence recommendation on how Eric should approach this person"
}

Return ONLY valid JSON, no other text.`;
}

// Main execution
export async function runPersonalLeadResearch(
  input: PersonalLeadInput
): Promise<PersonalLeadReport> {
  const runId = await logAgentRun({
    agentName: "personal-lead-research",
    context: "personal",
    triggerType: "manual",
    inputData: input,
  });

  try {
    console.log("🚀 Starting Personal Lead Research...\n");
    console.log(`📋 Target: ${input.name}`);
    if (input.company) console.log(`🏢 Company: ${input.company}`);
    if (input.context) console.log(`📝 Context: ${input.context}`);
    console.log("");

    // Step 1: Check for prior knowledge
    console.log("🔍 Checking existing memories...");
    const priorMemories = await searchMemories({
      query: `${input.name} ${input.company || ""}`,
      context: "personal",
      category: "entity",
      limit: 3,
    });

    // Step 2: Gather web research
    console.log("🌐 Gathering information...");
    const searchQuery = `${input.name} ${input.company || ""} ${input.linkedInUrl ? "LinkedIn" : ""} professional background`;
    const searchResponse = await webSearch(searchQuery, {
      maxResults: 5,
      searchDepth: input.depth === "deep" ? "advanced" : "basic",
      includeAnswer: true,
    });
    const searchResults = formatSearchResults(searchResponse);

    // Step 3: Analyze with Claude
    console.log("🤔 Analyzing research...");
    const prompt = buildResearchPrompt(input, searchResults, priorMemories);
    const analysis = await complete({
      model: "SONNET",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      temperature: 0.7,
    });

    // Step 4: Parse results
    let report: PersonalLeadReport;
    try {
      const parsed = extractJSON(analysis.content);

      // Extract actual source URLs from search results
      const sources = searchResponse.results.map(r => r.url);
      if (priorMemories.length > 0) {
        sources.push("Prior knowledge from memory");
      }

      report = {
        ...parsed,
        researchSources: sources,
      };
    } catch (error) {
      throw new Error("Failed to parse research results");
    }

    // Step 5: Store to memory
    console.log("💾 Storing research to memory...");
    await storeMemory({
      context: "personal",
      category: "entity",
      content: `Research on ${input.name} (${input.company || "Unknown company"}): ${report.person.background}. Common ground: ${report.commonGround.join(", ")}`,
      metadata: {
        name: input.name,
        company: input.company,
        role: report.person.currentRole,
        researchDate: new Date().toISOString(),
      },
      source: "personal-lead-research",
    });

    // Step 6: Complete agent run
    await completeAgentRun(runId, {
      status: "completed",
      outputData: report,
    });

    // Display formatted output
    console.log("\n" + "═".repeat(70));
    console.log("PERSONAL LEAD RESEARCH REPORT");
    console.log("═".repeat(70));
    console.log("");
    console.log(`👤 ${report.person.name}`);
    console.log(`   ${report.person.currentRole} at ${report.person.company}`);
    console.log("");
    console.log("📖 BACKGROUND");
    console.log(`   ${report.person.background}`);
    console.log("");

    if (report.person.careerHistory.length > 0) {
      console.log("💼 CAREER HISTORY");
      report.person.careerHistory.forEach((role) => {
        console.log(`   • ${role}`);
      });
      console.log("");
    }

    if (report.person.education.length > 0) {
      console.log("🎓 EDUCATION");
      report.person.education.forEach((edu) => {
        console.log(`   • ${edu}`);
      });
      console.log("");
    }

    if (report.commonGround.length > 0) {
      console.log("🤝 COMMON GROUND");
      report.commonGround.forEach((ground) => {
        console.log(`   • ${ground}`);
      });
      console.log("");
    }

    console.log("💬 CONVERSATION STARTERS");
    report.conversationStarters.forEach((starter, i) => {
      console.log(`   ${i + 1}. ${starter}`);
    });
    console.log("");

    if (report.warnings.length > 0) {
      console.log("⚠️  WARNINGS");
      report.warnings.forEach((warning) => {
        console.log(`   • ${warning}`);
      });
      console.log("");
    }

    console.log("💡 SUGGESTED APPROACH");
    console.log(`   ${report.suggestedApproach}`);
    console.log("");
    console.log("═".repeat(70));

    return report;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await completeAgentRun(runId, {
      status: "failed",
      errorMessage,
    });
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run agent:research:personal <name> [company] [context]");
    console.log("");
    console.log("Examples:");
    console.log('  npm run agent:research:personal "Satya Nadella" "Microsoft" "Meeting next week"');
    console.log('  npm run agent:research:personal "Jane Smith" "Acme Corp"');
    console.log('  npm run agent:research:personal "John Doe"');
    process.exit(1);
  }

  const input: PersonalLeadInput = {
    name: args[0],
    company: args[1],
    context: args[2],
    depth: "standard",
  };

  runPersonalLeadResearch(input)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Agent failed:", error);
      process.exit(1);
    });
}
