# Agent Usage Guide - Live Data Interactions

This guide shows how to interact with all 9 agents using **live data** for production use.

## Quick Reference

| Agent | Primary Use | CLI Command | API Endpoint |
|-------|-------------|-------------|--------------|
| Personal Lead Research | Research people before meetings | `npm run agent:research:personal` | `/api/personal/research` |
| PDC Lead Research | Qualify athlete prospects | `npm run agent:research:pdc` | `/api/pdc/research` |
| STS Lead Research | Research enterprise companies | `npm run agent:research:sts` | `/api/sts/research` |
| PDC Social/Content | Create athlete content | `npm run agent:content:pdc` | `/api/pdc/content` |
| STS Social/Content | Create tech content | `npm run agent:content:sts` | `/api/sts/content` |
| PDC Sales/Nurture | Manage athlete pipeline | `npm run agent:sales:pdc` | `/api/pdc/sales` |
| STS Sales/Nurture | Manage B2B pipeline | `npm run agent:sales:sts` | `/api/sts/sales` |
| PDC Lead Gen | Capture athlete leads | `npm run agent:leadgen:pdc` | `/api/pdc/leadgen` |
| STS Lead Gen | Generate enterprise leads | `npm run agent:leadgen:sts` | `/api/sts/leadgen` |

---

## Method 1: Command Line Interface (CLI)

All agents can be run directly from the command line with live data.

### Personal Lead Research

Research someone before a meeting or call:

```bash
npm run agent:research:personal "Satya Nadella" "Microsoft" "Upcoming call about AI strategy"
```

Direct execution:
```bash
tsx src/agents/personal/lead-research.ts "Tim Cook" "Apple" "Conference introduction"
```

**Output:** Comprehensive research report with common ground, conversation starters, and warnings.

### PDC Lead Research

Research an athlete prospect:

```bash
# Research a lead (athlete who might enroll)
tsx src/agents/pdc/lead-research.ts lead "Cade Cunningham" "Basketball"

# Research for collaboration opportunity
tsx src/agents/pdc/lead-research.ts collaboration "LeBron James" "Basketball" "Potential podcast guest"
```

**Output:** Qualification score, program fit analysis, outreach strategy.

### STS Lead Research

Research a company prospect:

```bash
npm run agent:research:sts "Duke Health" "dukehealth.org" "Dr. Smith" "CIO"
```

Or with just company name:
```bash
tsx src/agents/sts/lead-research.ts "Johns Hopkins Hospital"
```

**Output:** Tech stack analysis, partner opportunities, deal sizing, outreach strategy.

### PDC Social/Content

Generate social media content:

```bash
# Generate original content
tsx src/agents/pdc/social-content.ts generate "mental toughness in playoffs" hidden_game athletes

# Repurpose existing content
tsx src/agents/pdc/social-content.ts repurpose "Video transcript: Today I want to talk about handling pressure..."
```

**Output:** 4 platform-specific posts (Instagram, LinkedIn, X, Facebook) stored in `social_queue` table.

### STS Social/Content

Create tech thought leadership:

```bash
# Generate original content
tsx src/agents/sts/social-content.ts generate "Zero Trust security" tech_trends

# Partner spotlight
tsx src/agents/sts/social-content.ts generate "Cisco SD-WAN benefits" partner_spotlight cisco

# Repurpose article
tsx src/agents/sts/social-content.ts repurpose "Article text about cloud migration..."
```

**Output:** 3 platform-specific posts (LinkedIn, X, Facebook) stored in `social_queue` table.

### PDC Sales/Nurture

Manage athlete sales pipeline:

```bash
# Schedule a consultation
tsx src/agents/pdc/sales-nurture.ts schedule_consultation \
  "Sarah Johnson" "sarah@email.com" "Michael Johnson" "Basketball"

# Check follow-ups due
tsx src/agents/pdc/sales-nurture.ts check_followups

# Get enrollment digest
tsx src/agents/pdc/sales-nurture.ts enrollment_digest
```

**Output:** Updates `pdc_athletes` table, sends follow-up reminders.

### STS Sales/Nurture

Manage B2B sales pipeline:

```bash
# Check follow-ups
tsx src/agents/sts/sales-nurture.ts check_followups

# Get pipeline digest
tsx src/agents/sts/sales-nurture.ts pipeline_digest
```

**Output:** Updates `sts_companies` table, provides pipeline summary.

### PDC Lead Gen

Capture and qualify athlete leads:

```bash
# Capture inbound lead from website
tsx src/agents/pdc/lead-generation.ts capture_inbound \
  "Marcus Thompson" "Basketball" "John Thompson" "john@email.com" "Website contact form"

# Get lead digest
tsx src/agents/pdc/lead-generation.ts lead_digest
```

**Output:** Lead scored and stored in `pdc_inbound_leads` table.

### STS Lead Gen

Generate enterprise leads:

```bash
# Capture inbound lead
tsx src/agents/sts/lead-generation.ts capture_inbound \
  "Tech Corp" "tech.com" "Jane Doe" "jane@tech.com" "Requested demo"

# Build prospect list
tsx src/agents/sts/lead-generation.ts build_list \
  '{"industry":["Healthcare","Education"],"companySize":"100-1000 employees","location":["Tampa, FL"]}'

# Generate outreach email
tsx src/agents/sts/lead-generation.ts generate_outreach \
  "Acme Healthcare" "acme.com" "Dr. Smith" "CTO"

# Get lead digest
tsx src/agents/sts/lead-generation.ts lead_digest
```

**Output:** Prospects stored in `sts_outbound_prospects` or `sts_inbound_leads` tables.

---

## Method 2: HTTP API (Recommended for Production)

Create API endpoints to trigger agents from external systems.

### Example Express Server Setup

Create `src/api/server.ts`:

```typescript
import express from 'express';
import { runPersonalLeadResearch } from '../agents/personal/lead-research.js';
import { runPDCLeadResearch } from '../agents/pdc/lead-research.js';
import { runSTSLeadResearch } from '../agents/sts/lead-research.js';
// ... import other agents

const app = express();
app.use(express.json());

// Personal Lead Research
app.post('/api/personal/research', async (req, res) => {
  try {
    const result = await runPersonalLeadResearch(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PDC Lead Research
app.post('/api/pdc/research', async (req, res) => {
  try {
    const result = await runPDCLeadResearch(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// STS Lead Research
app.post('/api/sts/research', async (req, res) => {
  try {
    const result = await runSTSLeadResearch(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add similar endpoints for all 9 agents...

app.listen(3000, () => {
  console.log('Agent API running on http://localhost:3000');
});
```

### API Request Examples

#### Research a person:
```bash
curl -X POST http://localhost:3000/api/personal/research \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Satya Nadella",
    "company": "Microsoft",
    "context": "Meeting next week about AI",
    "depth": "deep"
  }'
```

#### Research an athlete:
```bash
curl -X POST http://localhost:3000/api/pdc/research \
  -H "Content-Type: application/json" \
  -d '{
    "researchType": "lead",
    "athleteName": "Victor Wembanyama",
    "sport": "Basketball"
  }'
```

#### Research a company:
```bash
curl -X POST http://localhost:3000/api/sts/research \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Cleveland Clinic",
    "website": "clevelandclinic.org",
    "contactName": "Dr. John Smith",
    "contactTitle": "CTO"
  }'
```

#### Generate social content:
```bash
curl -X POST http://localhost:3000/api/pdc/content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "topic": "Handling adversity in sports",
    "pillar": "character",
    "targetAudience": "athletes"
  }'
```

#### Capture a lead:
```bash
curl -X POST http://localhost:3000/api/pdc/leadgen \
  -H "Content-Type: application/json" \
  -d '{
    "action": "capture_inbound",
    "athleteName": "Sarah Martinez",
    "sport": "Soccer",
    "parentName": "Maria Martinez",
    "parentEmail": "maria@email.com",
    "source": "Website contact form"
  }'
```

---

## Method 3: Scheduled Automation (Cron/Trigger.dev)

Run agents automatically on a schedule.

### Using Trigger.dev (Recommended)

Install Trigger.dev:
```bash
npm install @trigger.dev/sdk
```

Create `src/triggers/daily-tasks.ts`:

```typescript
import { schedules } from "@trigger.dev/sdk/v3";
import { runPDCSalesNurture } from "../agents/pdc/sales-nurture.js";
import { runSTSSalesNurture } from "../agents/sts/sales-nurture.js";

// Check PDC follow-ups every morning at 9 AM
export const pdcFollowups = schedules.task({
  id: "pdc-followups-daily",
  cron: "0 9 * * *",
  run: async () => {
    await runPDCSalesNurture({ action: "check_followups" });
  },
});

// Check STS follow-ups every morning at 9 AM
export const stsFollowups = schedules.task({
  id: "sts-followups-daily",
  cron: "0 9 * * *",
  run: async () => {
    await runSTSSalesNurture({ action: "check_followups" });
  },
});

// Weekly enrollment digest every Monday at 8 AM
export const weeklyDigest = schedules.task({
  id: "enrollment-digest-weekly",
  cron: "0 8 * * 1",
  run: async () => {
    await runPDCSalesNurture({ action: "enrollment_digest" });
  },
});
```

### Using Unix Cron (Alternative)

Edit crontab:
```bash
crontab -e
```

Add scheduled tasks:
```cron
# Check PDC follow-ups daily at 9 AM
0 9 * * * cd /path/to/infrastructure && npm run agent:sales:pdc check_followups

# Check STS follow-ups daily at 9 AM
0 9 * * * cd /path/to/infrastructure && npm run agent:sales:sts check_followups

# Weekly digest every Monday at 8 AM
0 8 * * 1 cd /path/to/infrastructure && npm run agent:sales:pdc enrollment_digest

# Daily lead digest at 6 PM
0 18 * * * cd /path/to/infrastructure && npm run agent:leadgen:pdc lead_digest
0 18 * * * cd /path/to/infrastructure && npm run agent:leadgen:sts lead_digest
```

---

## Method 4: Integration with External Systems

### Zapier/Make Integration

1. Set up webhooks in your Express API
2. Configure Zapier to call your API endpoints
3. Example workflow:
   - New form submission → Zapier → `/api/pdc/leadgen` (capture_inbound)
   - New LinkedIn connection → Zapier → `/api/personal/research`
   - New CRM contact → Zapier → `/api/sts/research`

### Direct Database Triggers

Create Supabase database functions that trigger agents:

```sql
-- Trigger research when new lead is added
CREATE OR REPLACE FUNCTION trigger_lead_research()
RETURNS TRIGGER AS $$
BEGIN
  -- Call agent via HTTP or queue for processing
  PERFORM net.http_post(
    'http://your-api.com/api/sts/research',
    jsonb_build_object(
      'companyName', NEW.company_name,
      'website', NEW.website
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_lead_research
AFTER INSERT ON sts_inbound_leads
FOR EACH ROW
EXECUTE FUNCTION trigger_lead_research();
```

### Email Integration (SendGrid/Mailgun)

Parse inbound emails and trigger agents:

```typescript
// Email webhook handler
app.post('/webhooks/inbound-email', async (req, res) => {
  const { from, subject, text } = parseEmail(req.body);

  // Auto-capture lead from email inquiry
  if (subject.includes('consultation')) {
    await runPDCLeadGeneration({
      action: 'capture_inbound',
      source: `Email: ${from}`,
      // ... parse email content
    });
  }

  res.status(200).send('OK');
});
```

---

## Method 5: Interactive Shell/REPL

For ad-hoc agent execution during your workflow:

```bash
# Start Node REPL with agents loaded
node --loader tsx
```

```javascript
// In REPL
const { runPersonalLeadResearch } = await import('./src/agents/personal/lead-research.js');

// Research someone quickly
const result = await runPersonalLeadResearch({
  name: "Jensen Huang",
  company: "NVIDIA",
  context: "Meeting at conference"
});

console.log(result);
```

---

## Data Flow & Storage

All agents store results in Supabase:

```
Input (CLI/API/Schedule)
    ↓
Agent Processing
    ├─ Web Search (Tavily)
    ├─ LLM Analysis (Claude)
    └─ Memory Search (OpenAI Embeddings)
    ↓
Output Storage
    ├─ Database (Supabase)
    │   ├─ agent_runs (execution logs)
    │   ├─ memories (knowledge base)
    │   ├─ pdc_athletes / sts_companies (entities)
    │   └─ social_queue (content drafts)
    └─ Return value (JSON)
```

### Query Results from Database

```sql
-- View recent agent runs
SELECT * FROM agent_runs
ORDER BY created_at DESC
LIMIT 10;

-- View researched companies
SELECT name, industry, score, status
FROM sts_companies
ORDER BY score DESC;

-- View captured leads
SELECT * FROM pdc_inbound_leads
WHERE created_at > NOW() - INTERVAL '7 days';

-- View social content queue
SELECT platform, post_text, status
FROM social_queue
WHERE status = 'draft';
```

---

## Production Deployment

### Deploy to Railway

1. Connect GitHub repo to Railway
2. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

3. Railway will auto-deploy on push

### Environment Variables

Required for all agents:
```env
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
TAVILY_API_KEY=your-tavily-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-role-key
```

---

## Monitoring & Logs

### View Agent Execution History

```sql
-- Failed runs
SELECT * FROM agent_runs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Average execution time by agent
SELECT
  agent_name,
  COUNT(*) as runs,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM agent_runs
WHERE status = 'completed'
GROUP BY agent_name;

-- Recent successful operations
SELECT
  agent_name,
  trigger_type,
  created_at,
  output_data
FROM agent_runs
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 20;
```

### Application Logs

All agents use structured logging:

```typescript
import logger from './shared/logger.js';

logger.info({ companyName: "Acme" }, "Starting research");
logger.error({ error }, "Research failed");
```

Logs are written to stdout and can be piped to logging services (Datadog, LogTail, etc.)

---

## Best Practices

1. **Use API endpoints for production** - More reliable than direct CLI execution
2. **Schedule digests and follow-ups** - Automate recurring tasks with Trigger.dev
3. **Monitor agent_runs table** - Track failures and performance
4. **Review draft content** - Social posts are saved as drafts before publishing
5. **Validate inputs** - All agents validate required fields
6. **Handle rate limits** - Claude API has rate limits; implement queuing for bulk operations
7. **Keep memory fresh** - Research agents store insights for future use
8. **Review lead scores** - Agents qualify leads automatically but human review is valuable

---

## Common Workflows

### Daily Morning Routine
```bash
# Check what needs attention
npm run agent:sales:pdc check_followups
npm run agent:sales:sts check_followups
npm run agent:leadgen:pdc lead_digest
npm run agent:leadgen:sts lead_digest
```

### Before a Meeting
```bash
npm run agent:research:personal "Person Name" "Company" "Meeting context"
```

### Content Creation Day
```bash
# Generate 3 pieces of content
npm run agent:content:pdc generate "mental game" hidden_game
npm run agent:content:sts generate "cloud security" tech_trends
npm run agent:content:pdc generate "NIL deals" parent_education
```

### New Lead Capture
```bash
# Website form submission
npm run agent:leadgen:pdc capture_inbound "Athlete" "Sport" "Parent" "email@example.com" "Website"

# Networking event contact
npm run agent:research:sts "Company Name" "website.com" "Contact Name" "Title"
```

---

## Next Steps

1. ✅ All agents tested with live data
2. 🔲 Set up Express API server (`src/api/server.ts`)
3. 🔲 Deploy to Railway
4. 🔲 Configure Trigger.dev schedules
5. 🔲 Set up monitoring dashboard
6. 🔲 Create Zapier integrations
7. 🔲 Build admin UI for reviewing agent output

For questions or issues, check the logs in `agent_runs` table or review `TEST_RESULTS.md`.
