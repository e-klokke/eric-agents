-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Agent run logging table
-- Tracks all agent executions with status and metadata
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  context TEXT NOT NULL,              -- 'personal', 'pdc', 'sts'
  trigger_type TEXT NOT NULL,         -- 'manual', 'scheduled', 'event', 'webhook'
  status TEXT DEFAULT 'running',      -- 'running', 'completed', 'failed'
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Vector memory storage table
-- Stores memories with embeddings for semantic search
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL,              -- 'personal', 'pdc', 'sts', 'shared'
  category TEXT NOT NULL,             -- 'knowledge', 'entity', 'conversation', 'decision'
  content TEXT NOT NULL,
  embedding vector(3072),             -- OpenAI text-embedding-3-large dimension
  metadata JSONB DEFAULT '{}',
  source TEXT,                        -- Agent or integration that created this memory
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDC leads and collaboration opportunities
-- Tracks athletes, parents, wealth managers, NIL companies
CREATE TABLE pdc_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL,            -- 'athlete', 'collaboration', 'market'
  name TEXT NOT NULL,
  organization TEXT,
  contact_info JSONB,
  research_data JSONB,                -- Full research report stored as JSON
  score INTEGER,                      -- Qualification/opportunity score
  status TEXT DEFAULT 'new',          -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STS company prospects
-- Tracks enterprise prospects and decision-makers
CREATE TABLE sts_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_title TEXT,
  research_data JSONB,                -- Full research report stored as JSON
  score INTEGER,                      -- Qualification score
  status TEXT DEFAULT 'new',          -- 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content library
-- Source content for repurposing into social posts
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL,              -- 'pdc' or 'sts'
  content_type TEXT NOT NULL,         -- 'video', 'article', 'podcast', 'notes', 'quote'
  title TEXT,
  content TEXT,                       -- Full text or transcript
  key_quotes JSONB DEFAULT '[]',
  themes JSONB DEFAULT '[]',
  source_url TEXT,
  status TEXT DEFAULT 'draft',        -- 'draft', 'processed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social post queue
-- Scheduled and published social media posts
CREATE TABLE social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context TEXT NOT NULL,              -- 'pdc' or 'sts'
  content_id UUID REFERENCES content_library(id),
  platform TEXT NOT NULL,             -- 'instagram', 'linkedin', 'x', 'facebook', 'youtube'
  post_type TEXT,                     -- 'single', 'carousel', 'thread', 'reel_caption', 'story'
  post_text TEXT NOT NULL,
  hashtags JSONB DEFAULT '[]',
  media_urls JSONB DEFAULT '[]',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT,              -- ID from the platform after publishing
  status TEXT DEFAULT 'draft',        -- 'draft', 'scheduled', 'published', 'failed'
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance

-- Memory table indexes
-- Note: Vector index skipped due to 2000 dimension limit in pgvector
-- The cosine distance operator (<=> ) will still work, just with sequential scan
-- Consider creating index later when pgvector supports >2000 dimensions or use smaller embeddings
-- CREATE INDEX idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_memories_context ON memories(context);
CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);

-- Agent runs indexes
CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_name);
CREATE INDEX idx_agent_runs_context ON agent_runs(context);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_started_at ON agent_runs(started_at DESC);

-- PDC leads indexes
CREATE INDEX idx_pdc_leads_type ON pdc_leads(lead_type);
CREATE INDEX idx_pdc_leads_status ON pdc_leads(status);
CREATE INDEX idx_pdc_leads_score ON pdc_leads(score DESC);
CREATE INDEX idx_pdc_leads_created_at ON pdc_leads(created_at DESC);

-- STS companies indexes
CREATE INDEX idx_sts_companies_status ON sts_companies(status);
CREATE INDEX idx_sts_companies_score ON sts_companies(score DESC);
CREATE INDEX idx_sts_companies_created_at ON sts_companies(created_at DESC);

-- Content library indexes
CREATE INDEX idx_content_library_context ON content_library(context);
CREATE INDEX idx_content_library_type ON content_library(content_type);
CREATE INDEX idx_content_library_status ON content_library(status);
CREATE INDEX idx_content_library_created_at ON content_library(created_at DESC);

-- Social queue indexes
CREATE INDEX idx_social_queue_context ON social_queue(context);
CREATE INDEX idx_social_queue_platform ON social_queue(platform);
CREATE INDEX idx_social_queue_status ON social_queue(status);
CREATE INDEX idx_social_queue_scheduled_for ON social_queue(scheduled_for);
CREATE INDEX idx_social_queue_created_at ON social_queue(created_at DESC);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdc_leads_updated_at BEFORE UPDATE ON pdc_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sts_companies_updated_at BEFORE UPDATE ON sts_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC function for semantic memory search
-- This enables vector similarity search using cosine distance
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  context text,
  category text,
  content text,
  metadata jsonb,
  source text,
  created_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    context,
    category,
    content,
    metadata,
    source,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM memories
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
