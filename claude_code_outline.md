# Claude Code Development Outline

## Overview

This document provides a structured workflow for developing and extending the Eric Agents system using Claude Code. Follow this outline to maintain consistency, quality, and alignment with the established architecture.

## System Architecture Quick Reference

### Tech Stack
- **Runtime**: Node.js 20+, TypeScript 5.3+, ES Modules
- **Database**: Supabase (PostgreSQL 15+ with pgvector)
- **LLM**: Claude API (Opus, Sonnet, Haiku)
- **Embeddings**: OpenAI text-embedding-3-large (3072d)
- **Scheduling**: Trigger.dev v3.0+
- **Deployment**: Railway (Docker)

### Project Structure
```
infrastructure/
├── src/
│   ├── agents/
│   │   ├── personal/      # Personal context agents
│   │   ├── pdc/           # PDC context agents
│   │   └── sts/           # STS context agents
│   ├── shared/
│   │   ├── claude.ts      # LLM completions
│   │   ├── supabase.ts    # Database client
│   │   ├── memory.ts      # Vector memory
│   │   └── logger.ts      # Structured logging
│   ├── index.ts           # HTTP server (Express)
│   ├── trigger.ts         # Scheduled jobs
│   └── telegram-bot.ts    # Telegram interface
├── supabase/migrations/   # Database schema
└── package.json
```

### Core Principles
1. **Context-based architecture**: personal, pdc, sts
2. **Agent run tracking**: Every execution logged
3. **Vector memory**: Persistent learning via pgvector
4. **Cost-aware LLM usage**: Haiku → Sonnet → Opus
5. **Type safety**: Zod schemas, TypeScript strict mode
6. **Error resilience**: Try-catch, graceful degradation

## Development Workflow

### Phase 1: Planning and Design

#### 1.1 Define the Agent
**Questions to answer**:
- What is the agent's primary purpose?
- Which business context? (personal/pdc/sts)
- What are the input/output types?
- What actions does it perform?
- What external data does it need?

**Deliverable**: Agent specification document (markdown)
```markdown
# [Agent Name] Skill

## Overview
[1-2 sentence description]

**File**: `src/agents/[context]/[agent-name].ts`

## Core Capabilities
- Capability 1
- Capability 2

## Input/Output Types
[TypeScript interfaces]

## Actions
[List of actions with descriptions]

## Database Tables
[SQL schema if needed]

## Integration Points
[HTTP endpoints, npm scripts, Telegram commands]
```

#### 1.2 Design Database Schema
**If agent needs new tables**:
```sql
-- Create migration: supabase/migrations/00X_[feature].sql

CREATE TABLE [context]_[entity] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Context-specific fields
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ON [context]_[entity] ([commonly_queried_field]);

-- Helper functions for summaries
CREATE OR REPLACE FUNCTION get_[context]_[entity]_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'key_metric', (SELECT COUNT(*) FROM [context]_[entity])
  );
$$ LANGUAGE SQL;
```

**Run migration locally**:
```bash
supabase db reset  # Resets and applies all migrations
```

### Phase 2: Implementation

#### 2.1 Create Agent File
**Template**: `src/agents/[context]/[agent-name].ts`

```typescript
import { completeHaiku, completeSonnet, completeOpus } from "../../shared/claude.js";
import { supabase, logAgentRun, completeAgentRun } from "../../shared/supabase.js";
import { storeMemory, recallMemories } from "../../shared/memory.js";
import { logger } from "../../shared/logger.js";
import { z } from "zod";

// 1. Define Zod schemas for validation
const [AgentName]InputSchema = z.object({
  action: z.enum(["action1", "action2", "action3"]),
  // ... other fields
});

const [AgentName]OutputSchema = z.object({
  // ... output fields
});

type [AgentName]Input = z.infer<typeof [AgentName]InputSchema>;
type [AgentName]Output = z.infer<typeof [AgentName]OutputSchema>;

// 2. Main agent function
export async function run[AgentName](input: [AgentName]Input): Promise<[AgentName]Output> {
  // Validate input
  const validatedInput = [AgentName]InputSchema.parse(input);

  // Log agent run start
  const runId = await logAgentRun({
    agentName: "[agent-name]",
    context: "[context]",
    triggerType: "manual",
    inputData: validatedInput,
  });

  try {
    let result: [AgentName]Output = {};

    // Route to appropriate action
    switch (validatedInput.action) {
      case "action1":
        result = await handleAction1(validatedInput);
        break;
      case "action2":
        result = await handleAction2(validatedInput);
        break;
      default:
        throw new Error(`Unknown action: ${validatedInput.action}`);
    }

    // Log successful completion
    await completeAgentRun(runId, {
      status: "completed",
      outputData: result,
    });

    return result;
  } catch (error) {
    // Log failure
    logger.error(`Agent [agent-name] failed:`, error);
    await completeAgentRun(runId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

// 3. Action handlers
async function handleAction1(input: [AgentName]Input): Promise<[AgentName]Output> {
  // Recall relevant memories
  const memories = await recallMemories({
    agentContext: "[context]",
    agentName: "[agent-name]",
    query: "relevant query based on input",
    limit: 5,
  });

  // Build context
  const memoryContext = memories.map(m => m.content).join("\n");

  // LLM completion (choose appropriate model)
  const prompt = `
Context from past:
${memoryContext}

Current task:
${JSON.stringify(input)}

Instructions:
[Clear instructions for the LLM]

Return JSON matching this schema:
${JSON.stringify([AgentName]OutputSchema.shape)}
  `.trim();

  const response = await completeSonnet(prompt); // or Haiku/Opus
  const parsed = JSON.parse(response);

  // Store memory of this interaction
  await storeMemory({
    agentContext: "[context]",
    agentName: "[agent-name]",
    memoryType: "interaction",
    content: `Performed action1 with result: ${JSON.stringify(parsed)}`,
    metadata: { action: "action1", input_summary: "..." },
    importance: 0.7,
  });

  // Store in database if needed
  const { data, error } = await supabase
    .from("[context]_[table]")
    .insert({...})
    .select()
    .single();

  if (error) throw error;

  return parsed;
}

// 4. CLI support (for npm scripts)
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2];
  const args = process.argv.slice(3);

  // Parse CLI args into input
  const input: [AgentName]Input = {
    action: action as any,
    // ... map args to input fields
  };

  run[AgentName](input)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
```

#### 2.2 Add to Package.json
```json
{
  "scripts": {
    "agent:[shortname]:[context]": "tsx src/agents/[context]/[agent-name].ts"
  }
}
```

#### 2.3 Type Check
```bash
npm run type-check
```

### Phase 3: Integration

#### 3.1 HTTP Endpoints (Optional)
Add to `src/index.ts`:
```typescript
app.post("/trigger/[category]/[context]/[action]", async (req, res) => {
  try {
    const result = await run[AgentName](req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
```

#### 3.2 Telegram Commands (Optional)
Add to `src/telegram-bot.ts`:
```typescript
bot.onText(/^\/[context]_[command]/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const result = await run[AgentName]({
      action: "[action]",
      // ... parse from msg.text
    });

    bot.sendMessage(chatId, formatResultForTelegram(result));
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});
```

#### 3.3 Trigger.dev Schedules (Optional)
Add to `src/trigger.ts`:
```typescript
tasks.create({
  id: "[context]-[agent]-[action]",
  run: async () => {
    const result = await run[AgentName]({
      action: "[action]",
    });
    return result;
  },
  schedule: {
    cron: "0 8 * * *", // Daily at 8 AM
    timezone: "America/New_York",
  },
});
```

### Phase 4: Testing

#### 4.1 Unit Test (Manual)
```bash
npm run agent:[shortname]:[context] [action] [args...]

# Example:
npm run agent:leadgen:sts digest
npm run agent:sales:pdc followups
```

#### 4.2 Integration Test
```bash
# Test HTTP endpoint
curl -X POST http://localhost:3000/trigger/[category]/[context]/[action] \
  -H "Content-Type: application/json" \
  -d '{"action": "test", ...}'

# Test Telegram (send message to bot)
/[context]_[command] [args]
```

#### 4.3 Database Verification
```bash
# Check that data was stored correctly
supabase db shell

SELECT * FROM [context]_[table] ORDER BY created_at DESC LIMIT 5;
SELECT * FROM agent_runs WHERE agent_name = '[agent-name]' ORDER BY started_at DESC LIMIT 10;
SELECT * FROM agent_memory WHERE agent_name = '[agent-name]' ORDER BY created_at DESC LIMIT 10;
```

### Phase 5: Documentation

#### 5.1 Update README.md
Add agent to the appropriate section:
```markdown
## Agents

### [Context] Agents

#### [Agent Name]
- **Purpose**: [1 sentence]
- **Key Actions**: action1, action2, action3
- **File**: `src/agents/[context]/[agent-name].ts`
- **Usage**: `npm run agent:[shortname]:[context] [action]`
```

#### 5.2 Update SETUP_STATUS.md
Mark phase as complete, add to file structure:
```markdown
- [x] Phase X: [Phase Name]
  - [x] [Agent Name] (`src/agents/[context]/[agent-name].ts`)
  - [x] Database tables ([X] new tables)
  - [x] HTTP endpoints
  - [x] npm scripts
```

#### 5.3 Create Completion Document
Create `[PHASE_NAME]_COMPLETE.md`:
```markdown
# [Phase Name] - Implementation Complete

## Overview
[Description of what was built]

## Components Delivered
- Agent: [agent-name]
- Database: [X] new tables
- Endpoints: [X] new routes
- Scripts: [X] npm scripts

## Usage Examples
[Concrete examples]

## Business Impact
[Expected value]

## Cost Estimates
[Monthly cost projection]

## Next Steps
[Future enhancements or next phase]
```

## Model Selection Guide

### Use Haiku ($0.25/M in, $1.25/M out)
- Simple classification tasks
- Data extraction from structured text
- Basic scoring/qualification (0-100)
- Template filling with clear instructions
- **Example**: Lead scoring, email classification, basic data enrichment

### Use Sonnet ($3/M in, $15/M out)
- Complex reasoning and analysis
- Content generation (emails, proposals)
- Multi-step problem solving
- Pattern detection in data
- **Example**: Outreach generation, proposal writing, meeting prep, pattern analysis

### Use Opus ($15/M in, $75/M out)
- Critical business decisions
- High-stakes content (major proposals)
- Complex strategy formulation
- Creative problem solving
- **Example**: Strategic partnership proposals, major deal strategies, complex learning synthesis

## Common Patterns

### Pattern 1: Research Agent
```typescript
// 1. Recall what we know
const memories = await recallMemories({ query: `Previous research about ${target}` });

// 2. Fetch new data
const newData = await fetchFromExternalAPI(target);

// 3. Analyze with LLM
const analysis = await completeSonnet(`Analyze: ${newData}\nContext: ${memories}`);

// 4. Store findings
await storeMemory({ content: analysis, importance: 0.8 });
await supabase.from("research_results").insert({...});

return analysis;
```

### Pattern 2: Content Generation Agent
```typescript
// 1. Recall successful patterns
const successful = await recallMemories({
  query: `Successful ${contentType} for ${audience}`,
  filters: { "metadata->>'outcome'": "high_engagement" }
});

// 2. Generate with context
const content = await completeSonnet(`
Past successes:
${successful.map(m => m.content).join("\n")}

Generate ${contentType} for ${audience} about ${topic}
`);

// 3. Store for future learning
await storeMemory({
  content: `Generated ${contentType}: ${content}`,
  metadata: { content_type: contentType, topic, audience },
  importance: 0.6 // Will increase if performs well
});

return content;
```

### Pattern 3: Pipeline Management Agent
```typescript
// 1. Query database for items needing action
const { data: items } = await supabase
  .from("pipeline_items")
  .select("*")
  .eq("status", "pending")
  .lt("last_activity", oneWeekAgo);

// 2. Process each item
for (const item of items) {
  const memories = await recallMemories({
    query: `Similar ${item.type} items and outcomes`
  });

  const recommendation = await completeSonnet(`
  Context: ${memories}
  Current item: ${item}
  Recommend next action.
  `);

  // 3. Execute or queue action
  await executeAction(item, recommendation);

  // 4. Update status
  await supabase
    .from("pipeline_items")
    .update({ last_activity: new Date(), next_action: recommendation })
    .eq("id", item.id);
}

return { processed: items.length };
```

## Error Handling Standards

### Database Errors
```typescript
try {
  const { data, error } = await supabase.from("table").insert({...});
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
} catch (error) {
  logger.error("Database operation failed:", error);
  throw error; // Let agent run logging catch it
}
```

### LLM Errors
```typescript
try {
  const response = await completeSonnet(prompt);
  return JSON.parse(response);
} catch (error) {
  if (error.message.includes("rate limit")) {
    logger.warn("Rate limited, waiting 5s...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    return completeSonnet(prompt); // Retry once
  }
  throw new Error(`LLM completion failed: ${error.message}`);
}
```

### External API Errors
```typescript
try {
  const response = await fetch(apiUrl, { headers, timeout: 10000 });
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }
  return await response.json();
} catch (error) {
  logger.error(`External API call failed:`, error);
  // Return gracefully degraded result or throw
  return { available: false, reason: error.message };
}
```

## Performance Optimization

### 1. Batch Database Operations
```typescript
// BAD: N queries
for (const item of items) {
  await supabase.from("table").insert(item);
}

// GOOD: 1 query
await supabase.from("table").insert(items);
```

### 2. Parallel LLM Calls
```typescript
// When calls are independent
const [result1, result2, result3] = await Promise.all([
  completeHaiku(prompt1),
  completeHaiku(prompt2),
  completeHaiku(prompt3),
]);
```

### 3. Cache Expensive Operations
```typescript
// In-memory cache for session
const cache = new Map<string, any>();

async function expensiveOperation(key: string) {
  if (cache.has(key)) return cache.get(key);

  const result = await doExpensiveWork(key);
  cache.set(key, result);
  return result;
}
```

### 4. Limit Memory Retrieval
```typescript
// Be specific with queries, limit results
const memories = await recallMemories({
  query: "very specific query about X",
  limit: 5, // Don't retrieve 100s of memories
  minImportance: 0.5, // Filter low-quality memories
});
```

## Security Checklist

- [ ] Input validation with Zod schemas
- [ ] API keys in environment variables (never hardcoded)
- [ ] Database queries use parameterized statements (Supabase handles this)
- [ ] User input sanitized before LLM prompts (prevent injection)
- [ ] Rate limiting on public endpoints
- [ ] Logging doesn't include sensitive data (PII, API keys)
- [ ] Error messages don't leak system details

## Pre-Deployment Checklist

- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] All database migrations applied (`supabase db reset`)
- [ ] Agent runs successfully via npm script
- [ ] HTTP endpoint tested (if applicable)
- [ ] Telegram command tested (if applicable)
- [ ] Database tables populated correctly
- [ ] Agent run logged in `agent_runs` table
- [ ] Memory stored in `agent_memory` table (if applicable)
- [ ] README.md updated
- [ ] SETUP_STATUS.md updated
- [ ] Phase completion document created
- [ ] .env.example updated with any new variables

## Quick Reference: File Locations

### Agent Files
- Personal: `src/agents/personal/`
- PDC: `src/agents/pdc/`
- STS: `src/agents/sts/`

### Shared Utilities
- LLM: `src/shared/claude.ts`
- Database: `src/shared/supabase.ts`
- Memory: `src/shared/memory.ts`
- Logger: `src/shared/logger.ts`

### Configuration
- Environment: `.env` (local), Railway dashboard (production)
- Database: `supabase/migrations/`
- HTTP: `src/index.ts`
- Scheduled: `src/trigger.ts`
- Telegram: `src/telegram-bot.ts`

### Documentation
- Architecture: `.clinerules`
- Memory: `memory.md`
- This guide: `claude_code_outline.md`
- Status: `SETUP_STATUS.md`
- Overview: `README.md`

## Getting Help

### Claude Code Best Practices
1. Always start with `.clinerules` review
2. Follow established patterns (see this document)
3. Validate with TypeScript before committing
4. Test locally before deploying
5. Update documentation immediately

### Common Issues

**Issue**: TypeScript errors on build
- **Solution**: Run `npm run type-check`, fix errors, check imports use `.js` extension

**Issue**: Database connection fails
- **Solution**: Verify `.env` has correct `SUPABASE_URL` and `SUPABASE_KEY`

**Issue**: LLM calls fail
- **Solution**: Check `ANTHROPIC_API_KEY` in `.env`, verify API quota

**Issue**: Agent runs not logging
- **Solution**: Ensure `logAgentRun` and `completeAgentRun` are called correctly

**Issue**: Memory retrieval returns nothing
- **Solution**: Check `agent_memory` table has data, verify `embedding` column populated

## Next Development Phases (Future)

### Phase 5: Advanced Features (Not Yet Implemented)
- Email sending integration (SendGrid/Mailgun)
- Calendar integration (Calendly API)
- External API integrations (Apollo.io, Hunter.io, LinkedIn)
- Advanced memory consolidation
- Multi-agent collaboration
- A/B testing framework
- Performance analytics dashboard

### Phase 6: Optimization (Not Yet Implemented)
- Memory graph relationships
- Temporal decay algorithms
- Automated pattern detection
- Cost optimization engine
- Error prediction and prevention

---

**Last Updated**: 2025-01-01
**Document Version**: 1.0
**System Version**: Phase 4 Complete (11 agents)
