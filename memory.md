# Agent Memory System

## Overview

The Eric Agents system uses pgvector-powered semantic memory to enable agents to remember past interactions, learn from experiences, and maintain context across sessions.

## Architecture

### Vector Embeddings
- **Model**: OpenAI `text-embedding-3-large`
- **Dimensions**: 3072
- **Storage**: PostgreSQL with pgvector extension
- **Similarity**: Cosine distance for retrieval

### Memory Table Schema

```sql
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_context TEXT NOT NULL,           -- 'personal', 'pdc', 'sts'
  agent_name TEXT NOT NULL,              -- Specific agent identifier
  memory_type TEXT NOT NULL,             -- 'interaction', 'learning', 'fact', 'preference'
  content TEXT NOT NULL,                 -- The actual memory content
  embedding vector(3072),                -- Semantic vector
  metadata JSONB DEFAULT '{}',           -- Flexible metadata
  importance NUMERIC DEFAULT 0.5,        -- 0.0 to 1.0 relevance score
  accessed_count INTEGER DEFAULT 0,      -- Usage tracking
  last_accessed TIMESTAMPTZ,             -- Recency tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON agent_memory USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON agent_memory (agent_context, agent_name);
CREATE INDEX ON agent_memory (memory_type);
```

## Memory Types

### 1. Interaction Memory
Records of past agent actions and outcomes.

**Example**:
```json
{
  "memory_type": "interaction",
  "content": "Researched lead John Smith at Acme Corp on 2025-01-15. Found LinkedIn profile, company details, and identified buying trigger: new CTO hired.",
  "metadata": {
    "lead_id": "abc-123",
    "company": "Acme Corp",
    "outcome": "qualified_lead",
    "date": "2025-01-15"
  },
  "importance": 0.8
}
```

### 2. Learning Memory
Insights gained from patterns and results.

**Example**:
```json
{
  "memory_type": "learning",
  "content": "Healthcare companies in Florida respond better to compliance-focused messaging than cost-savings messaging. 3 out of 4 converted deals used HIPAA compliance as primary value prop.",
  "metadata": {
    "pattern": "messaging_effectiveness",
    "industry": "healthcare",
    "region": "florida",
    "sample_size": 4
  },
  "importance": 0.9
}
```

### 3. Fact Memory
Persistent knowledge about entities.

**Example**:
```json
{
  "memory_type": "fact",
  "content": "Acme Corp uses legacy Cisco infrastructure, has 500 employees, based in Tampa, IT Director is John Smith (joined 2024), budget cycle is Q1.",
  "metadata": {
    "entity_type": "company",
    "company_name": "Acme Corp",
    "last_verified": "2025-01-15"
  },
  "importance": 0.7
}
```

### 4. Preference Memory
User or system preferences.

**Example**:
```json
{
  "memory_type": "preference",
  "content": "Eric prefers morning follow-up emails sent at 8 AM EST, avoids Friday outreach for enterprise deals.",
  "metadata": {
    "preference_type": "scheduling",
    "user": "eric"
  },
  "importance": 0.6
}
```

## Using Memory in Agents

### Storing Memories

```typescript
import { storeMemory } from "../shared/memory.js";

// After a successful interaction
await storeMemory({
  agentContext: "sts",
  agentName: "lead-research",
  memoryType: "interaction",
  content: `Researched ${companyName}. Key findings: ${findings}`,
  metadata: {
    company_name: companyName,
    lead_id: leadId,
    outcome: "qualified"
  },
  importance: 0.8
});
```

### Retrieving Relevant Memories

```typescript
import { recallMemories } from "../shared/memory.js";

// Before researching a company
const relevantMemories = await recallMemories({
  agentContext: "sts",
  query: `Previous research about ${companyName} and similar healthcare companies`,
  limit: 5,
  minImportance: 0.5
});

// Use memories to inform current action
const context = relevantMemories.map(m => m.content).join("\n");
const prompt = `
Previous knowledge:
${context}

Now research: ${companyName}
`;
```

### Memory-Augmented Prompts

```typescript
// Pattern: Retrieve → Contextualize → Act

// 1. Retrieve relevant memories
const memories = await recallMemories({
  agentContext: "pdc",
  agentName: "sales-nurture",
  query: `Follow-up strategies for basketball athletes age 16-18`,
  limit: 3
});

// 2. Build context from memories
const learnings = memories
  .filter(m => m.memory_type === "learning")
  .map(m => m.content)
  .join("\n");

// 3. Create informed prompt
const prompt = `
Past learnings about this demographic:
${learnings}

Current situation: ${athleteName}, age ${age}, ${sport}
Generate personalized follow-up message.
`;

const response = await completeSonnet(prompt);
```

## Memory Lifecycle

### 1. Creation
Memories are created after significant agent actions:
- Lead research completed
- Deal stage changed
- Follow-up sent
- Pattern identified
- User preference noted

### 2. Access
When retrieved, memories are updated:
```typescript
UPDATE agent_memory
SET accessed_count = accessed_count + 1,
    last_accessed = NOW()
WHERE id = $1;
```

### 3. Decay
Low-importance, rarely accessed memories may be archived:
```typescript
// Clean up old, unimportant memories (manual/scheduled task)
DELETE FROM agent_memory
WHERE importance < 0.3
  AND accessed_count = 0
  AND created_at < NOW() - INTERVAL '90 days';
```

### 4. Reinforcement
Repeated patterns increase importance:
```typescript
// When a pattern is confirmed again
UPDATE agent_memory
SET importance = LEAST(importance * 1.2, 1.0),
    metadata = metadata || '{"confirmed_count": X}'::jsonb
WHERE id = $1;
```

## Best Practices

### 1. Semantic Search Quality
Write memory content as natural language that describes the learning:

**Good**:
```
"Healthcare companies in Florida respond 3x better to compliance-focused messaging than cost messaging. Sample: Tampa General, AdventHealth, Orlando Health."
```

**Bad**:
```
"industry=healthcare region=florida message_type=compliance conversion_rate=high"
```

### 2. Metadata Structure
Use metadata for structured filtering, content for semantic search:

```typescript
await storeMemory({
  content: "Natural language description of the memory",
  metadata: {
    // Structured data for exact matching
    company_name: "Acme Corp",
    industry: "healthcare",
    outcome: "closed_won",
    deal_value: 150000
  }
});

// Later: Combine semantic + structured search
const memories = await recallMemories({
  query: "successful healthcare deals",
  filters: { "metadata->>'outcome'": "closed_won" }
});
```

### 3. Importance Scoring
Use consistent importance scale:
- **0.9-1.0**: Critical learnings, confirmed patterns, major wins/losses
- **0.7-0.8**: Valuable insights, qualified leads, successful interactions
- **0.5-0.6**: Normal interactions, standard facts
- **0.3-0.4**: Low-value details, unconfirmed patterns
- **0.0-0.2**: Trivial information, likely to be cleaned up

### 4. Memory Deduplication
Before storing, check for similar existing memories:

```typescript
const existing = await recallMemories({
  agentContext: "sts",
  query: content,
  limit: 1,
  minSimilarity: 0.95 // Very high similarity threshold
});

if (existing.length > 0) {
  // Update existing memory instead of creating duplicate
  await reinforceMemory(existing[0].id);
} else {
  await storeMemory({...});
}
```

## Agent-Specific Memory Usage

### Personal Lead Research Agent
- **Stores**: Research findings, lead qualifications, source quality
- **Recalls**: Previous research on same company/person, successful research patterns

### PDC/STS Lead Research Agents
- **Stores**: Company/athlete profiles, qualification decisions, trigger events
- **Recalls**: Similar leads, industry patterns, successful qualification criteria

### PDC/STS Social/Content Agents
- **Stores**: Content performance, engagement patterns, successful topics
- **Recalls**: Top-performing content themes, audience preferences

### PDC/STS Sales/Nurture Agents
- **Stores**: Follow-up outcomes, objection responses, close strategies
- **Recalls**: Successful sequences, deal patterns, objection handling

### PDC/STS Lead Generation Agents
- **Stores**: Outreach performance, trigger effectiveness, referral patterns
- **Recalls**: Successful outreach templates, effective triggers, partner insights

## Memory Analytics

### Pattern Detection Query
```sql
-- Find recurring successful patterns
SELECT
  memory_type,
  metadata->>'industry' as industry,
  metadata->>'outcome' as outcome,
  COUNT(*) as occurrences,
  AVG(importance) as avg_importance
FROM agent_memory
WHERE agent_context = 'sts'
  AND created_at > NOW() - INTERVAL '90 days'
GROUP BY memory_type, metadata->>'industry', metadata->>'outcome'
HAVING COUNT(*) >= 3
ORDER BY avg_importance DESC, occurrences DESC;
```

### Memory Health Check
```sql
-- Check memory distribution
SELECT
  agent_context,
  agent_name,
  memory_type,
  COUNT(*) as count,
  AVG(importance) as avg_importance,
  AVG(accessed_count) as avg_accesses
FROM agent_memory
GROUP BY agent_context, agent_name, memory_type
ORDER BY agent_context, agent_name, memory_type;
```

## Cost Optimization

### Embedding Costs
- OpenAI `text-embedding-3-large`: $0.00013 per 1K tokens
- Average memory: ~100 tokens
- Cost per memory: ~$0.000013 (negligible)
- 10,000 memories: ~$0.13

### Storage Costs
- pgvector storage: ~12KB per embedding (3072 dimensions)
- 10,000 memories: ~120MB
- Supabase free tier: 500MB included

### Retrieval Costs
- Vector similarity search: Fast with IVFFlat index
- Typical query: <50ms for 100K vectors

## Future Enhancements

### 1. Memory Consolidation
Periodically merge related memories to reduce redundancy and strengthen patterns.

### 2. Multi-Agent Memory Sharing
Allow agents within same context (pdc/sts) to share learnings while maintaining agent-specific memories.

### 3. Memory Export
Generate reports of learnings for Eric to review:
- Top patterns discovered
- Most valuable memories
- Agent performance insights

### 4. Temporal Decay
Automatically reduce importance of time-sensitive memories (e.g., "Company X is hiring" loses relevance after 6 months).

### 5. Memory Graphs
Build relationship graphs between memories (e.g., company → contacts → deals → outcomes) for richer context retrieval.
