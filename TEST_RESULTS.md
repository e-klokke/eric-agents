# Agent Test Results

## Test Summary

**Date:** 2026-01-02
**Total Agents:** 9
**Tests Passing:** ✅ 9/9
**Tests Failing:** ❌ 0

## All Tests Passing ✅

All 9 agents across 3 contexts (Personal, PDC, STS) and 4 phases (Research, Content, Sales, Lead Gen) are now working correctly.

| # | Agent | Context | Phase | Status |
|---|-------|---------|-------|--------|
| 1 | Lead Research | Personal | Research | ✅ PASS |
| 2 | Lead Research | PDC | Research | ✅ PASS |
| 3 | Lead Research | STS | Research | ✅ PASS |
| 4 | Social/Content | PDC | Content | ✅ PASS |
| 5 | Social/Content | STS | Content | ✅ PASS |
| 6 | Sales/Nurture | PDC | Sales | ✅ PASS |
| 7 | Sales/Nurture | STS | Sales | ✅ PASS |
| 8 | Lead Generation | PDC | Lead Gen | ✅ PASS |
| 9 | Lead Generation | STS | Lead Gen | ✅ PASS |

## Key Issues Resolved

### 1. extractJSON() Order Bug ⭐ CRITICAL FIX
**Problem:** The regex in `extractJSON()` was checking for arrays before objects, causing it to match internal arrays instead of the full JSON object. This broke all 5 research and content agents.

**Error Example:**
```
Failed to parse JSON: [
      "Research Scientist at OpenAI",
      "Director of AI at Tesla"
    ],
```

**Root Cause:** The regex `/\[[\s\S]*\]/` was matching from the first `[` (in `"careerHistory": [`) to the last `]` in the JSON, instead of matching the full object.

**Solution:** Swapped the order in `src/shared/llm.ts` line 159:
```typescript
// IMPORTANT: Check for object FIRST, then array
// (if we check array first, it will match arrays inside objects)
let jsonMatch = text.match(/\{[\s\S]*\}/);

// If no object, try to match an array
if (!jsonMatch) {
  jsonMatch = text.match(/\[[\s\S]*\]/);
}
```

**Impact:** Fixed all 5 failing research and content agents immediately.

### 2. Claude Model Availability
**Issue:** User's API key only has access to `claude-3-haiku-20240307`.

**Solution:** All models (OPUS, SONNET, HAIKU) mapped to Haiku in `src/shared/llm.ts`:
```typescript
export const MODELS = {
  OPUS: "claude-3-haiku-20240307",     // Fallback to Haiku
  SONNET: "claude-3-haiku-20240307",   // Fallback to Haiku
  HAIKU: "claude-3-haiku-20240307",
} as const;
```

### 3. Vector Index Dimension Limit
**Issue:** pgvector has 2000 dimension limit for ivfflat/hnsw indexes, but using 3072-dimensional embeddings.

**Solution:** Commented out vector index creation in `supabase/migrations/001_schema.sql`:
```sql
-- Note: Vector index skipped due to 2000 dimension limit in pgvector
-- The cosine distance operator (<=> ) will still work, just with sequential scan
-- CREATE INDEX idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);
```

### 4. OpenAI API Key
**Issue:** Initial API key was invalid (401 error).

**Solution:** User replaced the OpenAI API key in `.env`. Now using `text-embedding-3-small` (1536 dimensions).

### 5. Database Constraints
**Issue:** PDC sales agent tried to upsert without unique constraint on `parent_email`.

**Solution:** Changed from `upsert` with `onConflict` to simple `insert` operation.

### 6. Supabase Service Key
**Issue:** `.env` was using `anon` key instead of `service_role` key.

**Solution:** Updated `.env` with correct service_role key from `supabase projects api-keys`.

## Test Commands

### Run individual agent tests:
```bash
# Research agents
npm run test:agent:research:personal
npm run test:agent:research:pdc
npm run test:agent:research:sts

# Content agents
npm run test:agent:content:pdc
npm run test:agent:content:sts

# Sales agents
npm run test:agent:sales:pdc
npm run test:agent:sales:sts

# Lead gen agents
npm run test:agent:leadgen:pdc
npm run test:agent:leadgen:sts
```

### Run all 9 agents:
```bash
npm run test:all:agents
```

## Agent Capabilities Verified

### Personal Lead Research ✅
- Web search integration (Tavily API)
- Memory retrieval and storage (OpenAI embeddings)
- Common ground identification with Eric's background
- Conversation starter generation
- Warning detection (sensitive topics)

### PDC Lead Research ✅
- Athlete qualification (lead type)
- Scoring system (0-10)
- Program fit analysis
- Sport-specific insights
- Outreach strategy generation

### STS Lead Research ✅
- Company tech stack analysis
- Partner opportunity mapping (Cisco, Dell, Oracle, Lenovo, HP)
- Deal qualification and sizing
- Decision-maker research
- Common ground with Eric's Duke/security background

### PDC Social/Content ✅
- Multi-platform content (Instagram, LinkedIn, X, Facebook)
- Authentic voice (coach perspective, pro athlete experience)
- Content pillar adherence (hidden_game, character, transition, etc.)
- Hashtag generation (8-12 for Instagram, 1-2 for X)
- Parent-friendly messaging

### STS Social/Content ✅
- Technical thought leadership content
- Multi-platform formatting (LinkedIn primary, X, Facebook)
- Partner ecosystem integration
- Professional but accessible tone
- Eric's credibility (20+ years, Duke, CEH Master)

### PDC Sales/Nurture ✅
- Consultation scheduling
- Follow-up tracking with due dates
- Database integration (pdc_athletes table)
- Enrollment digest generation
- Parent/athlete relationship management

### STS Sales/Nurture ✅
- Follow-up management with due dates
- Pipeline tracking by stage
- Deal progression monitoring
- Pipeline digest generation
- Company relationship tracking

### PDC Lead Gen ✅
- Inbound lead capture from website/events
- Lead scoring (0-100)
- Parent/athlete matching
- Sport categorization
- Lead digest with recommendations

### STS Lead Gen ✅
- Inbound lead capture with context
- Lead scoring and qualification (hot/warm/cold)
- Prospect list building with criteria filters
- Outreach email generation
- Trigger detection (hiring, funding, expansion)

## Performance Notes

- **Average test execution:** ~5-10 seconds per agent
- **LLM token usage:** Moderate (Haiku is cost-effective)
- **Database operations:** All working correctly
- **Memory embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **Web search:** Tavily API integration working
- **Error handling:** Graceful failures with informative messages

## Database Verification

All agents successfully:
- ✅ Store data in Supabase
- ✅ Log agent runs to `agent_runs` table
- ✅ Store memories to `memories` table
- ✅ Generate summaries/digests
- ✅ Use Claude Haiku for LLM operations

Check Supabase tables populated by tests:
- `memories` - Research insights stored by all research and content agents
- `sts_companies` - Company research from STS Lead Research
- `sts_inbound_leads` - Test leads from STS Lead Gen
- `social_queue` - Draft posts from PDC/STS Content agents
- `pdc_athletes` - Test athletes from PDC Sales
- `pdc_inbound_leads` - Test leads from PDC Lead Gen
- `agent_runs` - Execution logs for all test runs

## Environment

- **OS**: macOS Darwin 24.6.0
- **Node**: Latest LTS
- **TypeScript**: tsx for execution
- **Database**: Supabase PostgreSQL with pgvector extension
- **LLM**: Claude 3 Haiku (claude-3-haiku-20240307) via Anthropic API
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Search**: Tavily API for web research

## Next Steps

1. ✅ All agents tested and working
2. ⏭️ Production deployment to Railway
3. ⏭️ Set up scheduling with Trigger.dev
4. ⏭️ Add error handling tests
5. ⏭️ Add integration tests for multi-agent workflows
6. ⏭️ Performance benchmarking
7. ⏭️ Consider implementing vector index when pgvector supports >2000 dimensions

## Technical Notes

### extractJSON() Helper Function
The most critical fix was the `extractJSON()` function order:
- **Before:** Checked for arrays first → matched internal arrays
- **After:** Checks for objects first → matches full JSON objects
- **Location:** `src/shared/llm.ts` line 155-176

### Model Fallback Strategy
All model types map to the same working model:
```typescript
OPUS: "claude-3-haiku-20240307",
SONNET: "claude-3-haiku-20240307",
HAIKU: "claude-3-haiku-20240307",
```
This ensures compatibility regardless of which model the agent code requests.

### Database Migration
Successfully pushed 3 migrations:
1. `001_schema.sql` - Core tables and types (vector index commented out)
2. `002_sales_nurture.sql` - Sales-specific tables
3. `003_leadgen_tables.sql` - Lead generation tables

All 13 tables verified in Supabase dashboard.
