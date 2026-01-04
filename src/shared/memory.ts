/**
 * Memory System - Vector Storage
 *
 * Provides:
 * - Store memories with vector embeddings
 * - Semantic search across memories
 * - Context-aware retrieval
 */

import OpenAI from "openai";
import { supabase } from "./supabase.js";

// Initialize OpenAI client for embeddings
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: apiKey,
});

// Types
export interface StoreMemoryInput {
  context: "personal" | "pdc" | "sts" | "shared";
  category: "knowledge" | "entity" | "conversation" | "decision";
  content: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface SearchMemoriesInput {
  query: string;
  context?: "personal" | "pdc" | "sts" | "shared";
  category?: "knowledge" | "entity" | "conversation" | "decision";
  limit?: number;
  minSimilarity?: number;
}

export interface Memory {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
  context: string;
  category: string;
  source: string | null;
  created_at: string;
}

/**
 * Generate embedding for text using OpenAI
 */
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      dimensions: 3072,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Store a memory with vector embedding
 *
 * @param input - Memory data to store
 * @returns Memory ID
 */
export async function storeMemory(input: StoreMemoryInput): Promise<string> {
  console.log(`💾 Storing memory (${input.category})...`);

  // Generate embedding for the content
  const embedding = await getEmbedding(input.content);

  // Insert into database
  const { data, error } = await supabase
    .from("memories")
    .insert({
      context: input.context,
      category: input.category,
      content: input.content,
      embedding: embedding,
      metadata: input.metadata || {},
      source: input.source || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("❌ Failed to store memory:", error);
    throw error;
  }

  console.log(`✅ Memory stored: ${data.id}`);
  return data.id;
}

/**
 * Search memories using semantic similarity
 *
 * @param input - Search parameters
 * @returns Array of matching memories with similarity scores
 */
export async function searchMemories(
  input: SearchMemoriesInput
): Promise<Memory[]> {
  const { query, context, category, limit = 5, minSimilarity = 0.7 } = input;

  console.log(`🔍 Searching memories: "${query.substring(0, 50)}..."`);

  // Generate embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Build the query
  let sqlQuery = supabase.rpc("match_memories", {
    query_embedding: queryEmbedding,
    match_threshold: minSimilarity,
    match_count: limit,
  });

  // Apply filters if provided
  if (context) {
    sqlQuery = sqlQuery.eq("context", context);
  }
  if (category) {
    sqlQuery = sqlQuery.eq("category", category);
  }

  const { data, error } = await sqlQuery;

  if (error) {
    console.error("❌ Failed to search memories:", error);
    throw error;
  }

  console.log(`✅ Found ${data?.length || 0} matching memories`);

  return (data || []) as Memory[];
}

/**
 * Get recent memories from a context
 */
export async function getRecentMemories(
  context: string,
  limit: number = 10
): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("context", context)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ Failed to fetch recent memories:", error);
    throw error;
  }

  return data as Memory[];
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId);

  if (error) {
    console.error("❌ Failed to delete memory:", error);
    throw error;
  }

  console.log(`✅ Memory deleted: ${memoryId}`);
}

/**
 * Create the match_memories RPC function in Supabase
 *
 * This SQL function needs to be created in Supabase:
 *
 * CREATE OR REPLACE FUNCTION match_memories(
 *   query_embedding vector(3072),
 *   match_threshold float,
 *   match_count int
 * )
 * RETURNS TABLE (
 *   id uuid,
 *   context text,
 *   category text,
 *   content text,
 *   metadata jsonb,
 *   source text,
 *   created_at timestamptz,
 *   similarity float
 * )
 * LANGUAGE sql STABLE
 * AS $$
 *   SELECT
 *     id,
 *     context,
 *     category,
 *     content,
 *     metadata,
 *     source,
 *     created_at,
 *     1 - (embedding <=> query_embedding) as similarity
 *   FROM memories
 *   WHERE 1 - (embedding <=> query_embedding) > match_threshold
 *   ORDER BY similarity DESC
 *   LIMIT match_count;
 * $$;
 */
