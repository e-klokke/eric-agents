# How to Import the AI Agent Workflow

## What This Workflow Does

**AI Agent: STS Lead Qualifier** intelligently analyzes companies and decides if they're good prospects for STS.

### Flow:
```
1. Input company name
2. Call your STS research agent API
3. AI analyzes the research data
4. AI scores the prospect (0-10) and recommends action
5. Routes based on score:
   - Score > 7: Save as high priority + Telegram alert
   - Score 4-7: Save to nurture list
   - Score < 4: Skip (not a good fit)
```

## Prerequisites

Before importing, make sure you have:

- [ ] n8n Cloud account (logged in)
- [ ] Agent system deployed to Railway (get the URL)
- [ ] OpenAI API key (for GPT-4)
- [ ] Supabase credentials configured in n8n
- [ ] Telegram bot setup (optional but recommended)

## Step 1: Import the Workflow

1. **Download the JSON file:**
   - File location: `docs/n8n-workflows/AI_Agent_STS_Lead_Qualifier.json`

2. **In n8n Cloud:**
   - Click **Workflows** → **Add Workflow**
   - Click the **⋮** menu (top right) → **Import from File**
   - Select `AI_Agent_STS_Lead_Qualifier.json`
   - Click **Import**

## Step 2: Update Required Values

You need to replace these placeholder values:

### A. Railway App URL
Find node: **"Research Company via Agent"**
- Replace: `https://YOUR-APP.up.railway.app`
- With: Your actual Railway app URL
- Example: `https://eric-agents-production.up.railway.app`

### B. Credential IDs

**You need to create/select credentials for:**

1. **HTTP Header Auth (Agent API)**
   - Node: "Research Company via Agent"
   - Create credential:
     - Name: `Eric Agents API`
     - Header Name: `x-api-key`
     - Header Value: Your `API_KEY` from Railway

2. **OpenAI API**
   - Node: "OpenAI GPT-4"
   - Create credential:
     - Get API key from: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
     - Paste into n8n credential

3. **Supabase**
   - Nodes: "Save High Priority Prospect" and "Save to Nurture List"
   - Create credential:
     - Host: Your Supabase project URL (without https://)
     - Service Role Key: From Supabase dashboard

4. **Telegram (Optional)**
   - Node: "Notify via Telegram"
   - Use existing Telegram credential
   - Update Chat ID to your Telegram user ID

## Step 3: Test the Workflow

1. **Update test company:**
   - Click on "Company to Research" node
   - Change company name and website to test with
   - Example: `"Tampa General Hospital"` + `"tgh.org"`

2. **Execute test:**
   - Click **Execute workflow** button
   - Watch the execution flow through each node
   - Check the AI's reasoning in "Parse AI Decision" node output

3. **Verify results:**
   - Check Supabase `sts_outbound_prospects` table
   - Should see new row with AI's score and reasoning
   - If high score, check Telegram for alert

## Step 4: Convert to Production

### Option A: Manual Trigger
Keep as-is for manual prospect research when you find interesting companies

### Option B: Schedule Trigger
Replace "When clicking 'Test workflow'" node with:
- **Schedule Trigger**
- Set to run: Daily at 8 AM
- Modify to pull company names from a list/CSV/Supabase

### Option C: Webhook Trigger
Replace with **Webhook** node to accept company names from:
- Your website form
- Zapier
- Other automation tools

### Example Schedule Version:

```
Schedule (Daily 8 AM)
    ↓
Get Companies from CSV/Supabase
    ↓
Loop through each company
    ↓
Run AI analysis (existing workflow)
```

## Step 5: Monitor & Optimize

### Check AI Decisions
Review the AI's decisions after first 10 companies:
- Are scores accurate?
- Is reasoning sound?
- Any false positives/negatives?

### Adjust System Prompt
If AI is too aggressive/conservative:
- Edit "AI Lead Qualifier Agent" node
- Modify the system prompt in Options
- Adjust scoring criteria

### Cost Management
Each execution costs ~$0.02-0.05 (GPT-4 API call)
- 100 prospects/day = ~$3-5/day
- Consider using GPT-3.5-turbo for lower cost (change model in OpenAI node)

## Troubleshooting

### Error: "Cannot read property 'output'"
**Fix:** AI didn't return JSON
- Check AI's actual output in execution log
- Adjust system prompt to enforce JSON format
- Add error handling node

### Error: "Unauthorized" (401)
**Fix:** API key not working
- Verify `x-api-key` header value matches Railway env var
- Check credential is selected in HTTP Request node

### Error: OpenAI rate limit
**Fix:** Too many requests
- Add delay between executions (Wait node)
- Upgrade OpenAI plan
- Switch to GPT-3.5-turbo

### AI gives low scores to good prospects
**Fix:** Tune the system prompt
- Be more specific about what makes a good prospect
- Add examples of ideal vs. poor prospects
- Lower the temperature (currently 0.3)

## Advanced: Batch Processing

Want to analyze 50 companies at once?

**Add these nodes:**

1. **CSV/Google Sheets input** (instead of manual trigger)
2. **Split In Batches** node (process 10 at a time)
3. **Wait** node (delay between batches to avoid rate limits)

## What's Next?

After this works, create similar AI agents for:
- **PDC Partner Qualifier** - Analyze wealth managers & NIL companies
- **Response Analyzer** - Analyze LinkedIn message responses
- **Daily Prioritizer** - Review all prospects and create priority list

All use the same pattern:
```
Trigger → Get Data → AI Analysis → Route by Decision → Take Action
```

## Need Help?

Check the execution logs in n8n:
- Click **Executions** tab
- View failed executions
- Check each node's input/output

Most issues are:
1. Wrong credential selected
2. URL not updated
3. JSON parsing error (AI didn't return valid JSON)
