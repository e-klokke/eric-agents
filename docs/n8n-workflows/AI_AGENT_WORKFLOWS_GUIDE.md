# AI Agent Workflows - Complete Guide

## Overview

This guide covers all three AI Agent workflows for intelligent automation of your sales and partnership processes.

### Available AI Agent Workflows

1. **STS Lead Qualifier** - Analyzes companies and scores them as prospects
2. **PDC Partner Qualifier** - Evaluates potential partners for alignment
3. **Response Analyzer** - Analyzes LinkedIn message responses and recommends next actions

---

## Why AI Agent Workflows?

Traditional n8n workflows are great for execution, but AI Agents excel at **decision-making**:

| Task | Traditional Workflow | AI Agent Workflow |
|------|---------------------|-------------------|
| Send 20 LinkedIn messages | ✅ Perfect | ❌ Overkill |
| Decide if company is a good prospect | ❌ Hard to code all rules | ✅ Perfect |
| Visit profiles on schedule | ✅ Perfect | ❌ Overkill |
| Analyze message response sentiment | ❌ Complex logic needed | ✅ Perfect |

**Hybrid Approach (Best Practice):**
- Use **AI Agents** for intelligence and decisions
- Use **Traditional Workflows** for execution and automation

---

## Workflow 1: STS Lead Qualifier

**File:** `AI_Agent_STS_Lead_Qualifier.json`

### What It Does
1. Takes a company name as input
2. Calls your STS research agent API
3. AI analyzes research data (tech stack, size, industry, hiring, etc.)
4. Scores prospect 0-10
5. Routes based on score:
   - **High (8-10):** Save to Supabase + Telegram alert
   - **Medium (4-7):** Save to nurture list
   - **Low (0-3):** Skip

### Use Cases
- Manual research of interesting companies you discover
- Batch processing list of companies from LinkedIn search
- Qualifying inbound leads from website

### Import Instructions
See `IMPORT_GUIDE.md` for detailed setup.

**Quick Steps:**
1. Import JSON to n8n Cloud
2. Update Railway app URL
3. Configure credentials (Agent API, OpenAI, Supabase, Telegram)
4. Test with sample company
5. Convert to schedule/webhook trigger for production

---

## Workflow 2: PDC Partner Qualifier

**File:** `AI_Agent_PDC_Partner_Qualifier.json`

### What It Does
1. Takes partner name, organization, and type (wealth_manager, nil_company, school)
2. Calls PDC research agent API
3. AI analyzes partnership fit based on:
   - Shared values (character, development, long-term thinking)
   - Complementary services (no competition)
   - Geographic overlap
   - Referral potential
   - Existing athlete/family relationships
4. Scores alignment 0-10
5. Routes based on score:
   - **High (8-10):** Save + Telegram alert with partnership angle
   - **Medium (4-7):** Save to nurture
   - **Low (0-3):** Skip

### AI System Prompt Highlights
The AI understands:
- PDC's focus on mental game and character development
- Three partner types: wealth managers, NIL companies, schools
- Partnership indicators: shared values, complementary services, referral potential
- Geographic constraints (Tampa Bay area preference)

### Ideal Partners
**Wealth Managers:**
- Serve high-net-worth sports families
- Focus on NIL or athlete financial planning
- Florida/Southeast US location
- Holistic family services (not just investments)

**NIL Companies:**
- College athlete NIL deals
- Value character and mental game (not just transactions)
- Open to partnerships that develop whole athlete

**Schools:**
- Competitive high school sports programs
- Athletic directors who care about mental game
- Within 50 miles of Tampa Bay

### Import Instructions
Same process as STS Lead Qualifier:
1. Import JSON
2. Update Railway app URL to PDC research endpoint
3. Configure credentials
4. Test with sample partner (default: wealth manager)
5. Modify for batch processing

### Example Input
```json
{
  "partner_name": "John Smith",
  "organization": "Premier Wealth Management",
  "partner_type": "wealth_manager"
}
```

### Example Output (High Score)
```
🎯 HIGH PRIORITY PARTNER

Partner: John Smith
Organization: Premier Wealth Management
Type: wealth_manager
Alignment Score: 9/10

Reasoning:
Strong fit: serves 50+ athlete families, specializes in NIL planning, Tampa-based, values-aligned. Wealth manager with proven track record of holistic family services.

Partnership Angle:
We help their athlete families develop the mental game and character that leads to long-term success - complements their financial planning.

Next Steps:
LinkedIn connection request highlighting complementary services, then propose coffee meeting to discuss mutual referrals.
```

---

## Workflow 3: Response Analyzer

**File:** `AI_Agent_Response_Analyzer.json`

### What It Does
1. Receives LinkedIn message responses via webhook
2. AI analyzes:
   - **Sentiment:** positive, neutral, negative, objection, question
   - **Interest Level:** 0-10 score
   - **Response Type:** interested, not_interested, needs_info, scheduling, etc.
   - **Key Points:** What they said that matters
   - **Recommended Action:** What to do next
   - **Reply Template:** Suggested response
3. Updates `linkedin_interactions` table
4. Routes based on interest:
   - **High (8-10):** Telegram alert + queue suggested reply
   - **Medium (4-7):** Update status, no alert
   - **Low (0-3):** Mark as not interested

### AI Sentiment Detection

**Positive Indicators:**
- "Interested", "Tell me more", "Let's chat"
- Questions about services, pricing, process
- Agreeing to meeting/call
- Sharing contact info

**Negative Indicators:**
- "Not interested", "No thanks", "Remove me"
- "Too busy", "Not a fit", "Already have solution"
- Budget concerns without curiosity

**Auto-Reply Detection:**
- "Out of office", "Away", "On vacation"
- Generic automated responses

### Interest Level Scoring
- **10:** "Yes, let's schedule a call this week"
- **8-9:** Asking detailed questions, sharing availability
- **6-7:** General interest, needs more info
- **4-5:** Lukewarm, non-committal
- **2-3:** Soft no or very low priority
- **0-1:** Hard no or unsubscribe

### Recommended Actions
- `schedule_call`: Send calendar link
- `send_info`: Send resources/details
- `answer_question`: Provide specific answer
- `follow_up_later`: Set reminder for better timing
- `nurture`: Add to long-term sequence
- `close_lost`: Mark as not interested
- `wait_for_auto_reply`: Follow up when they're back

### Webhook Setup

**Webhook URL:**
```
https://your-n8n-cloud.app.n8n.cloud/webhook/linkedin-response
```

**POST Body Format:**
```json
{
  "context": "sts",
  "prospect_name": "Jane Doe",
  "company": "TechCorp",
  "our_message": "Hi Jane, noticed TechCorp is hiring DevOps...",
  "their_response": "Thanks for reaching out! We're actually looking to modernize our infrastructure. Can you send me more info?",
  "linkedin_url": "https://linkedin.com/in/janedoe"
}
```

### Integration with Traditional Workflows

Connect this to your traditional n8n workflows:

**STS Connection Request Workflow:**
```
Send connection request
    ↓
Wait for response (PhantomBuster monitors)
    ↓
IF response received:
    → Webhook to Response Analyzer AI Agent
    → AI analyzes and suggests next action
    → Traditional workflow sends the suggested reply
```

**Example:**
1. Traditional workflow sends connection request
2. PhantomBuster detects response
3. PhantomBuster triggers webhook to Response Analyzer
4. AI analyzes response, determines high interest
5. AI generates suggested reply
6. Traditional workflow sends the AI-suggested reply
7. Telegram alerts you of high-interest response

---

## Cost Analysis

### Per-Execution Costs

| Workflow | GPT-4 Tokens | Cost per Run |
|----------|-------------|--------------|
| STS Lead Qualifier | ~2,000-3,000 | $0.02-0.04 |
| PDC Partner Qualifier | ~2,000-3,000 | $0.02-0.04 |
| Response Analyzer | ~1,000-1,500 | $0.01-0.02 |

### Monthly Estimates

**STS Lead Qualifier:**
- 50 companies/day × 30 days = 1,500 qualifications
- Cost: ~$45-60/month

**PDC Partner Qualifier:**
- 20 partners/day × 30 days = 600 qualifications
- Cost: ~$18-24/month

**Response Analyzer:**
- 30 responses/day × 30 days = 900 analyses
- Cost: ~$18-27/month

**Total AI Agent Cost:** ~$81-111/month

### Cost Optimization Tips

1. **Use GPT-3.5-turbo instead of GPT-4o:**
   - 10x cheaper (~$0.002 per run vs $0.02)
   - Still good for most decisions
   - Change in OpenAI node settings

2. **Lower temperature for deterministic results:**
   - Current: 0.3 (good balance)
   - Lower to 0.1 for more consistent scoring
   - Raise to 0.5 for more creative responses

3. **Batch processing:**
   - Process multiple items at once
   - Reduces overhead
   - Example: Analyze 10 companies in one prompt

4. **Use AI selectively:**
   - Don't use AI for obvious decisions
   - Example: Skip AI if company is < 50 employees (hard rule)
   - Only invoke AI for edge cases

---

## Import All Three Workflows

### Prerequisites Checklist

- [ ] n8n Cloud account (free tier works)
- [ ] Agent system deployed to Railway
- [ ] OpenAI API key ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))
- [ ] Supabase credentials (URL + Service Role Key)
- [ ] Telegram bot token (optional but recommended)

### Step-by-Step Import

1. **Import all three JSON files to n8n:**
   - `AI_Agent_STS_Lead_Qualifier.json`
   - `AI_Agent_PDC_Partner_Qualifier.json`
   - `AI_Agent_Response_Analyzer.json`

2. **Create shared credentials (one-time setup):**

   **A. Eric Agents API (HTTP Header Auth)**
   - Name: `Eric Agents API`
   - Header Name: `x-api-key`
   - Header Value: Your `API_KEY` from Railway env vars

   **B. OpenAI API**
   - Get key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Paste into n8n credential

   **C. Supabase**
   - Host: Your Supabase project URL (without https://)
   - Service Role Key: From Supabase dashboard → Settings → API

   **D. Telegram (Optional)**
   - Bot Token: From @BotFather on Telegram
   - Chat ID: Your Telegram user ID (get from @userinfobot)

3. **Update each workflow:**

   **For each workflow, update:**
   - Replace `https://YOUR-APP.up.railway.app` with your actual Railway URL
   - Select credentials for each node:
     - HTTP Request nodes → Eric Agents API credential
     - OpenAI nodes → OpenAI API credential
     - Supabase nodes → Supabase credential
     - Telegram nodes → Telegram credential

4. **Test each workflow:**

   **STS Lead Qualifier:**
   - Click "Company to Research" node
   - Change to test company (e.g., "Tampa General Hospital")
   - Execute workflow
   - Verify it shows up in Supabase

   **PDC Partner Qualifier:**
   - Click "Partner to Research" node
   - Change to test partner
   - Execute workflow
   - Verify it shows up in Supabase

   **Response Analyzer:**
   - Copy webhook URL from webhook node
   - Test with curl:
     ```bash
     curl -X POST https://your-n8n.app.n8n.cloud/webhook/linkedin-response \
       -H "Content-Type: application/json" \
       -d '{
         "context": "sts",
         "prospect_name": "Jane Doe",
         "company": "TechCorp",
         "our_message": "Hi Jane, saw you are hiring...",
         "their_response": "Thanks! Yes, very interested. Can we chat?",
         "linkedin_url": "https://linkedin.com/in/janedoe"
       }'
     ```
   - Check execution in n8n
   - Verify Telegram alert and database update

5. **Activate workflows:**
   - Toggle "Active" switch on each workflow
   - Response Analyzer should stay active (webhook)
   - Qualifier workflows can stay manual or convert to scheduled

---

## Production Setup

### Convert Qualifiers to Production

**Option 1: Schedule Trigger (Automated)**
Replace manual trigger with Schedule Trigger:
- Daily at 8 AM
- Pull companies from CSV, Google Sheets, or Supabase
- Loop through each and analyze

**Option 2: Webhook Trigger (On-Demand)**
Replace with Webhook node:
- Trigger from your website
- Trigger from Zapier/Make
- Trigger from other workflows

**Option 3: Keep Manual (Recommended for Start)**
- Use when you manually discover interesting companies
- Quick qualification before outreach
- No automation overhead

### Connect to Traditional Workflows

**Hybrid Example: STS Outreach Flow**

```
┌─────────────────────────────────────┐
│  TRADITIONAL WORKFLOW               │
│  Daily 6 AM: Sales Nav Search      │
│  → Export 50 companies              │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  AI AGENT WORKFLOW                  │
│  Lead Qualifier analyzes each       │
│  → Scores 0-10                      │
│  → Only keeps score > 6             │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  TRADITIONAL WORKFLOW               │
│  Profile Warming (score 6-7)       │
│  Connection Requests (score 8-10)  │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  WAIT FOR RESPONSE                  │
│  PhantomBuster monitors LinkedIn    │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  AI AGENT WORKFLOW                  │
│  Response Analyzer analyzes reply   │
│  → Suggests next action             │
│  → Queues suggested response        │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  TRADITIONAL WORKFLOW               │
│  Sends AI-suggested response        │
│  → If scheduling: Send calendar     │
│  → If info needed: Send resources   │
└─────────────────────────────────────┘
```

---

## Monitoring & Optimization

### Check AI Decisions

After first 20 executions, review:
1. Go to Executions tab in n8n
2. Look at "Parse AI Decision" node output
3. Check if scores make sense
4. Review AI's reasoning

### Adjust System Prompts

**If AI is too conservative (scores too low):**
- Edit AI Agent node
- Modify system prompt to be more lenient
- Example: "Score 7+ if company size is good, even without other signals"

**If AI is too aggressive (scores too high):**
- Make system prompt more strict
- Add disqualifying criteria
- Example: "Automatically score < 5 if company < 100 employees"

### A/B Test Different Prompts

1. Duplicate workflow
2. Change system prompt in one version
3. Run same companies through both
4. Compare results

### Review Cost

Check OpenAI usage dashboard:
- [platform.openai.com/usage](https://platform.openai.com/usage)
- See actual cost per workflow
- Optimize if needed (switch to GPT-3.5-turbo)

---

## Troubleshooting

### Common Issues

**Error: "Cannot read property 'output'"**
- AI didn't return valid JSON
- Check AI's actual output in execution log
- Adjust system prompt to enforce JSON format
- Lower temperature for more consistent output

**Error: "Unauthorized" (401)**
- API key not configured correctly
- Verify credential is selected in node
- Check `x-api-key` matches Railway env var

**Error: OpenAI rate limit**
- Too many requests too fast
- Add Wait node between executions
- Upgrade OpenAI plan
- Switch to GPT-3.5-turbo

**AI gives inconsistent scores**
- Temperature too high (set to 0.1-0.3)
- System prompt not specific enough
- Add examples of good vs bad prospects

**AI doesn't follow JSON format**
- Check system prompt has clear OUTPUT FORMAT section
- Add "You MUST respond with valid JSON" to prompt
- Verify temperature is low (< 0.5)

---

## Next Steps

1. **Import all three workflows** following the guide above
2. **Test each one manually** with real data
3. **Review AI decisions** - do they make sense?
4. **Adjust system prompts** based on results
5. **Connect to traditional workflows** for hybrid automation
6. **Monitor costs** in OpenAI dashboard
7. **Optimize as needed** (GPT-3.5, batching, selective use)

---

## Additional AI Agent Ideas

Once these three are working, consider building:

**Daily Prospect Prioritizer:**
- Reviews all prospects in database
- Scores urgency based on: last contact, trigger events, engagement
- Creates daily priority list

**Content Idea Generator:**
- Analyzes recent news in your industry
- Generates LinkedIn post ideas
- Suggests topics for outreach messages

**Email Subject Line Optimizer:**
- Takes outreach message
- Generates 5 subject line options
- Predicts open rates

**Lead Source Attribution:**
- Analyzes where best leads come from
- Recommends where to focus effort
- Predicts conversion likelihood

All follow the same pattern:
```
Trigger → Get Data → AI Analysis → Route by Decision → Take Action
```
