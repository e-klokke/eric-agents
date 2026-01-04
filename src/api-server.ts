/**
 * API Server for Web Dashboard
 * Exposes all agents via REST API
 */

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
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
import logger from "./shared/logger.js";

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Eric\'s Agents API is running' });
});

// Ask AI - General Question
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    logger.info({ question }, 'Ask AI request');

    // Web search
    const searchResponse = await webSearch(question, {
      maxResults: 5,
      searchDepth: 'advanced',
      includeAnswer: true,
    });

    const searchResults = formatSearchResults(searchResponse);

    // Generate answer with Claude
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
      model: 'SONNET',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
      temperature: 0.7,
    });

    const sources = searchResponse.results.slice(0, 3).map(r => ({
      title: r.title,
      url: r.url
    }));

    res.json({
      answer: response.content,
      sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Ask AI error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Research - Personal
app.post('/api/research/personal', async (req: Request, res: Response) => {
  try {
    const result = await runPersonalLeadResearch(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Personal research error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Research - Athlete
app.post('/api/research/athlete', async (req: Request, res: Response) => {
  try {
    const result = await runPDCLeadResearch(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Athlete research error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Research - Company
app.post('/api/research/company', async (req: Request, res: Response) => {
  try {
    const result = await runSTSLeadResearch(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Company research error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Content - PDC
app.post('/api/content/pdc', async (req: Request, res: Response) => {
  try {
    const result = await runPDCSocialContent(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'PDC content error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Content - STS
app.post('/api/content/sts', async (req: Request, res: Response) => {
  try {
    const result = await runSTSSocialContent(req.body);
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'STS content error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Sales - PDC Follow-ups
app.post('/api/sales/pdc/followups', async (_req: Request, res: Response) => {
  try {
    const result = await runPDCSalesNurture({ action: 'check_followups' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'PDC followups error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Sales - PDC Digest
app.post('/api/sales/pdc/digest', async (_req: Request, res: Response) => {
  try {
    const result = await runPDCSalesNurture({ action: 'enrollment_digest' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'PDC digest error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Sales - STS Follow-ups
app.post('/api/sales/sts/followups', async (_req: Request, res: Response) => {
  try {
    const result = await runSTSSalesNurture({ action: 'check_followups' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'STS followups error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Sales - STS Digest
app.post('/api/sales/sts/digest', async (_req: Request, res: Response) => {
  try {
    const result = await runSTSSalesNurture({ action: 'pipeline_digest' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'STS digest error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Leads - PDC
app.post('/api/leads/pdc', async (_req: Request, res: Response) => {
  try {
    const result = await runPDCLeadGeneration({ action: 'lead_digest' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'PDC leads error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Leads - STS
app.post('/api/leads/sts', async (_req: Request, res: Response) => {
  try {
    const result = await runSTSLeadGeneration({ action: 'lead_digest' });
    res.json(result);
  } catch (error) {
    logger.error({ error }, 'STS leads error');
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, '🚀 API Server running');
  console.log(`\n🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
