/**
 * PDC Social/Content Agent
 *
 * Creates and manages social media content for Players Development Club:
 * - Repurposes long-form content into social posts
 * - Generates original posts from topics
 * - Multi-platform formatting (Instagram, LinkedIn, X, Facebook)
 * - Maintains Eric's authentic coaching voice
 *
 * Triggered: manually or scheduled
 */

import "dotenv/config";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { complete, extractJSON } from "../../shared/llm.js";
import { storeMemory } from "../../shared/memory.js";

// Types
export interface PDCContentInput {
  action: "repurpose" | "generate";
  sourceContent?: string;
  topic?: string;
  pillar?: "hidden_game" | "character" | "transition" | "eric_journey" | "parent_education";
  targetAudience?: "athletes" | "parents" | "coaches" | "general";
}

export interface SocialPost {
  platform: "instagram" | "linkedin" | "x" | "facebook";
  postText: string;
  hashtags: string[];
  callToAction?: string;
}

export interface PDCContentOutput {
  posts: SocialPost[];
  keyQuotes?: string[];
  themes?: string[];
}

// Platform specs (for reference in prompts)
// const PLATFORM_SPECS = {
//   instagram: { minLength: 150, maxLength: 300, hashtagCount: [8, 12] },
//   linkedin: { minLength: 500, maxLength: 800, hashtagCount: [3, 5] },
//   x: { minLength: 200, maxLength: 280, hashtagCount: [1, 2] },
//   facebook: { minLength: 200, maxLength: 400, hashtagCount: [2, 3] },
// };

// Voice guidelines for prompts
const VOICE_GUIDELINES = `
ERIC'S VOICE (PDC):
- Direct and authentic (no corporate speak)
- Uses sports analogies from 10 years pro experience
- Balances tough love with encouragement
- Connects athletic lessons to life
- Speaks to athlete's mindset
- Acknowledges parent perspective

DO:
- Reference real game situations
- Share personal pro experience
- Be conversational and relatable
- Challenge athletes positively

DON'T:
- Use generic motivational clichés
- Sound preachy or lecture-y
- Overuse hashtags
- Ignore family context
`;

// Build generation prompt
function buildGenerationPrompt(input: PDCContentInput): string {
  const pillarContent = {
    hidden_game: "Mental aspects of athletics - mindset, preparation, focus, resilience",
    character: "Life skills through sports - integrity, work ethic, teamwork, leadership",
    transition: "Level-to-level guidance - high school to college, college to pro, career after sports",
    eric_journey: "Personal stories from Eric's 10 years playing pro in Europe",
    parent_education: "Guidance for sports parents - supporting without pressuring, development focus",
  };

  const pillarDescription = input.pillar ? pillarContent[input.pillar] : "General athlete development";

  if (input.action === "repurpose") {
    return `${VOICE_GUIDELINES}

SOURCE CONTENT:
${input.sourceContent}

TASK: Repurpose this content into social media posts for PDC (Players Development Club).

Create 4 posts (one per platform) with these specs:
- Instagram: 150-300 words, visual hook, personal story angle, 8-12 hashtags
- LinkedIn: 500-800 words, professional insights, career lessons, 3-5 hashtags
- X: 200-280 chars, punchy quote or insight, 1-2 hashtags
- Facebook: 200-400 words, community focus, parent-friendly, 2-3 hashtags

Return JSON:
{
  "posts": [
    {
      "platform": "instagram",
      "postText": "...",
      "hashtags": ["AthleteLife", "MentalGame"],
      "callToAction": "Link in bio to learn more"
    }
  ],
  "keyQuotes": ["extracted quote 1"],
  "themes": ["theme 1"]
}`;
  }

  // Generate from topic
  return `${VOICE_GUIDELINES}

TOPIC: ${input.topic}
CONTENT PILLAR: ${pillarDescription}
TARGET AUDIENCE: ${input.targetAudience || "general"}

Eric's background to reference:
- 10 years pro basketball (Denmark, Portugal, Estonia, Norway, Germany)
- 5 Championships, 8 MVP awards
- Founder of PDC - athlete development coaching
- Focus on mental game and character, not just skills

Create 4 authentic posts about this topic. Use Eric's voice and real experience.

Return JSON:
{
  "posts": [
    {
      "platform": "instagram",
      "postText": "...",
      "hashtags": ["AthleteLife", "PDC"],
      "callToAction": "..."
    },
    {
      "platform": "linkedin",
      "postText": "...",
      "hashtags": ["AthleteDevelopment"],
      "callToAction": "..."
    },
    {
      "platform": "x",
      "postText": "...",
      "hashtags": ["Sports"],
      "callToAction": null
    },
    {
      "platform": "facebook",
      "postText": "...",
      "hashtags": ["AthleteMindset"],
      "callToAction": "..."
    }
  ]
}`;
}

// Main execution
export async function runPDCSocialContent(
  input: PDCContentInput
): Promise<PDCContentOutput> {
  const runId = await logAgentRun({
    agentName: "pdc-social-content",
    context: "pdc",
    triggerType: "manual",
    inputData: input,
  });

  try {
    console.log("🚀 Starting PDC Social/Content Agent...\n");
    console.log(`📋 Action: ${input.action}`);
    if (input.topic) console.log(`📝 Topic: ${input.topic}`);
    if (input.pillar) console.log(`🎯 Pillar: ${input.pillar}`);
    console.log("");

    // Generate content with Claude
    console.log("✍️  Generating social posts...");
    const prompt = buildGenerationPrompt(input);
    const generation = await complete({
      model: "SONNET",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 3000,
      temperature: 0.8, // More creative for content
    });

    // Parse results
    let output: PDCContentOutput;
    try {
      output = extractJSON(generation.content);
    } catch (error) {
      throw new Error("Failed to parse generated content");
    }

    // Store posts to database
    console.log("💾 Storing posts...");
    for (const post of output.posts) {
      const { error: dbError } = await supabase.from("social_queue").insert({
        context: "pdc",
        platform: post.platform,
        post_text: post.postText,
        hashtags: post.hashtags,
        status: "draft",
      });

      if (dbError) console.warn(`⚠️  DB warning (${post.platform}):`, dbError.message);
    }

    // Store to memory
    await storeMemory({
      context: "pdc",
      category: "knowledge",
      content: `PDC social content generated: ${input.topic || "repurposed content"}. Key themes: ${output.themes?.join(", ") || "N/A"}`,
      metadata: { action: input.action, pillar: input.pillar, postCount: output.posts.length },
      source: "pdc-social-content",
    });

    await completeAgentRun(runId, {
      status: "completed",
      outputData: output,
    });

    // Display formatted output
    console.log("\n" + "═".repeat(70));
    console.log("PDC SOCIAL CONTENT GENERATED");
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

    if (output.keyQuotes && output.keyQuotes.length > 0) {
      console.log("💎 KEY QUOTES:");
      output.keyQuotes.forEach((q) => console.log(`   "${q}"`));
      console.log("");
    }

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
    console.log("Usage: npm run agent:content:pdc <action> [params...]");
    console.log("");
    console.log("Actions:");
    console.log("  generate <topic> [pillar] [audience]  - Generate original posts");
    console.log("  repurpose <content>                   - Repurpose existing content");
    console.log("");
    console.log("Pillars: hidden_game, character, transition, eric_journey, parent_education");
    console.log("Audience: athletes, parents, coaches, general");
    console.log("");
    console.log("Examples:");
    console.log('  npm run agent:content:pdc generate "mental toughness" hidden_game athletes');
    console.log('  npm run agent:content:pdc generate "pre-game routine" character');
    console.log('  npm run agent:content:pdc repurpose "Video transcript here..."');
    process.exit(1);
  }

  const action = args[0] as "generate" | "repurpose";
  let input: PDCContentInput = { action };

  if (action === "generate") {
    input.topic = args[1];
    input.pillar = args[2] as any;
    input.targetAudience = args[3] as any;
  } else if (action === "repurpose") {
    input.sourceContent = args.slice(1).join(" ");
  }

  runPDCSocialContent(input)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Agent failed:", error);
      process.exit(1);
    });
}
