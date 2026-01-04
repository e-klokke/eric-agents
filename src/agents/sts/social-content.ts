/**
 * STS Social/Content Agent
 *
 * Creates thought leadership and company content for Sino Technology Solutions:
 * - Repurposes industry news/articles into posts
 * - Generates original thought leadership content
 * - Partner spotlight content (Cisco, Dell, Oracle, Lenovo, HP)
 * - Multi-platform formatting (LinkedIn primary, X, Facebook)
 *
 * Triggered: manually or scheduled
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { complete, extractJSON } from "../../shared/llm.js";
import { storeMemory } from "../../shared/memory.js";

// Types
export interface STSContentInput {
  action: "repurpose" | "generate";
  sourceContent?: string;
  topic?: string;
  pillar?: "tech_trends" | "partner_spotlight" | "case_studies" | "eric_expertise" | "company_culture";
  partnerFocus?: "cisco" | "dell" | "oracle" | "lenovo" | "hp";
}

export interface SocialPost {
  platform: "linkedin" | "x" | "facebook";
  postText: string;
  hashtags: string[];
  callToAction?: string;
}

export interface STSContentOutput {
  posts: SocialPost[];
}

// Voice guidelines
const VOICE_GUIDELINES = `
ERIC'S VOICE (STS):
- Authoritative but accessible
- Technical credibility with business acumen
- Helpful consultant, not pushy salesperson
- Professional but personable

DO:
- Demonstrate technical expertise
- Reference real experience (Duke, AT&T, 20+ years)
- Provide actionable insights
- Connect trends to business impact
- Highlight multi-vendor perspective

DON'T:
- Use excessive jargon
- Sound like a vendor press release
- Oversell or make claims
- Be too casual for enterprise audience
`;

// Build generation prompt
function buildGenerationPrompt(input: STSContentInput): string {
  const pillarContent = {
    tech_trends: "Industry insights and analysis - emerging technologies, market shifts, best practices",
    partner_spotlight: "Cisco/Dell/Oracle/Lenovo/HP news and capabilities",
    case_studies: "Client success stories (anonymized) - challenges solved, value delivered",
    eric_expertise: "Technical insights from 20+ years - security, infrastructure, enterprise IT",
    company_culture: "STS team, values, community involvement",
  };

  const pillarDescription = input.pillar ? pillarContent[input.pillar] : "General enterprise tech insights";

  if (input.action === "repurpose") {
    return `${VOICE_GUIDELINES}

SOURCE CONTENT:
${input.sourceContent}

TASK: Transform this into thought leadership posts for STS (Sino Technology Solutions).

Create 3 posts with these specs:
- LinkedIn: 600-1200 words, thought leadership, insights, 3-5 hashtags (PRIMARY PLATFORM)
- X: 200-280 chars, news reaction, quick take, 1-2 hashtags
- Facebook: 200-400 words, company update focus, 2-3 hashtags

STS CONTEXT:
- Enterprise tech consulting, 20+ years experience
- Multi-vendor expertise (Cisco, Dell, Oracle, Lenovo, HP)
- Local Tampa + enterprise capability
- Eric: Duke Medical, CEH Master, technical + business leader

Return JSON:
{
  "posts": [
    {
      "platform": "linkedin",
      "postText": "...",
      "hashtags": ["EnterpriseTech", "IT"],
      "callToAction": "Contact us to learn more"
    }
  ]
}`;
  }

  // Generate from topic
  return `${VOICE_GUIDELINES}

TOPIC: ${input.topic}
CONTENT PILLAR: ${pillarDescription}
${input.partnerFocus ? `PARTNER FOCUS: ${input.partnerFocus.toUpperCase()}` : ""}

STS BACKGROUND:
- CEO Eric: 20+ years enterprise IT, Duke Medical Center, CEH Master
- Multi-vendor expertise (not locked to one partner)
- Partners: Cisco (Gold), Dell (Titanium), Oracle (Gold), Lenovo (Platinum), HP (Platinum)
- Target: Mid-market to enterprise clients
- Value: Technical depth + business acumen + vendor flexibility

Create 3 professional posts. Use Eric's expertise and business perspective.

Return JSON:
{
  "posts": [
    {
      "platform": "linkedin",
      "postText": "...",
      "hashtags": ["EnterpriseIT", "TechConsulting"],
      "callToAction": "..."
    },
    {
      "platform": "x",
      "postText": "...",
      "hashtags": ["Tech"],
      "callToAction": null
    },
    {
      "platform": "facebook",
      "postText": "...",
      "hashtags": ["STSTech"],
      "callToAction": "..."
    }
  ]
}`;
}

// Main execution
export async function runSTSSocialContent(
  input: STSContentInput
): Promise<STSContentOutput> {
  const runId = await logAgentRun({
    agentName: "sts-social-content",
    context: "sts",
    triggerType: "manual",
    inputData: input,
  });

  try {
    console.log("🚀 Starting STS Social/Content Agent...\n");
    console.log(`📋 Action: ${input.action}`);
    if (input.topic) console.log(`📝 Topic: ${input.topic}`);
    if (input.pillar) console.log(`🎯 Pillar: ${input.pillar}`);
    if (input.partnerFocus) console.log(`🤝 Partner: ${input.partnerFocus}`);
    console.log("");

    // Generate content with Claude
    console.log("✍️  Generating social posts...");
    const prompt = buildGenerationPrompt(input);
    const generation = await complete({
      model: "SONNET",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 3000,
      temperature: 0.7,
    });

    // Parse results
    let output: STSContentOutput;
    try {
      output = extractJSON(generation.content);
    } catch (error) {
      throw new Error("Failed to parse generated content");
    }

    // Store posts to database
    console.log("💾 Storing posts...");
    for (const post of output.posts) {
      const { error: dbError } = await supabase.from("social_queue").insert({
        context: "sts",
        platform: post.platform,
        post_text: post.postText,
        hashtags: post.hashtags,
        status: "draft",
      });

      if (dbError) console.warn(`⚠️  DB warning (${post.platform}):`, dbError.message);
    }

    // Store to memory
    await storeMemory({
      context: "sts",
      category: "knowledge",
      content: `STS social content generated: ${input.topic || "repurposed content"}. Pillar: ${input.pillar || "general"}`,
      metadata: { action: input.action, pillar: input.pillar, postCount: output.posts.length },
      source: "sts-social-content",
    });

    await completeAgentRun(runId, {
      status: "completed",
      outputData: output,
    });

    // Display formatted output
    console.log("\n" + "═".repeat(70));
    console.log("STS SOCIAL CONTENT GENERATED");
    console.log("═".repeat(70));
    console.log("");

    output.posts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.platform.toUpperCase()}`);
      console.log("─".repeat(50));
      console.log(post.postText);
      console.log("");
      console.log(`Hashtags: ${post.hashtags.join(" ")}`);
      if (post.callToAction) console.log(`CTA: ${post.callToAction}`);
      console.log("");
    });

    console.log("═".repeat(70));

    return output;
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
    console.log("Usage: npm run agent:content:sts <action> [params...]");
    console.log("");
    console.log("Actions:");
    console.log("  generate <topic> [pillar] [partner]   - Generate original posts");
    console.log("  repurpose <content>                   - Repurpose existing content");
    console.log("");
    console.log("Pillars: tech_trends, partner_spotlight, case_studies, eric_expertise, company_culture");
    console.log("Partners: cisco, dell, oracle, lenovo, hp");
    console.log("");
    console.log("Examples:");
    console.log('  npm run agent:content:sts generate "AI in enterprise" tech_trends');
    console.log('  npm run agent:content:sts generate "Cisco security" partner_spotlight cisco');
    console.log('  npm run agent:content:sts repurpose "Industry article text..."');
    process.exit(1);
  }

  const action = args[0] as "generate" | "repurpose";
  let input: STSContentInput = { action };

  if (action === "generate") {
    input.topic = args[1];
    input.pillar = args[2] as any;
    input.partnerFocus = args[3] as any;
  } else if (action === "repurpose") {
    input.sourceContent = args.slice(1).join(" ");
  }

  runSTSSocialContent(input)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Agent failed:", error);
      process.exit(1);
    });
}
