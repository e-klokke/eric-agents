/**
 * Web Search Utility
 *
 * Provides web search capabilities using Tavily API
 * Tavily is optimized for AI agents with clean, structured results
 */

import { tavily } from "@tavily/core";
import logger from "./logger.js";

// Initialize Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

export interface SearchOptions {
  maxResults?: number; // Default: 5
  searchDepth?: "basic" | "advanced"; // Default: "basic"
  includeAnswer?: boolean; // Include AI-generated answer summary (default: false)
  includeDomains?: string[]; // Only search these domains
  excludeDomains?: string[]; // Exclude these domains
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  answer?: string; // AI-generated answer (if includeAnswer: true)
  results: SearchResult[];
  query: string;
}

/**
 * Perform web search using Tavily API
 *
 * @param query - Search query
 * @param options - Search options
 * @returns Search results with content
 */
export async function webSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    maxResults = 5,
    searchDepth = "basic",
    includeAnswer = false,
    includeDomains,
    excludeDomains,
  } = options;

  // If no API key, return placeholder (graceful degradation)
  if (!process.env.TAVILY_API_KEY) {
    logger.warn({ query }, "TAVILY_API_KEY not set, returning placeholder search results");
    return {
      query,
      answer: includeAnswer
        ? `[AI answer placeholder for: "${query}"]`
        : undefined,
      results: [
        {
          title: "Placeholder Search Result",
          url: "https://example.com",
          content: `[Web search results for "${query}" - Set TAVILY_API_KEY to enable real search]`,
          score: 1.0,
        },
      ],
    };
  }

  try {
    logger.info(
      { query, searchDepth, maxResults },
      `Web search: "${query}"`
    );

    const response = await tavilyClient.search(query, {
      maxResults,
      searchDepth,
      includeAnswer,
      includeDomains,
      excludeDomains,
      includeRawContent: false, // Don't need raw HTML
    });

    interface TavilyResult {
      title: string;
      url: string;
      content: string;
      score: number;
    }

    const results: SearchResult[] = response.results.map((r: TavilyResult) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));

    return {
      query,
      answer: response.answer,
      results,
    };
  } catch (error) {
    logger.error({ error, query }, "Web search error");
    throw new Error(
      `Web search failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Format search results into a text summary
 *
 * @param searchResponse - Response from webSearch()
 * @returns Formatted text with all results
 */
export function formatSearchResults(searchResponse: SearchResponse): string {
  let formatted = `Search Query: "${searchResponse.query}"\n\n`;

  if (searchResponse.answer) {
    formatted += `AI Summary:\n${searchResponse.answer}\n\n`;
  }

  formatted += `Search Results (${searchResponse.results.length}):\n\n`;

  searchResponse.results.forEach((result, i) => {
    formatted += `[${i + 1}] ${result.title}\n`;
    formatted += `URL: ${result.url}\n`;
    formatted += `Score: ${result.score.toFixed(2)}\n`;
    formatted += `${result.content}\n\n`;
  });

  return formatted;
}
