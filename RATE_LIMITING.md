# Rate Limiting Implementation

## Overview

Rate limiting has been added to the HTTP API to prevent abuse and protect LLM API quotas. Uses a token bucket algorithm with in-memory storage.

## Configuration

### Presets

```typescript
// src/shared/rate-limiter.ts
export const RateLimitPresets = {
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 },   // 10 req/min
  STANDARD: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min (default)
};
```

### Current Setup

All `/trigger/*` endpoints use **STANDARD** preset:
- 30 requests per minute per IP address
- 60 second window
- Token bucket algorithm for smooth limiting

## How It Works

### Token Bucket Algorithm

1. Each IP gets a "bucket" that holds tokens
2. Each request consumes 1 token
3. Bucket refills completely after the time window
4. If bucket is empty, request is rejected with 429

### IP Identification

```typescript
function getClientIP(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}
```

Supports:
- Direct connections (socket IP)
- Proxied connections (X-Forwarded-For header)
- Load balancers and CDNs

## Usage in Code

### HTTP Server

```typescript
import { checkRateLimit, getClientIP, RateLimitPresets } from "./shared/rate-limiter.js";

// In request handler
if (url.startsWith("/trigger/")) {
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP, RateLimitPresets.STANDARD);

  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", rateLimit.retryAfter?.toString() || "60");
    return json(res, errorResponse(`Rate limit exceeded. Retry after ${rateLimit.retryAfter}s`), 429);
  }
}

// Continue with normal processing...
```

### Custom Rate Limits

```typescript
// Custom configuration
const customLimit = { windowMs: 300000, maxRequests: 100 }; // 100 req/5min

const rateLimit = checkRateLimit(identifier, customLimit);
```

## API Response

### When Limit Exceeded

**Status:** 429 Too Many Requests

**Headers:**
```
Retry-After: 45
Content-Type: application/json
```

**Body:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Retry after 45s",
  "timestamp": "2025-12-31T10:30:00.000Z"
}
```

### When Allowed

Normal response (200, 400, 500, etc.) based on request processing.

## Testing Rate Limits

### Manual Testing

```bash
# Send 35 rapid requests (exceeds 30/min limit)
for i in {1..35}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/trigger/research/personal \
    -H "Content-Type: application/json" \
    -H "X-API-Key: your-key" \
    -d '{"name": "Test User"}' &
done
wait

# Expected: First 30 succeed, last 5 return 429
```

### Test Script

```typescript
// test-rate-limit.ts
import { checkRateLimit } from "./src/shared/rate-limiter.js";

const testIP = "192.168.1.100";
const config = { windowMs: 60000, maxRequests: 5 };

for (let i = 1; i <= 7; i++) {
  const result = checkRateLimit(testIP, config);
  console.log(`Request ${i}: ${result.allowed ? "✅ ALLOWED" : `❌ BLOCKED (retry after ${result.retryAfter}s)`}`);
}

// Output:
// Request 1: ✅ ALLOWED
// Request 2: ✅ ALLOWED
// Request 3: ✅ ALLOWED
// Request 4: ✅ ALLOWED
// Request 5: ✅ ALLOWED
// Request 6: ❌ BLOCKED (retry after 60s)
// Request 7: ❌ BLOCKED (retry after 60s)
```

## Monitoring

### Logging

All rate limit events are logged:

```typescript
logger.warn(
  { clientIP, retryAfter: rateLimit.retryAfter },
  "Rate limit exceeded"
);
```

### Metrics to Track

Monitor these in production:
- Number of 429 responses per hour
- Top IP addresses hitting limits
- Average requests per IP
- Rate limit reset frequency

Example log query (if using log aggregation):
```
level:warn AND message:"Rate limit exceeded" | stats count by clientIP
```

## Production Considerations

### Current Implementation

- **Storage:** In-memory Map
- **Suitable for:** Single server deployment
- **Persistence:** Lost on server restart
- **Scaling:** Not suitable for horizontal scaling

### Scaling with Redis

For production with multiple servers, use Redis:

```typescript
// Recommended: Redis-based rate limiting
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimitRedis(identifier: string, config: RateLimitConfig) {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }

  if (current > config.maxRequests) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl };
  }

  return { allowed: true };
}
```

Benefits of Redis:
- Shared state across multiple servers
- Persistent across restarts
- Atomic operations
- TTL management built-in

### Alternative: Upstash Redis

For serverless deployments:

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
```

## Customization

### Per-Endpoint Limits

```typescript
// Different limits for different endpoints
const rateLimits = {
  "/trigger/research/personal": RateLimitPresets.STANDARD,  // 30/min
  "/trigger/content/pdc": RateLimitPresets.STRICT,          // 10/min
  "/trigger/research/sts": { windowMs: 300000, maxRequests: 50 }, // 50/5min
};

const endpoint = url.split("?")[0];
const config = rateLimits[endpoint] || RateLimitPresets.STANDARD;
const rateLimit = checkRateLimit(clientIP, config);
```

### Per-User Limits

```typescript
// Use API key or user ID instead of IP
const apiKey = req.headers["x-api-key"] as string;
const identifier = apiKey || clientIP;

const rateLimit = checkRateLimit(identifier, config);
```

### Tiered Limits

```typescript
// Different limits based on user tier
const userTier = await getUserTier(apiKey);
const config = userTier === "premium"
  ? { windowMs: 60000, maxRequests: 100 }  // Premium: 100/min
  : RateLimitPresets.STANDARD;             // Free: 30/min
```

## Bypass for Internal Services

```typescript
// Allow internal services to bypass rate limits
const clientIP = getClientIP(req);
const isInternal = ["127.0.0.1", "::1", "localhost"].includes(clientIP);

if (!isInternal) {
  const rateLimit = checkRateLimit(clientIP, RateLimitPresets.STANDARD);
  if (!rateLimit.allowed) {
    // ... handle rate limit
  }
}
```

## Error Handling

### Graceful Degradation

```typescript
try {
  const rateLimit = checkRateLimit(clientIP, RateLimitPresets.STANDARD);
  if (!rateLimit.allowed) {
    return json(res, errorResponse("Rate limit exceeded"), 429);
  }
} catch (error) {
  // If rate limiter fails, log but allow request
  logger.error({ error }, "Rate limiter error");
  // Continue processing request...
}
```

### Health Monitoring

```typescript
// Health check endpoint to verify rate limiter
app.get("/health/ratelimiter", (req, res) => {
  try {
    const testResult = checkRateLimit("health-check", { windowMs: 60000, maxRequests: 1 });
    res.json({ status: "ok", rateLimiter: "operational" });
  } catch (error) {
    res.status(500).json({ status: "error", rateLimiter: "failed" });
  }
});
```

## Best Practices

1. **Set Appropriate Limits**
   - Consider average LLM response time (2-5 seconds)
   - Factor in concurrent requests
   - Leave headroom for spikes

2. **Clear Communication**
   - Always include `Retry-After` header
   - Provide clear error messages
   - Document limits in API docs

3. **Monitor and Adjust**
   - Track 429 response rates
   - Identify legitimate heavy users
   - Adjust limits based on usage patterns

4. **Whitelist Internal IPs**
   - Health checks
   - Monitoring services
   - Internal automation

5. **Consider User Experience**
   - Implement client-side retry logic
   - Show friendly error messages
   - Provide upgrade path for heavy users

## Security Notes

- Rate limiting is NOT a replacement for authentication
- Prevents DoS but not DDoS (use Cloudflare/AWS Shield for that)
- IP-based limiting can be bypassed with proxies
- Consider additional protections:
  - API key requirements
  - Request signature validation
  - Geographic restrictions

## Migration Path

Current → Redis → Distributed:

```typescript
// 1. Current (in-memory)
const rateLimit = checkRateLimit(clientIP, config);

// 2. Redis (single instance)
const rateLimit = await checkRateLimitRedis(clientIP, config);

// 3. Distributed (Redis Cluster)
const rateLimit = await checkRateLimitDistributed(clientIP, config);
```

All three implementations use the same interface, allowing gradual migration.

---

## Quick Reference

| Preset | Requests | Window | Use Case |
|--------|----------|--------|----------|
| STRICT | 10 | 60s | High-cost endpoints |
| STANDARD | 30 | 60s | Normal API usage |
| Custom | Variable | Variable | Special requirements |

**Current API:** All `/trigger/*` endpoints use STANDARD (30 req/min)

**Storage:** In-memory Map (suitable for single server)

**Recommendation:** Migrate to Redis for production with multiple servers

---

Last Updated: 2025-12-31
