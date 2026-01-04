# Eric's AI Agent System

Complete AI agent infrastructure for three business contexts serving Personal brand, PDC (Players Development Club), and STS (Sino Technology Solutions).

## 🎯 System Overview

**11 Production-Ready Agents** across 4 phases automating the entire sales and marketing funnel:

### Phase 1: Lead Research (3 agents)
- **Personal Lead Research** - Find collaborators for Unsupervised Learning
- **PDC Lead Research** - Research athletes, NIL companies, market opportunities
- **STS Lead Research** - Research enterprise technology prospects

### Phase 2: Social/Content Generation (2 agents)
- **PDC Social/Content** - Generate athlete development social media
- **STS Social/Content** - Generate B2B technology content

### Phase 3: Sales/Nurture (2 agents)
- **PDC Sales/Nurture** - Automate athlete enrollment pipeline
- **STS Sales/Nurture** - Automate enterprise deal pipeline

### Phase 4: Lead Generation (2 agents)
- **PDC Lead Generation** - Generate leads across 4 channels
- **STS Lead Generation** - Generate enterprise leads across 4 channels

---

## 🏗️ Tech Stack

- **Runtime**: Node.js 20+ + TypeScript 5.3+
- **Database**: Supabase (PostgreSQL + pgvector)
- **LLM**: Claude API (Anthropic) - Opus, Sonnet, Haiku
- **Embeddings**: OpenAI text-embedding-3-large (3072 dimensions)
- **Jobs**: Trigger.dev v3.0+
- **Deployment**: Railway
- **Messaging**: Telegram Bot API

---

## 📁 Project Structure

```
infrastructure/
├── src/
│   ├── agents/
│   │   ├── personal/
│   │   │   └── lead-research.ts          # Personal lead research
│   │   ├── pdc/
│   │   │   ├── lead-research.ts          # PDC prospect research
│   │   │   ├── social-content.ts         # PDC content generation
│   │   │   ├── sales-nurture.ts          # PDC enrollment pipeline
│   │   │   └── lead-generation.ts        # PDC lead gen (4 channels)
│   │   └── sts/
│   │       ├── lead-research.ts          # STS company research
│   │       ├── social-content.ts         # STS content generation
│   │       ├── sales-nurture.ts          # STS deal pipeline
│   │       └── lead-generation.ts        # STS lead gen (4 channels)
│   ├── shared/
│   │   ├── supabase.ts                   # DB client + logging
│   │   ├── llm.ts                        # Claude API wrapper
│   │   ├── memory.ts                     # Vector memory operations
│   │   ├── logger.ts                     # Structured logging (pino)
│   │   ├── env.ts                        # Environment validation
│   │   ├── rate-limiter.ts               # API rate limiting
│   │   └── validation.ts                 # Input validation (Zod)
│   ├── types/
│   │   └── database.ts                   # TypeScript interfaces
│   ├── index.ts                          # HTTP server
│   ├── telegram-bot.ts                   # Telegram bot interface
│   └── trigger.ts                        # Scheduled jobs
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql                # Core tables + vector
│       ├── 002_sales_nurture.sql         # Sales pipeline tables
│       └── 003_leadgen_tables.sql        # Lead gen tables
├── .clinerules                           # Agent architecture blueprint
└── package.json                          # Dependencies + scripts
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your actual API keys
# See SUPABASE_SETUP.md for detailed setup instructions
```

### 3. Run Database Migrations
```bash
# Link your Supabase project (one-time)
supabase link --project-ref your-project-ref

# Push all migrations to create tables
supabase db push
```

See `SUPABASE_SETUP.md` for detailed setup instructions and troubleshooting.

### 4. Test the System
```bash
# Test database connection and verify all tables
npm run test:connection

# Test all agents
npm run test:all

# Or test individually
npm run test:agent:leadgen:sts
npm run test:agent:sales:pdc
```

See `TESTING_GUIDE.md` for comprehensive testing instructions.

---

## 📋 Available Commands

### Development
```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm start            # Run production build
npm run bot          # Start Telegram bot
```

### Agent Execution

**Phase 1: Lead Research**
```bash
npm run agent:research:personal -- --name="Name" --company="Company"
npm run agent:research:pdc -- athlete "Name" --sport="Basketball"
npm run agent:research:sts -- --companyName="Company"
```

**Phase 2: Social/Content**
```bash
npm run agent:content:pdc -- generate --topic="NIL opportunities"
npm run agent:content:sts -- generate --topic="Cloud migration"
```

**Phase 3: Sales/Nurture**
```bash
npm run agent:sales:pdc -- enrollment_digest
npm run agent:sales:sts -- pipeline_digest
```

**Phase 4: Lead Generation**
```bash
npm run agent:leadgen:pdc -- lead_digest
npm run agent:leadgen:sts -- lead_digest
```

---

## 🗄️ Database Schema

### Core Tables (001_schema.sql)
- `agent_runs` - Execution tracking and audit log
- `memories` - Vector storage for semantic search
- `pdc_leads` - PDC athlete/prospect tracking
- `sts_companies` - STS enterprise prospect tracking
- `content_library` - Source content for repurposing
- `social_queue` - Scheduled social media posts

### Sales/Nurture Tables (002_sales_nurture.sql)
- `pdc_athletes`, `pdc_followup_queue`, `pdc_referral_partners`, `pdc_events`
- `sts_deals`, `sts_followup_queue`, `sts_partner_updates`

### Lead Generation Tables (003_leadgen_tables.sql)
- **STS**: `sts_inbound_leads`, `sts_outbound_prospects`, `sts_trigger_events`, `sts_referrals`, `sts_outreach_queue`
- **PDC**: `pdc_inbound_leads`, `pdc_outbound_prospects`, `pdc_partner_prospects`, `pdc_referral_requests`, `pdc_outreach_queue`

---

## 🎯 Business Contexts

### Personal (Unsupervised Learning)
- Newsletter: ~100K subscribers
- Focus: AI, security, technology trends
- Use case: Find collaborators, speakers, interview guests

### PDC (Players Development Club)
- Mission: Athlete development + NIL monetization
- Target: Athletes aged 14-22, Tampa Bay/Florida focus
- Services: Bridge Program, individual coaching, workshops
- Lead gen: 4 channels (inbound, schools, referrals, partnerships)

### STS (Sino Technology Solutions)
- Services: IT consulting, cloud migration, cybersecurity
- Target: Mid-market companies (100-5000 employees)
- Industries: Healthcare, education, financial, government
- Lead gen: 4 channels (inbound, cold outreach, referrals, vendor partnerships)

---

## 💰 Cost Estimates

### Per Agent Run
- Research agents: $0.10-0.15 (Sonnet)
- Content generation: $0.05 (Haiku)
- Sales pipeline digest: $0.02-0.03 (Haiku)
- Lead generation digest: $0.05 (Haiku)
- Outreach generation: $0.10 (Sonnet)

### Monthly at Scale
- Daily digests (6/day): ~$6/month
- Research (10/week): ~$6/month
- Content (20/month): ~$1/month
- Outreach (30/day): ~$90/month
- **Total**: ~$100-150/month for full automation

---

## 🔒 Security

- API keys in environment variables (never committed)
- Input validation with Zod schemas
- Rate limiting on all endpoints
- Structured logging for audit trails
- Supabase Row Level Security ready

---

## 📊 Monitoring

- Structured logging with pino
- Agent run tracking in `agent_runs` table
- Error tracking and status monitoring
- Token usage logging for cost tracking

---

## 🌐 Deployment

### Railway (Recommended)
```bash
# See DEPLOY_RAILWAY.md for full guide
1. Push to GitHub
2. Connect Railway to repo
3. Set environment variables
4. Deploy
```

### Manual/VPS
```bash
npm run build
npm start
```

---

## 📚 Documentation

- `SETUP_STATUS.md` - Initial setup status
- `SALES_NURTURE_COMPLETE.md` - Phase 3 documentation
- `LEAD_GENERATION_COMPLETE.md` - Phase 4 documentation
- `TESTING_GUIDE.md` - Testing instructions
- `DEPLOY_RAILWAY.md` - Deployment guide
- `.clinerules` - Agent architecture blueprint

---

## 🤖 Agent Capabilities Summary

### Research Agents
- Web research using Tavily API
- LinkedIn profile analysis
- Company/prospect research
- Semantic memory storage
- Scoring and qualification

### Content Agents
- Platform-specific formatting (Instagram, LinkedIn, Twitter)
- Content repurposing from library
- Hashtag generation
- Scheduling integration

### Sales/Nurture Agents
- Multi-touch follow-up sequences
- Pipeline health monitoring
- Consultation scheduling
- Referral partner management
- AI-powered proposals and meeting prep

### Lead Generation Agents
- **4 Channels**: Inbound, Outbound, Referrals, Partnerships
- AI lead scoring and qualification
- Trigger event monitoring (STS)
- Personalized outreach generation
- List building and contact finding
- Partnership opportunity identification

---

## 🔧 Environment Variables

```env
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
TAVILY_API_KEY=tvly-...
TRIGGER_API_KEY=tr_...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USERS=...
API_KEY=...
PORT=3000
NODE_ENV=production
```

---

## 🎯 Next Steps

1. **Deploy database migrations** to Supabase
2. **Test all agents** with sample data
3. **Set up Trigger.dev** for scheduled runs
4. **Configure Telegram bot** for manual triggers
5. **Add external integrations** (Apollo.io, Hunter.io, Instagram API)
6. **Monitor and optimize** based on usage

---

## 📞 Support

- Check `.clinerules` for agent architecture patterns
- Review phase completion docs (SALES_NURTURE_COMPLETE.md, LEAD_GENERATION_COMPLETE.md)
- See TESTING_GUIDE.md for testing procedures

---

**Version**: 1.0.0
**Status**: All 4 phases complete (11 agents production-ready)
**Last Updated**: 2026-01-01
