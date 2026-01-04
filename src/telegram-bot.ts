/**
 * Eric's AI Agent System - Telegram Bot
 *
 * Provides Telegram interface for all agents
 */

import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import logger from "./shared/logger.js";
import { runPersonalLeadResearch } from "./agents/personal/lead-research.js";
import { runPDCLeadResearch } from "./agents/pdc/lead-research.js";
import { runSTSLeadResearch } from "./agents/sts/lead-research.js";
import { runPDCSocialContent } from "./agents/pdc/social-content.js";
import { runSTSSocialContent } from "./agents/sts/social-content.js";
import { runPDCSalesNurture } from "./agents/pdc/sales-nurture.js";
import { runSTSSalesNurture } from "./agents/sts/sales-nurture.js";
import { runPDCLeadGeneration } from "./agents/pdc/lead-generation.js";
import { runSTSLeadGeneration } from "./agents/sts/lead-generation.js";
import { webSearch, formatSearchResults } from "./shared/web-search.js";
import { complete } from "./shared/llm.js";
import {
  PersonalLeadInputSchema,
  PDCLeadInputSchema,
  STSLeadInputSchema,
  PDCContentInputSchema,
  STSContentInputSchema,
  validateInput,
} from "./shared/validation.js";

// Initialize bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  logger.warn("TELEGRAM_BOT_TOKEN not set, bot disabled");
} else {
  const bot = new TelegramBot(token, { polling: true });

  // Security: allowed users
  const allowedUsers =
    process.env.TELEGRAM_ALLOWED_USERS?.split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id)) || [];

  function isAllowed(userId: number): boolean {
    if (allowedUsers.length === 0) return true;
    return allowedUsers.includes(userId);
  }

  function unauthorized(chatId: number) {
    bot.sendMessage(chatId, "❌ Unauthorized. Use /myid to get your user ID.");
  }

  // /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    bot.sendMessage(
      chatId,
      `
🤖 *Eric's Agent Bot* - All Agents + AI Assistant

*🔍 Ask Anything (NEW):*
\`/ask Your question\`
Get live answers to ANY question using real-time web data

*📊 Research:*
\`/research_personal Name, Company\`
\`/research_athlete Name, Sport\`
\`/research_company Company, Website\`

*✍️ Content Generation:*
\`/content_pdc Topic\`
\`/content_sts Topic\`

*💼 Sales & Pipeline:*
\`/pdc_followups\` - Check athlete follow-ups
\`/pdc_digest\` - PDC enrollment digest
\`/sts_followups\` - Check company follow-ups
\`/sts_digest\` - STS pipeline digest

*📈 Lead Generation:*
\`/pdc_leads\` - Recent PDC leads
\`/sts_leads\` - Recent STS leads

*⚙️  Setup:*
\`/myid\` - Get your Telegram user ID

*Examples:*
\`/ask what is the current price of bitcoin?\`
\`/ask latest AI trends 2026\`
\`/research_personal Satya Nadella, Microsoft\`
\`/content_pdc mental toughness\`
    `,
      { parse_mode: "Markdown" }
    );
  });

  // /myid command
  bot.onText(/\/myid/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      `Your Telegram user ID: ${msg.from!.id}\nAdd this to TELEGRAM_ALLOWED_USERS env var.`
    );
  });

  // /ask command - General AI assistant with live web data
  bot.onText(/\/ask (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const question = match![1].trim();

    await bot.sendMessage(chatId, `🔍 Searching for: "${question}"...`);

    try {
      // Step 1: Web search for live data
      const searchResponse = await webSearch(question, {
        maxResults: 5,
        searchDepth: "advanced",
        includeAnswer: true,
      });

      const searchResults = formatSearchResults(searchResponse);

      // Step 2: Generate answer with Claude
      const prompt = `You are a helpful AI assistant with access to live web data.

USER QUESTION: ${question}

LIVE WEB SEARCH RESULTS:
${searchResults}

TASK: Provide a clear, concise answer to the user's question based on the search results above.

REQUIREMENTS:
- Use ONLY information from the search results
- Be factual and accurate
- Include specific numbers, dates, prices when available
- If the information is time-sensitive (prices, news), mention when it was current
- Keep response under 500 words
- Format nicely with bullet points where appropriate
- If you cannot answer based on search results, say so

Provide your answer now:`;

      const response = await complete({
        model: "SONNET",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1000,
        temperature: 0.7,
      });

      const answer = response.content;

      // Extract sources
      const sources = searchResponse.results
        .slice(0, 3)
        .map((r, i) => `${i + 1}. [${r.title}](${r.url})`)
        .join("\n");

      const fullResponse = `
💡 *Answer:*

${answer}

📚 *Sources:*
${sources}
      `;

      await bot.sendMessage(chatId, fullResponse, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  // /research_personal
  bot.onText(/\/research_personal (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const args = match![1].split(",").map((s) => s.trim());
    const [name, company] = args;

    const validation = validateInput(PersonalLeadInputSchema, { name, company });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `🔍 Researching ${name}...`);

    try {
      const result = await runPersonalLeadResearch(validation.data);

      const response = `
✅ *Research Complete: ${name}*

*Role:* ${result.person?.currentRole || "Unknown"}
*Company:* ${result.person?.company || company || "Unknown"}

*Background:*
${result.person?.background || "Not available"}

*Common Ground with Eric:*
${result.commonGround?.map((c) => `• ${c}`).join("\n") || "• None identified"}

*Conversation Starters:*
${result.conversationStarters?.map((c) => `• ${c}`).join("\n") || "• None identified"}

*Suggested Approach:*
${result.suggestedApproach || "No specific approach"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /research_pdc_market
  bot.onText(/\/research_pdc_market (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const args = match![1].split(",").map((s) => s.trim());
    const [targetArea, targetSegment] = args;

    const validation = validateInput(PDCLeadInputSchema, {
      researchType: "market",
      targetArea,
      targetSegment: targetSegment || "wealth management",
    });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `🔍 Researching ${targetArea} market...`);

    try {
      const result = await runPDCLeadResearch(validation.data);

      const insights = result.marketInsights as any; // Display-only type assertion
      const response = `
✅ *PDC Market Research: ${targetArea}*

*Opportunities Found:* ${insights?.totalOpportunities || 0}

*Wealth Managers:*
${
  insights?.wealthManagers
    ?.slice(0, 5)
    .map((w: any) => `• ${w.firmName} - Score: ${w.partnerPotential}/10`)
    .join("\n") || "• None found"
}

*NIL Companies:*
${
  insights?.nilCompanies
    ?.slice(0, 5)
    .map((n: any) => `• ${n.name} (${n.type})`)
    .join("\n") || "• None found"
}

*Market Gaps:*
${insights?.marketGaps?.slice(0, 3).map((g: any) => `• ${g}`).join("\n") || "• None identified"}

*Recommendations:*
${insights?.recommendations?.slice(0, 3).map((r: any) => `• ${r}`).join("\n") || "• None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /research_pdc_collab
  bot.onText(/\/research_pdc_collab (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const organizationName = match![1].trim();

    const validation = validateInput(PDCLeadInputSchema, {
      researchType: "collaboration",
      organizationName,
      collaborationType: "wealth_management",
    });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `🔍 Researching ${organizationName}...`);

    try {
      const result = await runPDCLeadResearch(validation.data);

      const collab = result.collaborationProfile as any; // Display-only type assertion
      const response = `
✅ *PDC Collaboration: ${organizationName}*

*Organization:* ${collab?.organization?.name || organizationName}
*Type:* ${collab?.organization?.type || "Unknown"}
*Focus:* ${collab?.organization?.focus || "Unknown"}

*Alignment Score:* ${collab?.alignmentScore || 0}/10

*Partnership Models:*
${
  collab?.partnershipModels
    ?.map((p: any) => `• *${p.type}:* ${p.description}`)
    .join("\n") || "• None identified"
}

*Benefits for PDC:*
${collab?.mutualBenefits?.forPDC?.map((b: any) => `• ${b}`).join("\n") || "• None identified"}

*Outreach Approach:*
${result.outreachStrategy?.approach || "No specific approach"}

*Suggested Message:*
${result.outreachStrategy?.suggestedMessage || "None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /research_sts
  bot.onText(/\/research_sts (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const args = match![1].split(",").map((s) => s.trim());
    const [companyName, website, contactName] = args;

    const validation = validateInput(STSLeadInputSchema, { companyName, website, contactName });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `🔍 Researching ${companyName}...`);

    try {
      const result = await runSTSLeadResearch(validation.data);

      const response = `
✅ *STS Research: ${companyName}*

*Industry:* ${result.company?.industry || "Unknown"}
*Size:* ${result.company?.employeeCount || "Unknown"}
*Revenue:* ${result.company?.revenue || "Unknown"}

*Tech Stack:*
${result.techStack?.known?.map((t) => `• ${t}`).join("\n") || "• Unknown"}

*Partner Opportunities:*
• *Cisco:* ${result.partnerOpportunities?.cisco?.join(", ") || "None"}
• *Dell:* ${result.partnerOpportunities?.dell?.join(", ") || "None"}
• *Oracle:* ${result.partnerOpportunities?.oracle?.join(", ") || "None"}

*Contact:* ${result.contact?.name || contactName || "Unknown"}
*Role:* ${result.contact?.title || "Unknown"}

*Scores:*
• Fit: ${result.score?.fit || 0}/10
• Urgency: ${result.score?.urgency || 0}/10
• Overall: ${result.score?.overall || 0}/10

*Est. Deal Size:* ${result.score?.dealSize || "Unknown"}

*Next Step:* ${result.outreachStrategy?.suggestedNextStep || "None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /content_pdc
  bot.onText(/\/content_pdc (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const topic = match![1].trim();

    const validation = validateInput(PDCContentInputSchema, {
      action: "generate",
      topic,
      pillar: "hidden_game",
    });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `✍️  Generating PDC content about "${topic}"...`);

    try {
      const result = await runPDCSocialContent(validation.data);

      for (const post of result.posts || []) {
        const response = `
📱 *${post.platform.toUpperCase()}*

${post.postText}

*Hashtags:* ${post.hashtags?.join(" ") || "None"}
        `;

        await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
        await new Promise((r) => setTimeout(r, 500)); // Delay between messages
      }

      await bot.sendMessage(chatId, "✅ Content generation complete!");
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /content_sts
  bot.onText(/\/content_sts (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const topic = match![1].trim();

    const validation = validateInput(STSContentInputSchema, {
      action: "generate",
      topic,
      pillar: "tech_trends",
    });
    if (!validation.success) {
      return bot.sendMessage(chatId, `❌ ${validation.error}`);
    }

    await bot.sendMessage(chatId, `✍️  Generating STS content about "${topic}"...`);

    try {
      const result = await runSTSSocialContent(validation.data);

      for (const post of result.posts || []) {
        const response = `
📱 *${post.platform.toUpperCase()}*

${post.postText}

*Hashtags:* ${post.hashtags?.join(" ") || "None"}
        `;

        await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
        await new Promise((r) => setTimeout(r, 500));
      }

      await bot.sendMessage(chatId, "✅ Content generation complete!");
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /research_athlete - Research athlete for PDC
  bot.onText(/\/research_athlete (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const args = match![1].split(",").map((s) => s.trim());
    const [athleteName, sport] = args;

    await bot.sendMessage(chatId, `🏀 Researching ${athleteName}...`);

    try {
      const result = await runPDCLeadResearch({
        researchType: "lead",
        athleteName,
        sport,
      });

      const profile: any = result.leadProfile || result.collaborationProfile || {};
      const response = `
✅ *PDC Athlete Research: ${athleteName}*

*Sport:* ${sport}
*Qualification Score:* ${result.score?.overall || 0}/10

*Background:*
${profile.background || "Not available"}

*Strengths:*
${profile.strengths?.map((s: string) => `• ${s}`).join("\n") || "• None identified"}

*Development Needs:*
${profile.developmentNeeds?.map((n: string) => `• ${n}`).join("\n") || "• None identified"}

*Outreach Strategy:*
${result.outreachStrategy?.approach || "Standard outreach"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /research_company - Research company for STS
  bot.onText(/\/research_company (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    const args = match![1].split(",").map((s) => s.trim());
    const [companyName, website] = args;

    await bot.sendMessage(chatId, `🏢 Researching ${companyName}...`);

    try {
      const result = await runSTSLeadResearch({ companyName, website });

      const company = result.company || { industry: "Unknown", employeeCount: "Unknown" };
      const techStack = result.techStack || { known: [], gaps: [] };
      const partners = result.partnerOpportunities || { cisco: [], dell: [] };
      const response = `
✅ *STS Company Research: ${companyName}*

*Industry:* ${company.industry}
*Size:* ${company.employeeCount}
*Score:* ${result.score?.overall || 0}/10

*Tech Stack:*
${techStack.known?.map((t: string) => `• ${t}`).join("\n") || "• None identified"}

*Partner Opportunities:*
• Cisco: ${partners.cisco?.join(", ") || "None"}
• Dell: ${partners.dell?.join(", ") || "None"}

*Deal Size:* ${result.score?.dealSize || "Unknown"}

*Next Step:*
${result.outreachStrategy?.suggestedNextStep || "Schedule discovery call"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /pdc_followups - Check PDC follow-ups
  bot.onText(/\/pdc_followups/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📅 Checking PDC follow-ups...`);

    try {
      const result = await runPDCSalesNurture({ action: "check_followups" });

      const followups = result.followUps || [];

      if (followups.length === 0) {
        await bot.sendMessage(chatId, "✅ No follow-ups due today!");
        return;
      }

      const response = `
📋 *PDC Follow-ups Due: ${followups.length}*

${followups
  .slice(0, 10)
  .map(
    (f: any, i: number) => `
${i + 1}. *${f.athleteName || f.name}*
   Stage: ${f.stage || "Unknown"}
   Last contact: ${f.lastContactDate || "Unknown"}
   Action: ${f.nextAction || "Follow up"}
`
  )
  .join("\n")}

${followups.length > 10 ? `\n_...and ${followups.length - 10} more_` : ""}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /pdc_digest - PDC enrollment digest
  bot.onText(/\/pdc_digest/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📊 Generating PDC enrollment digest...`);

    try {
      const result = await runPDCSalesNurture({ action: "enrollment_digest" });

      const digest: any = result.enrollmentDigest || {};
      const summary = digest.summary || {};
      const response = `
📊 *PDC Enrollment Digest*

*Pipeline Summary:*
• Inquiries: ${summary.totalInquiries || 0}
• Consultations scheduled: ${summary.consultationsScheduled || 0}
• Active athletes: ${summary.activeAthletes || 0}
• This month enrollments: ${summary.thisMonthEnrollments || 0}

*Action Items:*
${digest.needsAction?.map((a: any) => `• ${a.athleteName} - ${a.reason}`).join("\n") || "• None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /sts_followups - Check STS follow-ups
  bot.onText(/\/sts_followups/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📅 Checking STS follow-ups...`);

    try {
      const result = await runSTSSalesNurture({ action: "check_followups" });

      const followups = result.followUps || [];

      if (followups.length === 0) {
        await bot.sendMessage(chatId, "✅ No follow-ups due today!");
        return;
      }

      const response = `
📋 *STS Follow-ups Due: ${followups.length}*

${followups
  .slice(0, 10)
  .map(
    (f: any, i: number) => `
${i + 1}. *${f.companyName || f.name}*
   Stage: ${f.stage || "Unknown"}
   Value: ${f.dealValue || "Unknown"}
   Action: ${f.nextAction || "Follow up"}
`
  )
  .join("\n")}

${followups.length > 10 ? `\n_...and ${followups.length - 10} more_` : ""}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /sts_digest - STS pipeline digest
  bot.onText(/\/sts_digest/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📊 Generating STS pipeline digest...`);

    try {
      const result = await runSTSSalesNurture({ action: "pipeline_digest" });

      const digest: any = result.pipelineDigest || {};
      const summary = digest.summary || {};
      const byStage = summary.byStage || {};
      const response = `
📊 *STS Pipeline Digest*

*Pipeline Summary:*
• Total deals: ${summary.totalDeals || 0}
• Pipeline value: $${summary.totalValue || 0}

*By Stage:*
${Object.entries(byStage).map(([stage, data]: [string, any]) => `• ${stage}: ${data.count || 0} deals ($${data.value || 0})`).join("\n") || "• No data"}

*Action Items:*
${digest.needsAction?.slice(0, 5).map((a: any) => `• ${a.companyName} - ${a.reason}`).join("\n") || "• None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /pdc_leads - Recent PDC leads
  bot.onText(/\/pdc_leads/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📈 Getting recent PDC leads...`);

    try {
      const result = await runPDCLeadGeneration({ action: "lead_digest" });

      const leads = result.prospectList || [];

      if (leads.length === 0) {
        await bot.sendMessage(chatId, "📭 No recent leads found.");
        return;
      }

      const response = `
📈 *Recent PDC Prospects: ${leads.length}*

${leads
  .slice(0, 10)
  .map(
    (l: any, i: number) => `
${i + 1}. *${l.name}*
   Type: ${l.type || "Unknown"}
   Location: ${l.location || "Unknown"}
   Fit Score: ${l.fitScore || 0}/10
`
  )
  .join("\n")}

${leads.length > 10 ? `\n_...and ${leads.length - 10} more_` : ""}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  // /sts_leads - Recent STS leads
  bot.onText(/\/sts_leads/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAllowed(msg.from!.id)) return unauthorized(chatId);

    await bot.sendMessage(chatId, `📈 Getting recent STS leads...`);

    try {
      const result = await runSTSLeadGeneration({ action: "lead_digest" });

      const leads = result.prospectList || [];
      const triggers = result.triggers || [];

      if (leads.length === 0 && triggers.length === 0) {
        await bot.sendMessage(chatId, "📭 No recent leads or triggers found.");
        return;
      }

      const response = `
📈 *Recent STS Prospects: ${leads.length}*

${leads
  .slice(0, 10)
  .map(
    (l: any, i: number) => `
${i + 1}. *${l.company}*
   Industry: ${l.industry || "Unknown"}
   Fit Score: ${l.fitScore || 0}/10
`
  )
  .join("\n")}

*Trigger Events Detected: ${triggers.length}*
${triggers.slice(0, 3).map((t: any) => `• ${t.company} - ${t.triggerType}: ${t.description}`).join("\n") || "• None"}
      `;

      await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Error: ${error}`);
    }
  });

  logger.info("🤖 Telegram bot started with all 9 agents");
}

export {};
