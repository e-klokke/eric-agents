# n8n Workflows Documentation

Complete automation system for STS and PDC sales and partnership development using n8n Cloud + AI Agents.

---

## 📁 What's in This Directory

### Quick Start Files
- **`WORKFLOW_INDEX.md`** - Start here! Index of all workflows with decision tree
- **`AI_AGENT_WORKFLOWS_GUIDE.md`** - Complete guide to AI Agent workflows
- **`IMPORT_GUIDE.md`** - Step-by-step import instructions for STS Lead Qualifier

### AI Agent Workflow Files (Ready to Import)
- **`AI_Agent_STS_Lead_Qualifier.json`** - Intelligently scores company prospects 0-10
- **`AI_Agent_PDC_Partner_Qualifier.json`** - Evaluates partnership alignment for wealth managers, NIL companies, schools
- **`AI_Agent_Response_Analyzer.json`** - Analyzes LinkedIn message responses and recommends next actions

### Traditional Workflow Specifications
- **`N8N_WORKFLOWS_STS.md`** - 7 workflows for STS LinkedIn automation
- **`N8N_WORKFLOWS_PDC.md`** - 10 workflows for PDC partnership and lead generation

### Setup Guides
- **`N8N_SETUP_GUIDE.md`** - Backend integration setup (webhooks, API endpoints, database)
- **`N8N_CLOUD_QUICKSTART.md`** - n8n Cloud account setup and prerequisites
- **`N8N_AI_AGENT_EXAMPLE.md`** - Theory and examples of AI Agent workflows

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Test AI Agents First (Recommended)

**Prerequisites:**
- n8n Cloud account (free trial)
- OpenAI API key ($5 free credit)
- Agent system deployed to Railway
- Supabase credentials

**Steps:**
1. Read `IMPORT_GUIDE.md`
2. Import `AI_Agent_STS_Lead_Qualifier.json`
3. Update Railway URL and credentials
4. Test with a company name
5. Review AI's decision

**Cost:** $0 for first 200 tests (using free OpenAI credit)

---

### Option 2: Full Automation (Production)

**Prerequisites:**
- Everything from Option 1
- PhantomBuster account ($59/mo)
- LinkedIn Sales Navigator ($99+/mo)

**Steps:**
1. Complete Option 1 first
2. Set up PhantomBuster (see `N8N_CLOUD_QUICKSTART.md`)
3. Review `N8N_WORKFLOWS_STS.md` or `N8N_WORKFLOWS_PDC.md`
4. Build traditional workflows from specifications
5. Connect AI Agents to traditional workflows

**Cost:** ~$213-248/mo for full hybrid system

---

## 📊 Workflow Categories

### AI Agents (Decision Intelligence)

Use AI to make smart decisions that are hard to code with traditional logic.

| Workflow | Use Case | Cost per Decision |
|----------|----------|-------------------|
| STS Lead Qualifier | "Is this company a good prospect?" | $0.02-0.04 |
| PDC Partner Qualifier | "Is this a good partnership fit?" | $0.02-0.04 |
| Response Analyzer | "How interested are they? What should I say?" | $0.01-0.02 |

**When to use AI Agents:**
- Complex decision-making
- Analyzing unstructured data (text, profiles, responses)
- Low-to-medium volume (< 1000/day)
- Need human-like reasoning

---

### Traditional Workflows (Execution)

Use traditional n8n workflows for scheduled execution and automation.

**STS (7 workflows):**
- Lead discovery (Sales Navigator search)
- Profile warming
- Connection requests
- InMail follow-ups
- Inbound lead processing
- Trigger monitoring
- Referral campaigns

**PDC (10 workflows):**
- Partner discovery (wealth managers, NIL companies, schools)
- Profile warming
- Partner outreach
- School outreach
- Social media monitoring
- Family referrals
- Follow-up sequences

**When to use Traditional Workflows:**
- Scheduled automation
- High volume (100s per day)
- Simple if/then logic
- Reliable execution at scale

---

## 🎯 Recommended Approach: Hybrid

Best results come from combining both:

```
1. AI AGENT decides → 2. TRADITIONAL WORKFLOW executes → 3. AI AGENT analyzes results
```

**Example: STS Lead Flow**
1. **Traditional:** Sales Nav search exports 50 companies
2. **AI Agent:** Analyzes each, keeps only score > 6 (maybe 20 companies)
3. **Traditional:** Warms those 20 profiles over 2 days
4. **Traditional:** Sends connection requests to warmed profiles
5. **AI Agent:** Analyzes responses, recommends next action
6. **Traditional:** Executes AI's recommended follow-up

**Result:** AI provides intelligence, traditional workflows provide scale and reliability.

---

## 📚 How to Use This Documentation

### If you want to...

**...understand the full system:**
1. Read `WORKFLOW_INDEX.md` (10 min)
2. Skim `AI_AGENT_WORKFLOWS_GUIDE.md` (15 min)
3. Review `N8N_WORKFLOWS_STS.md` or `N8N_WORKFLOWS_PDC.md` (20 min)

**...get started quickly:**
1. Read `IMPORT_GUIDE.md` (5 min)
2. Import `AI_Agent_STS_Lead_Qualifier.json`
3. Test with 5 companies
4. Expand from there

**...set up full automation:**
1. Read `N8N_CLOUD_QUICKSTART.md`
2. Set up PhantomBuster
3. Build traditional workflows from specs
4. Connect AI Agents

**...understand AI vs Traditional:**
- Read `N8N_AI_AGENT_EXAMPLE.md`

**...troubleshoot issues:**
- Check execution logs in n8n
- Review troubleshooting sections in guides
- Verify credentials are configured

---

## 💰 Cost Comparison

### AI Only (Manual + AI Decisions)
| Item | Cost |
|------|------|
| n8n Cloud Starter | $20/mo |
| Railway (agent hosting) | $5-10/mo |
| OpenAI GPT-4 | $30-60/mo |
| Supabase | Free |
| **TOTAL** | **$55-90/mo** |

**Best for:** Testing, low volume, manual discovery

---

### Traditional Only (Full Automation, No AI)
| Item | Cost |
|------|------|
| n8n Cloud Starter | $20/mo |
| Railway (agent hosting) | $5-10/mo |
| PhantomBuster | $59/mo |
| LinkedIn Sales Nav | $99/mo |
| Supabase | Free |
| **TOTAL** | **$183-188/mo** |

**Best for:** High volume, simple qualification rules

---

### Hybrid (AI + Traditional)
| Item | Cost |
|------|------|
| n8n Cloud Starter | $20/mo |
| Railway (agent hosting) | $5-10/mo |
| OpenAI GPT-4 | $30-60/mo |
| PhantomBuster | $59/mo |
| LinkedIn Sales Nav | $99/mo |
| Supabase | Free |
| **TOTAL** | **$213-248/mo** |

**Best for:** Production, intelligent automation at scale

---

## 🔧 Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│  n8n Cloud (Workflow Orchestration)                     │
├─────────────────────────────────────────────────────────┤
│  • Traditional workflows (scheduled execution)          │
│  • AI Agent workflows (intelligent decisions)           │
│  • Webhook receivers                                    │
└────────────┬────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             ↓              ↓              ↓              ↓
┌─────────────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────┐
│ Railway         │ │ PhantomBuster│ │ OpenAI  │ │ Supabase │
│ (Agent API)     │ │ (LinkedIn)   │ │ (AI)    │ │ (Data)   │
├─────────────────┤ ├──────────────┤ ├─────────┤ ├──────────┤
│ • Research      │ │ • Search     │ │ • GPT-4 │ │ • Leads  │
│ • Lead gen      │ │ • Visit      │ │ • GPT-4o│ │ • Partners│
│ • Outreach      │ │ • Connect    │ └─────────┘ │ • Tracking│
│   queue         │ │ • Message    │             └──────────┘
└─────────────────┘ └──────────────┘
```

### Data Flow

**Outbound Flow (STS Lead Generation):**
1. n8n triggers PhantomBuster to search Sales Navigator
2. PhantomBuster returns company list
3. n8n calls Railway agent API to research each company
4. Agent returns research data
5. n8n calls OpenAI to analyze and score
6. OpenAI returns score + reasoning
7. n8n saves high-scoring leads to Supabase
8. n8n triggers PhantomBuster to warm/contact leads

**Inbound Flow (Response Handling):**
1. PhantomBuster detects LinkedIn response
2. PhantomBuster webhooks to n8n
3. n8n calls OpenAI to analyze response
4. OpenAI returns sentiment + recommended action
5. n8n updates Supabase with response data
6. n8n queues suggested reply
7. n8n sends high-interest alert to Telegram

---

## 🎓 Learning Path

### Week 1: Understand the System
- [ ] Read all documentation in this directory
- [ ] Set up n8n Cloud account
- [ ] Import one AI Agent workflow
- [ ] Test manually with 10 companies/partners
- [ ] Review AI decisions - do they make sense?

### Week 2: Add Traditional Automation
- [ ] Set up PhantomBuster account
- [ ] Configure LinkedIn Sales Navigator session
- [ ] Build 2-3 traditional workflows (start simple)
- [ ] Test end-to-end flow
- [ ] Monitor for errors

### Week 3: Optimize and Scale
- [ ] Review AI decision accuracy
- [ ] Tune system prompts
- [ ] Adjust daily limits based on response rates
- [ ] Add remaining workflows
- [ ] Set up monitoring and alerts

### Week 4: Production
- [ ] Full hybrid system running
- [ ] Daily monitoring routine established
- [ ] Optimizing based on results
- [ ] Building new workflows for edge cases

---

## 🛠️ Maintenance

### Daily Tasks (5 minutes)
- Check Telegram for high-priority alerts
- Review n8n execution failures (if any)
- Respond to high-interest LinkedIn responses

### Weekly Tasks (30 minutes)
- Review AI decision quality (sample 20 decisions)
- Check OpenAI usage and costs
- Review LinkedIn daily limits (are you hitting them?)
- Adjust workflows based on response rates

### Monthly Tasks (2 hours)
- Analyze conversion rates (leads → meetings → deals)
- Optimize system prompts based on results
- Review and update ICP criteria
- Plan new workflows or improvements

---

## 🐛 Troubleshooting

### Common Issues

**n8n workflow fails:**
- Check execution log in n8n UI
- Verify all credentials are configured
- Check if external APIs are responding (Railway, OpenAI, Supabase)

**AI gives bad scores:**
- Review system prompt - is it specific enough?
- Lower temperature (0.1-0.3 for consistent results)
- Add examples of good vs bad prospects to prompt

**PhantomBuster fails:**
- LinkedIn session cookie expired (refresh monthly)
- Daily limits hit (check PhantomBuster dashboard)
- LinkedIn security check (may need to verify account)

**Database errors:**
- Check Supabase dashboard for connection
- Verify service role key is correct
- Check if table structure matches workflow expectations

---

## 📖 Additional Resources

### n8n Documentation
- [n8n Workflows](https://docs.n8n.io/workflows/)
- [n8n AI Agents](https://docs.n8n.io/advanced-ai/)
- [n8n Credentials](https://docs.n8n.io/credentials/)

### PhantomBuster
- [PhantomBuster Docs](https://phantombuster.com/docs)
- [LinkedIn Phantoms](https://phantombuster.com/phantombuster?category=linkedin)
- [API Reference](https://hub.phantombuster.com/reference/introduction)

### OpenAI
- [GPT-4 Guide](https://platform.openai.com/docs/guides/gpt)
- [Pricing](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

---

## 📝 Notes

### Version Control
- All workflow JSON files are version-controlled
- Always export workflows from n8n after making changes
- Keep local backups before major updates

### Security
- Never commit credentials to git
- Use environment variables for secrets
- Rotate API keys quarterly
- Use n8n's credential encryption

### Scalability
- Current setup handles ~100-200 actions/day
- For higher volume, consider:
  - Multiple LinkedIn accounts (PhantomBuster supports this)
  - Upgrading PhantomBuster plan
  - Using GPT-3.5-turbo instead of GPT-4
  - Self-hosting n8n on Railway (unlimited executions)

---

## 🙋 Support

For issues or questions:

1. **Check execution logs** in n8n (most issues visible here)
2. **Review relevant guide** in this directory
3. **Test with simple data** to isolate the problem
4. **Check external service status** (OpenAI, PhantomBuster, Supabase)

---

## 🎉 You're Ready!

Start with `WORKFLOW_INDEX.md` to choose your path, then follow the relevant guides.

The system is designed to be:
- **Modular** - Use only what you need
- **Scalable** - Start small, grow over time
- **Intelligent** - AI makes decisions, automation executes
- **Reliable** - Traditional workflows for consistent execution

Good luck with your automation journey!
