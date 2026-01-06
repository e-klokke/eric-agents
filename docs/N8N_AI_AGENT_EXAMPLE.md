# n8n AI Agent Workflow Examples

## Overview

n8n's AI Agent workflows use LangChain to create intelligent agents that can make decisions and use tools dynamically. These complement our traditional workflows.

## Use Cases for AI Agent Workflows

### ✅ Good for AI Agents:
- **Intelligent lead qualification** - Agent decides if prospect is worth pursuing
- **Dynamic outreach strategy** - Agent picks the best approach based on prospect data
- **Smart response handling** - Agent analyzes LinkedIn responses and suggests actions
- **Research orchestration** - Agent decides what research to perform

### ✅ Good for Traditional Workflows:
- **Scheduled automation** - Daily profile warming, connection requests
- **Database operations** - Logging, updating records
- **Rate-limited actions** - Respecting LinkedIn daily limits
- **Webhook processing** - Capturing inbound leads

## Example 1: Intelligent Lead Qualification Agent

**Purpose:** Research a company and intelligently decide if it's a good STS prospect

### Workflow Structure:

```
Manual Trigger / Schedule
    ↓
AI Agent: "Lead Qualifier"
    ↓
Tools Available:
  1. Research Company (HTTP → Your Agent API)
  2. Check Existing Prospects (Supabase)
  3. Search LinkedIn (PhantomBuster)
  4. Get Tech Stack (BuiltWith API)
    ↓
Decision: Quality Score + Reasoning
    ↓
IF Score > 7 → Add to outreach queue
IF Score 4-7 → Add to nurture
IF Score < 4 → Skip
```

### AI Agent Configuration:

**Agent Type:** Conversational Agent (ReAct)

**System Prompt:**
```
You are an expert B2B lead qualifier for Sino Technology Solutions (STS).

Your job: Analyze companies and determine if they're good prospects for tech infrastructure partnerships (Cisco, Dell, Oracle, Lenovo, HP).

IDEAL PROSPECT:
- 100-5000 employees
- Industries: Healthcare, Education, Finance, Government
- Located in Florida or Southeast US
- Recent growth, funding, or tech hiring
- Current tech stack indicates modernization needs

YOUR PROCESS:
1. Research the company using available tools
2. Check if we've already contacted them
3. Analyze tech stack and infrastructure
4. Assign quality score (0-10) with reasoning
5. Recommend action: outreach, nurture, or skip

OUTPUT FORMAT:
{
  "score": 8,
  "reasoning": "Healthcare company, 500 employees, hiring DevOps, using legacy Oracle - strong fit",
  "action": "outreach",
  "priority": "high"
}
```

**Tools Configuration:**

**Tool 1: Research Company**
- Type: HTTP Request
- Method: POST
- URL: `https://your-app.railway.app/trigger/research/sts`
- Auth: x-api-key
- Body: `{"companyName": "{{$json.company_name}}"}`

**Tool 2: Check Existing Prospects**
- Type: Supabase
- Operation: Select
- Table: `sts_outbound_prospects`
- Filter: `company_name.eq.{{$json.company_name}}`

**Tool 3: Get Tech Stack** (Optional - if you have BuiltWith)
- Type: HTTP Request
- URL: `https://api.builtwith.com/v1/api.json`

### Workflow Nodes:

```json
{
  "nodes": [
    {
      "name": "When clicking 'Test workflow'",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "Company to Research",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "company_name",
              "value": "Tampa General Hospital"
            },
            {
              "name": "website",
              "value": "tgh.org"
            }
          ]
        }
      }
    },
    {
      "name": "AI Lead Qualifier",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "parameters": {
        "promptType": "define",
        "text": "Research {{$json.company_name}} and determine if they're a good STS prospect. Use all available tools to gather information, then provide a quality score (0-10) and recommendation.",
        "hasOutputParser": true
      }
    },
    {
      "name": "OpenAI GPT-4",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "parameters": {
        "model": "gpt-4",
        "temperature": 0.2
      }
    },
    {
      "name": "Parse Decision",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            {
              "name": "score",
              "value": "={{$json.output.score}}",
              "type": "number"
            },
            {
              "name": "action",
              "value": "={{$json.output.action}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Route by Score",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "rules": {
          "rules": [
            {
              "output": 0,
              "conditions": {
                "number": [
                  {
                    "value1": "={{$json.score}}",
                    "operation": "larger",
                    "value2": 7
                  }
                ]
              }
            },
            {
              "output": 1,
              "conditions": {
                "number": [
                  {
                    "value1": "={{$json.score}}",
                    "operation": "largerEqual",
                    "value2": 4
                  }
                ]
              }
            }
          ]
        }
      }
    }
  ]
}
```

## Example 2: Smart Response Handler

**Purpose:** Analyze LinkedIn message responses and suggest follow-up actions

### AI Agent Configuration:

**System Prompt:**
```
You are a sales development expert analyzing LinkedIn responses.

ANALYZE:
- Sentiment (positive, neutral, negative)
- Intent (interested, not interested, needs info, wants meeting)
- Urgency (immediate, soon, low priority)

SUGGEST:
- Next action (schedule call, send info, nurture, close)
- Timing (today, this week, next month)
- Message template to use

Be concise and actionable.
```

**Tools:**
- Get prospect history (Supabase)
- Fetch message templates (HTTP)
- Check calendar availability (Google Calendar)

## Example 3: Daily Prospect Prioritizer

**Purpose:** Every morning, review all prospects and create a prioritized action list

### Flow:

```
Schedule: Daily 6 AM
    ↓
Get all prospects (Supabase)
    ↓
AI Agent: "Prospect Prioritizer"
  - Reviews each prospect
  - Considers: score, last contact, responses, triggers
  - Creates prioritized list for the day
    ↓
Send to Telegram: "Today's Top 10 Prospects"
```

## How to Create in n8n Cloud

1. **Create New Workflow**
   - Click "AI Agent workflow" tab (as shown in your screenshot)

2. **Add AI Agent Node**
   - Drag "AI Agent" from nodes panel
   - Choose agent type: "Conversational Agent"

3. **Configure System Prompt**
   - Write detailed instructions for the agent
   - Include output format expectations

4. **Add Tools**
   - Click "Add Tool"
   - Options:
     - HTTP Request (to call your agent API)
     - Supabase (to query database)
     - Code (custom JavaScript)
     - Calculator, DateTime, etc.

5. **Connect LLM**
   - Add OpenAI node
   - Select model (GPT-4 recommended for best reasoning)
   - Set temperature (lower = more deterministic)

6. **Add Output Parser** (Optional)
   - To structure the AI's response as JSON

7. **Test**
   - Click "Execute workflow"
   - Review AI's reasoning in execution log

## Best Practices

### When to Use AI Agents:
- ✅ Decision-making with multiple factors
- ✅ Natural language understanding
- ✅ Dynamic tool selection
- ✅ Adaptive workflows

### When to Use Traditional Workflows:
- ✅ Predictable, repeatable tasks
- ✅ Rate-limited operations
- ✅ Bulk processing
- ✅ Database operations

### Cost Considerations:
- AI Agent workflows cost more (LLM API calls per execution)
- Traditional workflows are free (just n8n execution)
- **Strategy:** Use AI for decisions, traditional for execution

## Hybrid Approach (Recommended)

```
AI Agent Workflow: "Daily Strategy"
  ↓ (decides which prospects to contact)
  ↓
Trigger Traditional Workflow: "STS Connection Requests"
  ↓ (executes the actual connections via PhantomBuster)
  ↓
AI Agent Workflow: "Response Analyzer"
  ↓ (analyzes any responses received)
  ↓
Updates in Supabase
```

## Next Steps

1. Start with the "Daily AI Summary" template in your screenshot
2. Customize it to call your agent API
3. Test with a few prospects
4. Create specialized AI agents for:
   - Lead qualification
   - Response analysis
   - Daily prioritization

**Pro Tip:** The AI agent can call your existing agent endpoints as tools! Best of both worlds.
