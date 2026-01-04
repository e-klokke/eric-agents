# Structured Logging & Environment Validation

Production-ready logging and environment validation have been added to the entire system.

## ✅ What Was Implemented

**New Files:**
- `src/shared/logger.ts` - Pino structured logging
- `src/shared/env.ts` - Environment validation at startup
- `test-env-validation.ts` - Test suite for validation

**Modified Files:**
- `src/index.ts` - Uses logger, validates env at startup
- `src/telegram-bot.ts` - Uses logger
- `src/shared/web-search.ts` - Uses logger
- `package.json` - Added `pino` and `pino-pretty` dependencies

---

## 📋 Structured Logging with Pino

### Why Pino?

- **Fast**: 5-10x faster than Winston or Bunyan
- **Structured**: JSON output in production, pretty in development
- **Standard**: Industry-standard logging library
- **Flexible**: Easy log levels, child loggers, custom context

### Log Levels

```typescript
logger.trace("Detailed debugging");
logger.debug("Debug information");
logger.info("General information");
logger.warn("Warning messages");
logger.error("Error messages");
logger.fatal("Fatal errors");
```

### Development Output (Pretty)

```bash
[10:32:15] INFO: Server running on http://localhost:3000 (port: 3000)
[10:32:20] INFO: Incoming request (method: "POST", url: "/trigger/research/personal")
[10:32:22] INFO: Web search: "Satya Nadella Microsoft" (query: "...", searchDepth: "basic", maxResults: 5)
```

### Production Output (JSON)

```json
{"level":30,"time":1704067200000,"port":3000,"msg":"Server running on http://localhost:3000"}
{"level":30,"time":1704067205000,"method":"POST","url":"/trigger/research/personal","msg":"Incoming request"}
{"level":30,"time":1704067207000,"query":"Satya Nadella Microsoft","searchDepth":"basic","maxResults":5,"msg":"Web search"}
```

### Using the Logger

**Basic Usage:**
```typescript
import logger from "./shared/logger.js";

logger.info("Server started");
logger.error({ error }, "Failed to process request");
logger.warn({ userId, action }, "Unauthorized access attempt");
```

**With Context:**
```typescript
import { createLogger } from "./shared/logger.js";

const agentLogger = createLogger({ agentName: "personal-lead-research" });
agentLogger.info("Starting research");
agentLogger.debug({ params }, "Received parameters");
```

**Structured Data:**
```typescript
// Good - structured
logger.info({ userId: 123, action: "login" }, "User logged in");

// Bad - unstructured
logger.info(`User 123 logged in with action login`);
```

### Log Level Configuration

Set in `.env`:
```env
LOG_LEVEL=debug  # trace, debug, info, warn, error, fatal
NODE_ENV=development  # or "production"
```

**Development:** Pretty colored output
**Production:** JSON output for log aggregation

---

## 🔒 Environment Validation

### Required Variables

The system validates these at startup and **exits immediately** if missing:

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Recommended Variables

Warns if missing but allows startup:

```env
TAVILY_API_KEY=      # For web search
API_KEY=             # For HTTP API authentication
TELEGRAM_BOT_TOKEN=  # For Telegram bot
```

### Startup Validation

```typescript
// src/index.ts
import { validateEnvironment } from "./shared/env.js";

// Validate environment variables at startup
validateEnvironment();
```

**If validation passes:**
```
✅ Environment validation passed
```

**If required variables missing:**
```
Missing required environment variables: ANTHROPIC_API_KEY, OPENAI_API_KEY
Please set these variables in your .env file
See .env.example for reference
[Process exits with code 1]
```

**If optional variables missing:**
```
⚠️  Missing recommended environment variables: TAVILY_API_KEY
Some features may not work without these variables
✅ Environment validation passed
```

### Environment Helper Functions

```typescript
import { getEnv, isProduction, isDevelopment } from "./shared/env.js";

// Get env var with default
const port = getEnv("PORT", "3000");

// Check environment
if (isProduction()) {
  // Production-specific logic
}

if (isDevelopment()) {
  // Development-specific logic
}
```

---

## 🧪 Testing

### Test Environment Validation

```bash
npx tsx test-env-validation.ts
```

This removes required env vars and verifies validation catches it.

### Test Logging

```bash
# Start server with debug logging
LOG_LEVEL=debug npm run dev
```

You should see:
- Colored, formatted output
- Request logs with method and URL
- Web search logs with query details
- Error logs with context

---

## 📊 Log Output Examples

### Successful Request

```
[10:32:20] INFO: Incoming request
    method: "POST"
    url: "/trigger/research/personal"
[10:32:22] INFO: Web search: "Satya Nadella Microsoft"
    query: "Satya Nadella Microsoft professional background"
    searchDepth: "basic"
    maxResults: 5
[10:32:25] INFO: Request completed
```

### Failed Request

```
[10:35:10] INFO: Incoming request
    method: "POST"
    url: "/trigger/research/personal"
[10:35:11] ERROR: Request error
    method: "POST"
    url: "/trigger/research/personal"
    error: {
      "type": "Error",
      "message": "Name is required",
      "stack": "Error: Name is required\n    at..."
    }
```

### Web Search Failure

```
[10:40:15] ERROR: Web search error
    query: "test query"
    error: {
      "type": "Error",
      "message": "Network timeout",
      "stack": "..."
    }
```

---

## 🔧 Benefits

**Before:**
```typescript
console.log("Server started");
console.error("Error:", error);
```

**Problems:**
- No structure
- Hard to parse
- No context
- No filtering
- Can't aggregate

**After:**
```typescript
logger.info({ port }, "Server started");
logger.error({ error, context }, "Operation failed");
```

**Benefits:**
- ✅ Structured JSON in production
- ✅ Pretty formatted in development
- ✅ Searchable by field
- ✅ Log levels for filtering
- ✅ Ready for log aggregation (Datadog, CloudWatch, etc.)
- ✅ Performance optimized
- ✅ Context preservation

---

## 🚀 Production Deployment

### Log Aggregation

**With Datadog:**
```bash
# Logs automatically parsed as JSON
# Search by: method, url, error.message, etc.
```

**With CloudWatch:**
```bash
# JSON logs sent to CloudWatch
# Use CloudWatch Insights to query
```

**With Elasticsearch:**
```bash
# Index JSON logs
# Query by any field
```

### Log Rotation

**With PM2:**
```json
{
  "apps": [{
    "name": "eric-agents",
    "script": "dist/index.js",
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    "merge_logs": true,
    "max_memory_restart": "1G"
  }]
}
```

### Environment Variables in Railway

```bash
LOG_LEVEL=info
NODE_ENV=production
# ... other vars
```

---

## 📈 Next Steps

Consider adding:

**Request ID Tracking:**
```typescript
const requestId = generateId();
const logger = createLogger({ requestId });
logger.info("Processing request");
```

**Performance Metrics:**
```typescript
const start = Date.now();
// ... operation
logger.info({ duration: Date.now() - start }, "Operation completed");
```

**Alert Integration:**
```typescript
logger.error({ error, alert: true }, "Critical error");
// Send to PagerDuty/Slack
```

---

## ✅ Summary

**Logging:**
- ✅ Structured logging throughout the system
- ✅ Pino for performance
- ✅ Pretty output in dev, JSON in prod
- ✅ Contextual information in all logs

**Environment Validation:**
- ✅ Validates required variables at startup
- ✅ Warns about missing optional variables
- ✅ Fails fast with clear error messages
- ✅ Prevents runtime errors from misconfiguration

**All console.log replaced with structured logger!**
**All deployments will fail fast if misconfigured!**
