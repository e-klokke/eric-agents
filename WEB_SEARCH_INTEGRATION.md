# Web Search Integration

Real web search has been integrated using **Tavily API** - a search engine optimized for AI agents.

## ✅ What Was Implemented

**New Files:**
- `src/shared/web-search.ts` - Web search utility with Tavily API

**Modified Files:**
- `src/agents/personal/lead-research.ts` - Now uses real web search
- `src/agents/pdc/lead-research.ts` - Now uses real web search
- `src/agents/sts/lead-research.ts` - Now uses real web search
- `.env.example` - Added `TAVILY_API_KEY`
- `package.json` - Added `@tavily/core` dependency

---

## 🔑 Getting Your Tavily API Key

1. **Sign up at Tavily:**
   - Visit: https://tavily.com
   - Sign up for a free account
   - Free tier: 1,000 searches/month

2. **Get your API key:**
   - Go to your dashboard
   - Copy your API key

3. **Add to `.env`:**
   ```env
   TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
   ```

---

## 📊 Search Capabilities

### Basic Features

```typescript
import { webSearch, formatSearchResults } from './shared/web-search.js';

// Simple search
const results = await webSearch("Satya Nadella Microsoft");

// Advanced search with options
const results = await webSearch("Tampa wealth managers", {
  maxResults: 10,              // Number of results (default: 5)
  searchDepth: "advanced",     // "basic" or "advanced" (default: "basic")
  includeAnswer: true,         // Include AI-generated summary (default: false)
  includeDomains: ["linkedin.com", "crunchbase.com"], // Only these domains
  excludeDomains: ["wikipedia.org"], // Exclude these domains
});
```

### Response Format

```typescript
{
  query: "Satya Nadella Microsoft",
  answer: "AI-generated summary of search results...", // If includeAnswer: true
  results: [
    {
      title: "Satya Nadella - CEO of Microsoft",
      url: "https://...",
      content: "Relevant excerpt from the page...",
      score: 0.95  // Relevance score (0-1)
    },
    // ... more results
  ]
}
```

---

## 🎯 How It's Used in Agents

### Personal Lead Research
```typescript
const searchResponse = await webSearch(
  `${name} ${company} professional background`,
  {
    maxResults: 5,
    searchDepth: input.depth === "deep" ? "advanced" : "basic",
    includeAnswer: true,
  }
);
```

**Use case:** Research people before meetings
- Gets current role, company, background
- Finds common ground with Eric
- Generates conversation starters

### PDC Lead Research
```typescript
const searchResponse = await webSearch(searchTerm, {
  maxResults: 5,
  searchDepth: "basic",
  includeAnswer: true,
});
```

**Use case:** Research for athlete development business
- Market research (schools, wealth managers, NIL companies)
- Athlete/parent leads
- Collaboration partners

### STS Lead Research
```typescript
const searchResponse = await webSearch(
  `${companyName} ${website} company profile technology`,
  {
    maxResults: 5,
    searchDepth: "advanced",  // More thorough for B2B
    includeAnswer: true,
  }
);
```

**Use case:** Research enterprise tech prospects
- Company tech stack
- Partner opportunities (Cisco, Dell, Oracle, etc.)
- Deal qualification

---

## 🛡️ Graceful Degradation

If `TAVILY_API_KEY` is not set, the search function returns a placeholder:

```json
{
  "query": "...",
  "results": [{
    "title": "Placeholder Search Result",
    "url": "https://example.com",
    "content": "[Set TAVILY_API_KEY to enable real search]",
    "score": 1.0
  }]
}
```

**Warning logged:** `⚠️ TAVILY_API_KEY not set, returning placeholder search results`

This allows development/testing without an API key, but agents will work much better with real search.

---

## 💰 Pricing

**Free Tier:**
- 1,000 searches per month
- Perfect for development and low-volume usage

**Paid Tiers:**
- Starts at $49/month for 10,000 searches
- Enterprise plans available

**Current Usage:**
- Personal research: ~5 searches per lead
- PDC research: ~5 searches per research type
- STS research: ~5 searches per company (uses "advanced" depth)

---

## 🧪 Testing

### Test with Placeholder (No API Key)

```bash
# Don't set TAVILY_API_KEY
npm run agent:research:personal -- "Satya Nadella" "Microsoft"
```

**Expected output:**
```
⚠️  TAVILY_API_KEY not set, returning placeholder search results
```

### Test with Real Search

```bash
# Set TAVILY_API_KEY in .env
export TAVILY_API_KEY=tvly-xxxxxxxxxxxxx

npm run agent:research:personal -- "Satya Nadella" "Microsoft"
```

**Expected output:**
```
🌐 Web search: "Satya Nadella Microsoft professional background" (depth: basic, max: 5)
```

---

## 📈 Search Quality Tips

**1. Use Specific Queries:**
- Good: "John Smith Microsoft cloud solutions architect"
- Bad: "John Smith"

**2. Choose Right Depth:**
- `basic` - Faster, cheaper, good for most cases
- `advanced` - More thorough, better for complex research

**3. Domain Filtering:**
```typescript
// Only search professional sites
includeDomains: ["linkedin.com", "crunchbase.com", "bloomberg.com"]

// Exclude noise
excludeDomains: ["pinterest.com", "quora.com"]
```

**4. Use AI Summary:**
```typescript
includeAnswer: true  // Gets AI-generated summary of all results
```

---

## 🔄 Alternative Search Providers

If you prefer a different search API, you can swap Tavily:

### Perplexity
```typescript
// Change src/shared/web-search.ts to use Perplexity API
```

### Google Custom Search
```typescript
// Use Google's programmable search engine
```

### Exa (formerly Metaphor)
```typescript
// Semantic search optimized for AI
```

Just update `src/shared/web-search.ts` and keep the same interface.

---

## ✅ Benefits

**Before (Placeholder):**
- Agents returned generic "no search results" data
- Limited real-world usefulness
- Required manual research

**After (Tavily Integration):**
- Real-time web data for all agents
- Accurate, up-to-date information
- Agents can actually research people, companies, markets
- AI-generated summaries for quick insights

**All 3 research agents now have real web search capabilities!**
