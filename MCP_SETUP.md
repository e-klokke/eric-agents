# MCP Server Setup - Chat with Your Agents

This MCP server lets you interact with all 9 agents using natural language in Claude Code.

## ✅ Installation Complete

The MCP server is built and ready to use!

## 🎯 How You'll Know Which Agent You're Using

### 1. Tool Name with Icon
Each tool has a descriptive name with an emoji that shows in Claude's response:
- 🔍 `research_person` - Personal Lead Research
- 🏀 `research_athlete` - PDC Lead Research
- 🏢 `research_company` - STS Lead Research
- ✍️ `generate_pdc_content` - PDC Content Generation
- 💼 `generate_sts_content` - STS Content Generation
- 📅 `pdc_check_followups` - PDC Sales Follow-ups
- 📊 `pdc_enrollment_digest` - PDC Sales Digest
- And more...

### 2. Formatted Output Headers
Each agent returns output with a clear header:
```
======================================================================
🔍 PERSONAL RESEARCH: Satya Nadella
======================================================================
```

```
======================================================================
🏀 PDC RESEARCH: Victor Wembanyama
======================================================================
```

```
======================================================================
✍️ PDC CONTENT GENERATED
======================================================================
```

### 3. Claude's Response
Claude will say things like:
- "I'll use the research_person tool to research Satya Nadella..."
- "Using the generate_pdc_content tool to create content about mental toughness..."
- "Checking PDC follow-ups with pdc_check_followups..."

## 🚀 Setup in Claude Code

### Option 1: Quick Setup (Recommended)

Add to your Claude Code config (`~/.config/claude-code/config.json`):

```json
{
  "mcpServers": {
    "eric-agents": {
      "command": "tsx",
      "args": [
        "/Users/me/Desktop/tech/eric-agents/infrastructure/src/mcp-server/index.ts"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here",
        "OPENAI_API_KEY": "your-key-here",
        "TAVILY_API_KEY": "your-key-here",
        "SUPABASE_URL": "your-url-here",
        "SUPABASE_SERVICE_KEY": "your-key-here"
      }
    }
  }
}
```

### Option 2: Using Built Binary

Build once:
```bash
cd /Users/me/Desktop/tech/eric-agents/infrastructure
npm run build:mcp
```

Then add to Claude Code config:
```json
{
  "mcpServers": {
    "eric-agents": {
      "command": "node",
      "args": [
        "/Users/me/Desktop/tech/eric-agents/infrastructure/dist/mcp-server/index.js"
      ]
    }
  }
}
```

### Option 3: Global Installation

Install globally:
```bash
cd /Users/me/Desktop/tech/eric-agents/infrastructure
npm link
```

Add to Claude Code config:
```json
{
  "mcpServers": {
    "eric-agents": {
      "command": "eric-agents-mcp"
    }
  }
}
```

## 🎮 Usage Examples

Once configured, just chat naturally in Claude Code:

### Research Examples

**You:** "Research Satya Nadella from Microsoft, I have a call with him next week about AI strategy"

**Claude:** I'll research Satya Nadella using the research_person tool...

*Uses `research_person` automatically and shows:*
```
======================================================================
🔍 PERSONAL RESEARCH: Satya Nadella
======================================================================

**Role:** CEO at Microsoft
**Background:** [detailed background]
**Common Ground with Eric:**
• Both have technology leadership backgrounds
• Both value education and continuous learning

**Conversation Starters:**
1. Discuss Microsoft's AI strategy and how it relates to enterprise infrastructure
2. [more starters]

**Suggested Approach:** Focus on enterprise technology transformation...
```

---

**You:** "Research Victor Wembanyama as a potential PDC client"

**Claude:** I'll research Victor Wembanyama using the research_athlete tool...

*Uses `research_athlete` automatically and shows:*
```
======================================================================
🏀 PDC RESEARCH: Victor Wembanyama
======================================================================

**Type:** lead
**Score:** 8/10
**Program Fit:** 9/10

**Recommendation:** Strong fit for PDC's elite development program...
```

---

**You:** "Research Tampa General Hospital as an STS prospect"

**Claude:** I'll research Tampa General Hospital using the research_company tool...

*Uses `research_company` automatically and shows:*
```
======================================================================
🏢 STS RESEARCH: Tampa General Hospital
======================================================================

**Industry:** Healthcare | 15,000+ employees
**Score:** 8/10 | Deal Size: $100,000 - $500,000

**Tech Opportunities:**
• Cloud infrastructure modernization
• Enhanced cybersecurity solutions

**Next Step:** Schedule meeting to discuss their technology roadmap...
```

### Content Generation Examples

**You:** "Generate content about mental toughness for athletes"

**Claude:** I'll create PDC content using the generate_pdc_content tool...

*Uses `generate_pdc_content` and shows:*
```
======================================================================
✍️ PDC CONTENT GENERATED
======================================================================

**INSTAGRAM**
[Full post with Eric's voice about mental toughness]
Hashtags: #AthleteLife #MentalGame #PDC

**LINKEDIN**
[Professional post for athlete development]
Hashtags: #AthleteDevelopment

**X**
[Concise insight about mental toughness]
Hashtags: #Sports

**FACEBOOK**
[Parent-friendly content]
Hashtags: #AthleteMindset

✅ Saved to social_queue table as drafts
```

---

**You:** "Create tech content about Zero Trust security for STS"

**Claude:** I'll generate STS content using the generate_sts_content tool...

*Uses `generate_sts_content` and shows content for LinkedIn, X, Facebook*

### Sales & Pipeline Examples

**You:** "What PDC follow-ups do I have today?"

**Claude:** I'll check PDC follow-ups using the pdc_check_followups tool...

*Shows athletes needing follow-up*

---

**You:** "Show me the STS pipeline summary"

**Claude:** I'll get the pipeline digest using the sts_pipeline_digest tool...

*Shows deals by stage, totals, recent activity*

---

**You:** "What leads came in recently for PDC?"

**Claude:** I'll check recent leads using the pdc_lead_digest tool...

*Shows inbound leads, scores, recommendations*

### Advanced Examples

**You:** "Build a list of healthcare companies in Tampa for STS outreach"

**Claude:** I'll build a prospect list using the sts_build_prospect_list tool...

*Shows scored prospects matching criteria*

## 🔧 Troubleshooting

### MCP Server Not Showing Up

1. Check config file syntax (valid JSON)
2. Restart Claude Code
3. Check paths are absolute
4. Verify environment variables are set

### Test MCP Server Manually

```bash
cd /Users/me/Desktop/tech/eric-agents/infrastructure
npm run mcp

# Server should start and print:
# Eric's Agents MCP Server running
```

### Check Available Tools

In Claude Code, ask:
```
What agent tools do you have access to?
```

Claude will list all 12 tools with descriptions.

## 📋 Complete Tool List

| Tool | Agent | Description |
|------|-------|-------------|
| `research_person` | Personal Research | Research anyone before meeting |
| `research_athlete` | PDC Research | Qualify athlete prospects |
| `research_company` | STS Research | Research enterprise companies |
| `generate_pdc_content` | PDC Content | Create athlete development content |
| `generate_sts_content` | STS Content | Create tech thought leadership |
| `pdc_check_followups` | PDC Sales | Check athlete follow-ups |
| `pdc_enrollment_digest` | PDC Sales | Get enrollment summary |
| `sts_check_followups` | STS Sales | Check company follow-ups |
| `sts_pipeline_digest` | STS Sales | Get pipeline summary |
| `pdc_lead_digest` | PDC Lead Gen | Recent athlete leads |
| `sts_lead_digest` | STS Lead Gen | Recent company leads |
| `sts_build_prospect_list` | STS Lead Gen | Build targeted prospect list |

## 🎯 Key Benefits

1. **Natural Conversation** - No syntax to remember
2. **Clear Agent Identification** - Icons and headers show which agent is running
3. **Automatic Intent Parsing** - Claude understands what you want
4. **Seamless Integration** - Works right in Claude Code
5. **All Agents Available** - 9 agents, 12 tools, one interface

## 🚀 Next Steps

1. ✅ MCP server built and ready
2. Add configuration to Claude Code config file
3. Restart Claude Code
4. Start chatting naturally with your agents!

Example first conversation:
```
You: What agents do you have access to?
Claude: [Lists all 12 agent tools with descriptions]

You: Research Satya Nadella for my meeting tomorrow
Claude: [Uses research_person tool and provides detailed research]

You: Generate content about mental toughness for athletes
Claude: [Uses generate_pdc_content and creates 4 platform posts]
```

That's it! Your agents are now conversational.
