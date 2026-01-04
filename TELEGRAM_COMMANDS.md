# Telegram Bot - Complete Command Reference

Quick reference for all commands available in @eric_agents_bot

---

## 🔍 General AI Assistant

### /ask
**Ask any question and get live answers**

**Syntax:**
```
/ask <your question>
```

**Examples:**
```
/ask what is the current price of bitcoin?
/ask latest AI trends in 2026
/ask best restaurants in Tampa FL
/ask explain quantum computing simply
/ask current weather in Portugal
/ask who won the NBA championship 2025?
```

**What it does:**
- Searches live web data (5+ sources)
- Analyzes results with Claude Sonnet
- Returns concise answer with sources
- Works for ANY question - no limits!

---

## 📊 Research Commands

### /research_personal
**Research a person before meetings/calls**

**Syntax:**
```
/research_personal Name, Company
```

**Examples:**
```
/research_personal Satya Nadella, Microsoft
/research_personal Elon Musk, Tesla
/research_personal Tim Cook, Apple
/research_personal Jensen Huang, NVIDIA
```

**Returns:**
- Background and current role
- Career history
- Common ground with Eric
- Conversation starters
- Suggested approach

---

### /research_athlete
**Research an athlete for PDC qualification**

**Syntax:**
```
/research_athlete Name, Sport
```

**Examples:**
```
/research_athlete LeBron James, Basketball
/research_athlete Victor Wembanyama, Basketball
/research_athlete Megan Rapinoe, Soccer
/research_athlete Patrick Mahomes, Football
```

**Returns:**
- Qualification score (0-10)
- Program fit analysis
- Strengths and development needs
- PDC program recommendations
- Outreach strategy

---

### /research_company
**Research a company for STS prospecting**

**Syntax:**
```
/research_company Company Name, Website
```

**Examples:**
```
/research_company Tampa General Hospital, tgh.org
/research_company Duke Health, dukehealth.org
/research_company Cleveland Clinic, clevelandclinic.org
/research_company Acme Corp, acme.com
```

**Returns:**
- Industry and company size
- Tech stack analysis
- Partner opportunities (Cisco, Dell, Oracle, Lenovo, HP)
- Deal size estimate
- Next steps

---

## ✍️ Content Generation

### /content_pdc
**Generate social media content for PDC**

**Syntax:**
```
/content_pdc <topic>
```

**Examples:**
```
/content_pdc mental toughness
/content_pdc handling pressure in playoffs
/content_pdc NIL opportunities for athletes
/content_pdc building character through sports
/content_pdc pre-game routines
```

**Returns:**
- 4 platform-specific posts:
  - Instagram (visual-focused)
  - LinkedIn (professional)
  - X/Twitter (concise)
  - Facebook (parent-friendly)
- Relevant hashtags
- Saved to database as drafts

---

### /content_sts
**Generate tech thought leadership for STS**

**Syntax:**
```
/content_sts <topic>
```

**Examples:**
```
/content_sts Zero Trust security
/content_sts cloud migration strategies
/content_sts hybrid infrastructure
/content_sts cybersecurity trends 2026
/content_sts Cisco SD-WAN benefits
```

**Returns:**
- 3 platform-specific posts:
  - LinkedIn (B2B focus)
  - X/Twitter (tech insights)
  - Facebook (accessible)
- Relevant hashtags
- Saved to database as drafts

---

## 💼 Sales & Pipeline Management

### /pdc_followups
**Check PDC athletes needing follow-up**

**Syntax:**
```
/pdc_followups
```

**No parameters needed**

**Returns:**
- Athletes requiring follow-up
- Current stage in pipeline
- Last contact date
- Recommended next action
- Priority order

---

### /pdc_digest
**Get PDC enrollment summary**

**Syntax:**
```
/pdc_digest
```

**No parameters needed**

**Returns:**
- Total inquiries
- Consultations scheduled
- Active athletes
- Monthly enrollment count
- Top opportunities
- Action items

---

### /sts_followups
**Check STS companies needing follow-up**

**Syntax:**
```
/sts_followups
```

**No parameters needed**

**Returns:**
- Companies requiring follow-up
- Deal stage
- Estimated deal value
- Next action required
- Priority order

---

### /sts_digest
**Get STS pipeline summary**

**Syntax:**
```
/sts_digest
```

**No parameters needed**

**Returns:**
- Total deals in pipeline
- Total pipeline value
- Deals by stage (Discovery, Proposal, Negotiation)
- Deals closing this month
- Recent activity

---

## 📈 Lead Generation

### /pdc_leads
**View recent PDC athlete leads**

**Syntax:**
```
/pdc_leads
```

**No parameters needed**

**Returns:**
- Recent inbound leads
- Athlete name and sport
- Lead source
- Qualification score
- Status (New, Contacted, etc.)
- Recommendations

---

### /sts_leads
**View recent STS company leads**

**Syntax:**
```
/sts_leads
```

**No parameters needed**

**Returns:**
- Recent inbound leads
- Company name and industry
- Lead source
- Qualification score
- Status
- Detected trigger events

---

## ⚙️ Utility Commands

### /start
**Show main menu with all commands**

**Syntax:**
```
/start
```

**Returns:**
- Complete command list
- Quick examples
- Getting started guide

---

### /myid
**Get your Telegram user ID**

**Syntax:**
```
/myid
```

**Returns:**
- Your Telegram user ID
- Instructions for adding to whitelist
- Works for everyone (no authorization needed)

---

## 🎯 Quick Use Cases

### Morning Routine
```
/pdc_followups
/sts_followups
/pdc_leads
/sts_leads
```

### Before a Meeting
```
/research_personal John Smith, Acme Corp
```

### Prospect Research
```
/research_company Tampa General, tgh.org
/research_athlete Marcus Williams, Basketball
```

### Content Creation Day
```
/content_pdc mental game strategies
/content_sts cloud security best practices
```

### Quick Information
```
/ask latest developments in AI agents
/ask current stock market trends
/ask best practices for NIL deals
```

---

## 📱 Command Format Tips

1. **Use commas** to separate parameters:
   - ✅ `/research_personal Elon Musk, Tesla`
   - ❌ `/research_personal Elon Musk Tesla`

2. **No special characters needed** in questions:
   - ✅ `/ask what is the weather?`
   - ✅ `/ask whats the weather`

3. **Commands are case-insensitive** for topics:
   - ✅ `/content_pdc Mental Toughness`
   - ✅ `/content_pdc mental toughness`

4. **Keep company websites simple**:
   - ✅ `/research_company Acme, acme.com`
   - ✅ `/research_company Acme, www.acme.com`

---

## 🚀 Pro Tips

1. **Pin the bot** in Telegram for quick access
2. **Use /ask** for any question you'd normally Google
3. **Run morning routine** with 4 commands for full pipeline view
4. **Research before calls** - save 15+ minutes of prep time
5. **Batch content creation** - generate multiple posts in one session
6. **Check leads daily** - never miss a hot prospect
7. **All data is live** - searches web in real-time

---

## 📊 Command Categories Summary

| Category | Commands | Use For |
|----------|----------|---------|
| **General AI** | `/ask` | Any question, live answers |
| **Research** | `/research_personal`, `/research_athlete`, `/research_company` | Pre-meeting prep, prospect qualification |
| **Content** | `/content_pdc`, `/content_sts` | Social media posts |
| **Sales** | `/pdc_followups`, `/pdc_digest`, `/sts_followups`, `/sts_digest` | Pipeline management |
| **Leads** | `/pdc_leads`, `/sts_leads` | Lead tracking |
| **Utility** | `/start`, `/myid` | Help and setup |

---

## 🔒 Security

- Only authorized users (in TELEGRAM_ALLOWED_USERS) can use commands
- `/myid` works for everyone to get their ID
- All other commands require authorization
- Unauthorized users see: "❌ Unauthorized. Use /myid to get your user ID."

---

## 💡 Common Questions

**Q: How current is the data?**
A: All research uses live web search - data is as recent as what's published online.

**Q: Can I ask follow-up questions?**
A: Yes! Each command is independent. Ask multiple related questions.

**Q: Where is content saved?**
A: Content is saved to the `social_queue` database table as drafts.

**Q: How many leads can I check?**
A: Lead commands show up to 10 most recent, with total count.

**Q: Can I use this on mobile?**
A: Yes! Works on iOS, Android, desktop, and web Telegram.

---

**Bot Username:** @eric_agents_bot
**Version:** 1.0 (All 9 agents + AI assistant)
**Last Updated:** 2026-01-03
