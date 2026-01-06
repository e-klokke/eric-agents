# n8n Workflow Index

Quick reference guide to all available n8n workflows (traditional automation + AI agents).

---

## AI Agent Workflows (Decision-Making)

Use AI to make intelligent decisions about prospects, partners, and responses.

| Workflow | File | Purpose | When to Use |
|----------|------|---------|-------------|
| **STS Lead Qualifier** | `AI_Agent_STS_Lead_Qualifier.json` | Analyzes companies and scores them 0-10 as prospects | Qualifying inbound leads, batch analyzing prospect lists |
| **PDC Partner Qualifier** | `AI_Agent_PDC_Partner_Qualifier.json` | Evaluates potential partners for alignment (wealth managers, NIL, schools) | Qualifying partnership opportunities |
| **Response Analyzer** | `AI_Agent_Response_Analyzer.json` | Analyzes LinkedIn message responses and recommends next actions | Automatically handling message responses |

**Setup Guide:** `AI_AGENT_WORKFLOWS_GUIDE.md`

---

## Traditional Workflows - STS (Execution)

Automated outreach and lead generation for Sino Technology Solutions.

| # | Workflow Name | Trigger | Purpose |
|---|---------------|---------|---------|
| 1 | `sts-sales-nav-search` | Daily 6 AM | Search LinkedIn Sales Navigator for new prospects matching ICP |
| 2 | `sts-profile-warming` | Daily 9 AM, 2 PM | Visit 40 profiles to warm them before outreach |
| 3 | `sts-connection-requests` | Daily 10 AM | Send 20 personalized connection requests |
| 4 | `sts-inmail-followup` | Daily 11 AM | Send InMail to connected prospects or high-value targets |
| 5 | `sts-inbound-processor` | Webhook | Process inbound leads from website form |
| 6 | `sts-trigger-monitor` | Daily 6 AM | Monitor news, funding, hiring for target companies |
| 7 | `sts-referral-campaign` | Monday 9 AM | Request referrals from happy clients |

**Specs:** `N8N_WORKFLOWS_STS.md`

---

## Traditional Workflows - PDC (Execution)

Automated outreach and lead generation for Players Development Club.

| # | Workflow Name | Trigger | Purpose |
|---|---------------|---------|---------|
| 1 | `pdc-wealth-manager-search` | Weekly Mon 7 AM | Find wealth managers who serve sports families |
| 2 | `pdc-nil-company-search` | Weekly Wed 7 AM | Find NIL collectives and agencies for partnerships |
| 3 | `pdc-school-search` | Weekly Tue 7 AM | Find high schools and athletic directors |
| 4 | `pdc-partner-outreach` | Wed 10 AM | Send partnership proposals to wealth managers and NIL companies |
| 5 | `pdc-school-outreach` | Tue/Thu 9 AM | Contact athletic directors about PDC programs |
| 6 | `pdc-partner-warming` | Daily 8 AM | Visit 30 partner profiles before outreach |
| 7 | `pdc-inbound-processor` | Webhook | Process inbound parent/athlete inquiries |
| 8 | `pdc-social-monitor` | Every 4 hours | Check Instagram/Facebook for new DMs |
| 9 | `pdc-family-referrals` | Fri 9 AM | Request referrals from enrolled families |
| 10 | `pdc-partner-followup` | Daily 11 AM | Follow up with partners who haven't responded |

**Specs:** `N8N_WORKFLOWS_PDC.md`

---

## Quick Start Paths

### Path 1: Start with AI Agents (Recommended)
**Best for:** Testing the concept, low volume, manual qualification

1. Import `AI_Agent_STS_Lead_Qualifier.json`
2. Configure credentials (Agent API, OpenAI, Supabase)
3. Manually test with 10 companies
4. Review AI decisions
5. Once confident, add traditional workflows for execution

**Pros:** Low setup, immediate value, understand AI capabilities
**Cons:** Manual triggering, not automated

---

### Path 2: Start with Traditional Workflows
**Best for:** High volume, full automation from day 1

1. Set up PhantomBuster account
2. Configure LinkedIn Sales Navigator session
3. Import all STS traditional workflows
4. Set up daily schedule
5. Add AI agents later for intelligent filtering

**Pros:** Full automation, high volume
**Cons:** Higher setup, more expensive ($59/mo PhantomBuster)

---

### Path 3: Hybrid Approach (Best)
**Best for:** Production use, optimal results

**Week 1:** AI Agent setup
- Import AI Agent workflows
- Test with 20 prospects/partners manually
- Tune system prompts based on results

**Week 2:** Add traditional execution
- Set up PhantomBuster
- Import traditional workflows
- Connect AI Agents to traditional workflows

**Week 3:** Monitor and optimize
- Review AI decisions daily
- Adjust daily limits based on response rates
- Optimize messaging based on results

**Result:** AI makes smart decisions, traditional workflows execute at scale

---

## Workflow Dependencies

### What You Need for Each Type

**AI Agent Workflows:**
- ✅ Agent system deployed to Railway
- ✅ OpenAI API key ($20-50/mo)
- ✅ Supabase (free tier works)
- ✅ Telegram bot (optional)
- ❌ PhantomBuster not needed
- ❌ LinkedIn Sales Navigator not needed

**Traditional Workflows:**
- ✅ Agent system deployed to Railway
- ✅ PhantomBuster ($59/mo)
- ✅ LinkedIn Sales Navigator ($99+/mo)
- ✅ Supabase (free tier works)
- ✅ Telegram bot (optional)
- ❌ OpenAI not needed

**Hybrid (Both):**
- ✅ Everything above
- Total cost: ~$180-210/mo

---

## Decision Tree: Which Workflows to Use?

```
START: What's your primary goal?

├─ Qualify leads intelligently
│  └─ Use: AI Agent Lead/Partner Qualifiers
│     ├─ Manual discovery → Keep manual trigger
│     └─ Batch processing → Add schedule trigger
│
├─ Automate LinkedIn outreach at scale
│  └─ Use: Traditional STS/PDC workflows
│     ├─ Just testing → Start with Profile Warming only
│     └─ Full automation → Use all 7-10 workflows
│
├─ Handle responses automatically
│  └─ Use: AI Agent Response Analyzer
│     └─ Always use webhook trigger
│
└─ Everything (full system)
   └─ Use: All workflows (hybrid approach)
      1. AI qualifies prospects (smart filtering)
      2. Traditional warms and reaches out (scale)
      3. AI analyzes responses (intelligence)
      4. Traditional executes follow-ups (automation)
```

---

## Integration Architecture

### How Workflows Work Together

```
┌──────────────────────────────────────────────────────────┐
│  DISCOVERY PHASE                                         │
├──────────────────────────────────────────────────────────┤
│  Traditional: Sales Nav Search                          │
│  → Exports 50 companies/day                             │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  QUALIFICATION PHASE (AI AGENT)                          │
├──────────────────────────────────────────────────────────┤
│  AI Agent: Lead Qualifier                               │
│  → Analyzes each company                                │
│  → Scores 0-10                                          │
│  → Only keeps score > 6                                 │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  WARMING PHASE                                           │
├──────────────────────────────────────────────────────────┤
│  Traditional: Profile Warming                           │
│  → Visits profiles of qualified leads                   │
│  → 30-60 second delay between visits                    │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  OUTREACH PHASE                                          │
├──────────────────────────────────────────────────────────┤
│  Traditional: Connection Requests                       │
│  → Sends personalized connection notes                  │
│  → 20-25 per day (LinkedIn safe limit)                  │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  RESPONSE HANDLING (AI AGENT)                            │
├──────────────────────────────────────────────────────────┤
│  AI Agent: Response Analyzer                            │
│  → Analyzes sentiment and interest                      │
│  → Recommends next action                               │
│  → Suggests reply message                               │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  FOLLOW-UP PHASE                                         │
├──────────────────────────────────────────────────────────┤
│  Traditional: InMail Follow-up                          │
│  → Sends AI-suggested responses                         │
│  → Schedules meetings for interested prospects          │
└──────────────────────────────────────────────────────────┘
```

---

## Daily Automation Schedule

### STS (Sino Technology Solutions)

| Time | Workflow Type | Action |
|------|---------------|--------|
| 6:00 AM | Traditional | Trigger Monitor (check news, funding) |
| 6:30 AM | Traditional | Sales Nav Search (find 50 new prospects) |
| 7:00 AM | Traditional | Lead Digest (agent generates summary) |
| 8:00 AM | AI Agent | Batch qualify overnight discoveries |
| 9:00 AM | Traditional | Profile Warming (visit 40 profiles) |
| 10:00 AM | Traditional | Connection Requests (send 20) |
| 11:00 AM | Traditional | InMail Follow-up (send 10) |
| 2:00 PM | Traditional | Profile Warming (visit 40 more) |
| 3:00 PM | Traditional | Response Check |
| All day | AI Agent | Response Analyzer (webhook, analyzes as responses come in) |

### PDC (Players Development Club)

| Time | Day | Workflow Type | Action |
|------|-----|---------------|--------|
| 7:00 AM | Mon | Traditional | Wealth Manager Search |
| 7:00 AM | Tue | Traditional | School Search |
| 7:00 AM | Wed | Traditional | NIL Company Search |
| 8:00 AM | Daily | Traditional | Profile Warming (30 partners) |
| 8:00 AM | Daily | Traditional | Lead Digest |
| 9:00 AM | Tue/Thu | Traditional | School Outreach |
| 10:00 AM | Wed | Traditional | Partner Outreach |
| 11:00 AM | Daily | Traditional | Partner Follow-up |
| Every 4h | Daily | Traditional | Social Monitor (Instagram/Facebook) |
| 9:00 AM | Fri | Traditional | Family Referrals |
| All day | Daily | AI Agent | Response Analyzer (webhook) |
| Manual | As needed | AI Agent | Partner Qualifier (manual research) |

---

## Cost Breakdown

### Monthly Costs by Component

| Component | Cost | Required For |
|-----------|------|--------------|
| n8n Cloud (Starter) | $20 | All workflows |
| PhantomBuster | $59 | Traditional workflows |
| LinkedIn Sales Nav | $99+ | Traditional STS workflows |
| OpenAI (GPT-4) | $30-60 | AI Agent workflows |
| Supabase | $0 (free tier) | All workflows |
| Telegram Bot | $0 | All workflows |
| Railway (agent hosting) | $5-10 | All workflows |
| **TOTAL (AI only)** | **$55-90** | AI Agents + manual work |
| **TOTAL (Traditional only)** | **$183-188** | Full automation, no AI |
| **TOTAL (Hybrid)** | **$213-248** | Best of both worlds |

### Cost Optimization

**To reduce costs:**
1. Use GPT-3.5-turbo instead of GPT-4 (10x cheaper)
2. Self-host n8n on Railway (free instead of $20)
3. Use Supabase free tier (2GB database, enough for 100K prospects)
4. Start with just AI Agents ($55/mo) until you validate the approach

---

## Getting Help

### Documentation Files

| Topic | File |
|-------|------|
| **Overall setup** | `N8N_SETUP_GUIDE.md` |
| **AI Agent workflows** | `AI_AGENT_WORKFLOWS_GUIDE.md` |
| **AI Agent import** | `IMPORT_GUIDE.md` |
| **STS traditional workflows** | `N8N_WORKFLOWS_STS.md` |
| **PDC traditional workflows** | `N8N_WORKFLOWS_PDC.md` |
| **n8n Cloud setup** | `N8N_CLOUD_QUICKSTART.md` |
| **AI Agent examples** | `N8N_AI_AGENT_EXAMPLE.md` |
| **This index** | `WORKFLOW_INDEX.md` |

### Common Questions

**Q: Which workflows should I start with?**
A: Start with AI Agent Lead Qualifier. It's low-cost, high-value, and helps you understand the system.

**Q: Do I need PhantomBuster?**
A: Only for traditional workflows. AI Agents don't need it.

**Q: Can I use n8n free tier?**
A: No, you need n8n Cloud Starter ($20/mo) or self-hosted version.

**Q: How much does OpenAI cost?**
A: ~$0.02-0.04 per AI decision. 1,000 decisions = $20-40.

**Q: What's better: GPT-4 or GPT-3.5?**
A: GPT-4 is more accurate, GPT-3.5 is 10x cheaper. Start with GPT-4, switch to 3.5 if cost is an issue.

**Q: Can I test without paying?**
A: Yes, use manual triggers and your $5 OpenAI free credit. You can test ~200 prospects for free.

---

## Next Steps

1. **Read** `AI_AGENT_WORKFLOWS_GUIDE.md` to understand AI workflows
2. **Import** one AI Agent workflow to test
3. **Review** AI decisions after 10-20 runs
4. **Decide** if you want to add traditional workflows for scale
5. **Deploy** full hybrid system for production

**Questions?** Check the documentation files above or review n8n execution logs for troubleshooting.
