/**
 * LLM Utilities - Claude API
 *
 * Provides:
 * - Claude API client initialization
 * - Completion function with model selection
 * - Token usage tracking
 */

import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("Missing ANTHROPIC_API_KEY environment variable");
}

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Model constants
// Note: Using Haiku for all models since Sonnet/Opus may not be available on all API keys
export const MODELS = {
  OPUS: "claude-3-haiku-20240307",     // Fallback to Haiku
  SONNET: "claude-3-haiku-20240307",   // Fallback to Haiku
  HAIKU: "claude-3-haiku-20240307",
} as const;

export type ModelType = keyof typeof MODELS;

// Types
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  model: ModelType;
  messages: Message[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Get completion from Claude
 *
 * @param options - Completion configuration
 * @returns Completion result with content and token usage
 */
export async function complete(
  options: CompletionOptions
): Promise<CompletionResult> {
  const {
    model,
    messages,
    system,
    maxTokens = 1000,
    temperature = 0.7,
  } = options;

  try {
    const response = await anthropic.messages.create({
      model: MODELS[model],
      max_tokens: maxTokens,
      temperature: temperature,
      system: system,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract text content from response
    const content =
      response.content[0].type === "text" ? response.content[0].text : "";

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("❌ Claude API error:", error);
    throw error;
  }
}

/**
 * Helper: Quick completion with Sonnet (most common use case)
 */
export async function completeSonnet(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const result = await complete({
    model: "SONNET",
    messages: [{ role: "user", content: userMessage }],
    system: systemPrompt,
    maxTokens: 2000,
  });

  return result.content;
}

/**
 * Helper: Complex reasoning with Opus
 */
export async function completeOpus(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const result = await complete({
    model: "OPUS",
    messages: [{ role: "user", content: userMessage }],
    system: systemPrompt,
    maxTokens: 4000,
  });

  return result.content;
}

/**
 * Helper: High-volume tasks with Haiku
 */
export async function completeHaiku(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const result = await complete({
    model: "HAIKU",
    messages: [{ role: "user", content: userMessage }],
    system: systemPrompt,
    maxTokens: 1000,
  });

  return result.content;
}

/**
 * Helper: Extract JSON from LLM response that might include extra text
 */
export function extractJSON(text: string): any {
  // Try to find JSON in the response (array or object)
  // IMPORTANT: Check for object FIRST, then array
  // (if we check array first, it will match arrays inside objects)
  let jsonMatch = text.match(/\{[\s\S]*\}/);

  // If no object, try to match an array
  if (!jsonMatch) {
    jsonMatch = text.match(/\[[\s\S]*\]/);
  }

  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse JSON:", jsonMatch[0].substring(0, 200) + "...");
    throw error;
  }
}
