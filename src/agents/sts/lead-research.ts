/**
 * STS Lead Research Agent
 *
 * Researches company prospects for Sino Technology Solutions:
 * - Company background and tech stack
 * - Decision-maker research
 * - Partner capability mapping (Cisco, Dell, Oracle, Lenovo, HP)
 * - Deal qualification and sizing
 *
 * Triggered: manually via CLI or HTTP
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { complete, extractJSON } from "../../shared/llm.js";
import { storeMemory, searchMemories } from "../../shared/memory.js";
import { webSearch, formatSearchResults } from "../../shared/web-search.js";

// Types
export interface STSLeadInput {
  companyName: string;
  website?: string;
  contactName?: string;
  contactTitle?: string;
  source?: string;
  knownNeeds?: string;
}

export interface STSLeadReport {
  company: {
    name: string;
    website: string;
    industry: string;
    description: string;
    employeeCount: string;
    revenue: string;
    locations: string[];
    recentNews: string[];
  };
  techStack: {
    known: string[];
    likely: string[];
    gaps: string[];
  };
  partnerOpportunities: {
    cisco: string[];
    dell: string[];
    oracle: string[];
    lenovo: string[];
    hp: string[];
  };
  contact: {
    name: string;
    title: string;
    background: string;
    decisionRole: string;
    commonGround: string[];
  };
  competitors: string[];
  painPoints: string[];
  opportunities: string[];
  score: {
    fit: number;
    urgency: number;
    accessibility: number;
    dealSize: string;
    overall: number;
  };
  outreachStrategy: {
    approach: string;
    talkingPoints: string[];
    valueProposition: string;
    objectionHandling: string[];
    suggestedNextStep: string;
  };
}

// Note: webSearch is now imported from shared/web-search.ts

// Build research prompt
function buildResearchPrompt(
  input: STSLeadInput,
  searchResults: string,
  priorMemories: Array<{ content: string; metadata?: Record<string, unknown> }>
): string {
  return `You are researching ${input.companyName} for Sino Technology Solutions (STS).

STS OVERVIEW:
- Enterprise technology consulting and government contracting
- 20+ years enterprise experience
- Multi-vendor expertise (not locked to one partner)
- Local Tampa presence with enterprise capability
- CEO Eric: Duke Medical Center IT background, CEH Master

PARTNER ECOSYSTEM:
- Cisco: Networking, security, collaboration, data center (Gold Partner)
- Dell: Servers, storage, data protection, VMware (Titanium Partner)
- Oracle: Database, cloud, enterprise apps (Gold Partner)
- Lenovo: Servers, HCI, client devices (Platinum Partner)
- HP/HPE: Servers, storage, Aruba networking, GreenLake (Platinum Partner)

TARGET CLIENTS:
- Mid-market to enterprise (100-5000 employees)
- Industries: Healthcare, education, financial services, government
- Typical deals: $50K - $500K
- Sales cycle: 2-6 months

ERIC'S BACKGROUND (for common ground):
- Duke Medical Center IT experience
- CEH Master certification (security expertise)
- 20+ years enterprise technology
- Former pro athlete (unique perspective)

${input.website ? `Company Website: ${input.website}` : ""}
${input.knownNeeds ? `Known Needs: ${input.knownNeeds}` : ""}

SEARCH RESULTS:
${searchResults}

${priorMemories.length > 0 ? `PRIOR KNOWLEDGE:\n${priorMemories.map(m => m.content).join("\n\n")}` : ""}

TASK: Create comprehensive research in JSON format:

{
  "company": {
    "name": "",
    "website": "",
    "industry": "",
    "description": "2-3 sentence overview",
    "employeeCount": "estimate",
    "revenue": "estimate",
    "locations": ["location 1"],
    "recentNews": ["news 1"]
  },
  "techStack": {
    "known": ["confirmed tech"],
    "likely": ["inferred from industry/size"],
    "gaps": ["probable needs based on industry"]
  },
  "partnerOpportunities": {
    "cisco": ["specific opportunity 1"],
    "dell": ["specific opportunity 1"],
    "oracle": ["specific opportunity 1"],
    "lenovo": ["specific opportunity 1"],
    "hp": ["specific opportunity 1"]
  },
  "contact": {
    "name": "${input.contactName || "Unknown"}",
    "title": "${input.contactTitle || "Unknown"}",
    "background": "brief background",
    "decisionRole": "Final|Influencer|Technical",
    "commonGround": ["connection with Eric"]
  },
  "competitors": ["likely competitor 1"],
  "painPoints": ["pain point 1"],
  "opportunities": ["opportunity 1"],
  "score": {
    "fit": 1-10,
    "urgency": 1-10,
    "accessibility": 1-10,
    "dealSize": "$XX,XXX - $XXX,XXX",
    "overall": 1-10
  },
  "outreachStrategy": {
    "approach": "recommended approach",
    "talkingPoints": ["point 1"],
    "valueProposition": "clear value prop",
    "objectionHandling": ["objection: response"],
    "suggestedNextStep": "specific next action"
  }
}

Return ONLY valid JSON.`;
}

// Main execution
export async function runSTSLeadResearch(
  input: STSLeadInput
): Promise<STSLeadReport> {
  const runId = await logAgentRun({
    agentName: "sts-lead-research",
    context: "sts",
    triggerType: "manual",
    inputData: input,
  });

  try {
    console.log("🚀 Starting STS Lead Research...\n");
    console.log(`📋 Company: ${input.companyName}`);
    if (input.website) console.log(`🌐 Website: ${input.website}`);
    if (input.contactName) console.log(`👤 Contact: ${input.contactName}`);
    console.log("");

    // Check prior knowledge
    console.log("🔍 Checking existing memories...");
    const priorMemories = await searchMemories({
      query: `${input.companyName} ${input.contactName || ""}`,
      context: "sts",
      category: "entity",
      limit: 3,
    });

    // Gather web research
    console.log("🌐 Gathering information...");
    const searchQuery = `${input.companyName} ${input.website || ""} company profile technology`;
    const searchResponse = await webSearch(searchQuery, {
      maxResults: 5,
      searchDepth: "advanced",
      includeAnswer: true,
    });
    const searchResults = formatSearchResults(searchResponse);

    // Analyze with Claude
    console.log("🤔 Analyzing research...");
    const prompt = buildResearchPrompt(input, searchResults, priorMemories);
    const analysis = await complete({
      model: "SONNET",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 3000,
      temperature: 0.7,
    });

    // Parse results
    let report: STSLeadReport;
    try {
      report = extractJSON(analysis.content);
    } catch (error) {
      throw new Error("Failed to parse research results");
    }

    // Store to memory and database
    console.log("💾 Storing research...");
    await storeMemory({
      context: "sts",
      category: "entity",
      content: `STS research on ${input.companyName}: ${report.company.description}. Overall score: ${report.score.overall}/10. Key opportunities: ${report.opportunities.join(", ")}`,
      metadata: {
        company: input.companyName,
        industry: report.company.industry,
        score: report.score.overall,
        dealSize: report.score.dealSize,
      },
      source: "sts-lead-research",
    });

    // Store to sts_companies table
    const { error: dbError } = await supabase.from("sts_companies").insert({
      name: input.companyName,
      website: input.website || report.company.website,
      industry: report.company.industry,
      contact_name: input.contactName || report.contact.name,
      contact_title: input.contactTitle || report.contact.title,
      research_data: report,
      score: report.score.overall,
      status: "new",
    });

    if (dbError) console.warn("⚠️  Database insert warning:", dbError.message);

    await completeAgentRun(runId, {
      status: "completed",
      outputData: report,
    });

    // Display formatted output
    console.log("\n" + "═".repeat(70));
    console.log("STS LEAD RESEARCH REPORT");
    console.log("═".repeat(70));
    console.log("");
    console.log(`🏢 ${report.company.name}`);
    console.log(`   ${report.company.industry} | ${report.company.employeeCount} employees`);
    console.log(`   ${report.company.description}`);
    console.log("");

    console.log("💻 TECHNOLOGY STACK");
    if (report.techStack.known.length > 0) {
      console.log(`   Known: ${report.techStack.known.join(", ")}`);
    }
    if (report.techStack.gaps.length > 0) {
      console.log(`   Gaps: ${report.techStack.gaps.join(", ")}`);
    }
    console.log("");

    console.log("🎯 PARTNER OPPORTUNITIES");
    const partners = ["cisco", "dell", "oracle", "lenovo", "hp"] as const;
    partners.forEach((partner) => {
      const opps = report.partnerOpportunities[partner];
      if (opps && opps.length > 0) {
        console.log(`   ${partner.toUpperCase()}: ${opps.join(", ")}`);
      }
    });
    console.log("");

    console.log("👤 DECISION-MAKER");
    console.log(`   ${report.contact.name} - ${report.contact.title}`);
    console.log(`   Role: ${report.contact.decisionRole}`);
    if (report.contact.commonGround.length > 0) {
      console.log(`   Common Ground: ${report.contact.commonGround.join(", ")}`);
    }
    console.log("");

    console.log("📊 QUALIFICATION SCORES");
    console.log(`   Fit: ${report.score.fit}/10`);
    console.log(`   Urgency: ${report.score.urgency}/10`);
    console.log(`   Accessibility: ${report.score.accessibility}/10`);
    console.log(`   Deal Size: ${report.score.dealSize}`);
    console.log(`   ⭐ Overall: ${report.score.overall}/10`);
    console.log("");

    console.log("💡 OUTREACH STRATEGY");
    console.log(`   ${report.outreachStrategy.valueProposition}`);
    console.log(`   Next Step: ${report.outreachStrategy.suggestedNextStep}`);
    console.log("");
    console.log("═".repeat(70));

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
    console.log("Usage: npm run agent:research:sts <company> [website] [contact] [title]");
    console.log("");
    console.log("Examples:");
    console.log('  npm run agent:research:sts "Acme Healthcare" "acme.com" "John Smith" "CTO"');
    console.log('  npm run agent:research:sts "TechCorp" "techcorp.com"');
    console.log('  npm run agent:research:sts "Big University"');
    process.exit(1);
  }

  const input: STSLeadInput = {
    companyName: args[0],
    website: args[1],
    contactName: args[2],
    contactTitle: args[3],
  };

  runSTSLeadResearch(input)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Agent failed:", error);
      process.exit(1);
    });
}
