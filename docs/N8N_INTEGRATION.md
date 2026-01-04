# n8n Integration Guide

## Overview

This document describes the n8n integration added to Eric's AI Agent System for LinkedIn Sales Navigator automation, lead generation, and outreach orchestration.

## What's Been Added

### 1. Database Schema (Migration 004)

New tables for n8n integration:

- **linkedin_interactions** - Tracks all LinkedIn automation activities
- **n8n_webhook_logs** - Logs webhook requests for debugging
- **outreach_queue** - Central queue for outbound messages
- **linkedin_daily_limits** - Enforces LinkedIn safety limits
- **pdc_partner_prospects** - PDC partner/school prospects
- **sts_outbound_prospects** - STS company prospects
- **inbound_leads** - Inbound leads from all sources

### 2. Shared Modules

#### linkedin-limits.ts
Manages LinkedIn daily action limits to avoid account restrictions:
- Profile visits: 100/day
- Connection requests: 25/day
- Messages: 50/day
- InMails: 10/day

Functions:
- `checkDailyLimit(action, context)` - Check if limit reached
- `incrementDailyCount(action, context)` - Increment counter
- `getDailyStats(context)` - Get current counts
- `getLimitsSummary(context)` - Get summary with remaining capacity

#### outreach-queue.ts
Manages queued outreach messages across all channels:

Functions:
- `queueOutreach(params)` - Add message to queue
- `getQueuedOutreach(context, params)` - Get queued messages
- `markOutreachSent(outreachId)` - Mark as sent
- `markOutreachResponded(outreachId, responseText)` - Mark as responded
- `getOutreachStats(context, startDate, endDate)` - Get statistics

### 3. API Endpoints

#### n8n Helper Endpoints (require x-api-key auth)

**STS Endpoints:**
- `GET /api/sts/prospects/to-warm` - Get prospects for profile warming
- `GET /api/sts/prospects/to-connect` - Get prospects for connection requests
- `GET /api/sts/prospects/to-message` - Get prospects for messaging
- `GET /api/sts/outreach/queue` - Get queued outreach messages

**PDC Endpoints:**
- `GET /api/pdc/partners/to-warm` - Get partners for profile warming
- `GET /api/pdc/partners/to-contact` - Get partners for outreach
- `GET /api/pdc/schools/to-contact` - Get schools for outreach
- `GET /api/pdc/outreach/queue` - Get queued outreach messages

#### n8n Webhook Endpoints (require x-webhook-secret auth)

**STS Webhooks:**
- `POST /webhook/sts/inbound` - Receive inbound leads from website
- `POST /webhook/sts/trigger-event` - Receive trigger events (funding, hiring, etc.)
- `POST /webhook/sts/linkedin-response` - Receive LinkedIn response notifications

**PDC Webhooks:**
- `POST /webhook/pdc/inbound` - Receive inbound leads from website/social
- `POST /webhook/pdc/instagram` - Receive Instagram DM notifications
- `POST /webhook/pdc/facebook` - Receive Facebook message notifications
- `POST /webhook/pdc/linkedin-response` - Receive LinkedIn response notifications

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration to your Supabase database
supabase db push
```

Or manually run the SQL in `supabase/migrations/004_n8n_integration.sql`

### 2. Update Environment Variables

Add to your `.env` file:

```bash
N8N_WEBHOOK_SECRET=your-webhook-secret-for-n8n
PHANTOMBUSTER_KEY=your-phantombuster-api-key
```

### 3. Deploy Updated Application

```bash
# Rebuild and deploy
npm run build
# Deploy to Railway or your hosting platform
```

### 4. Test Endpoints

Test webhook endpoint:
```bash
curl -X POST https://your-app.railway.app/webhook/sts/inbound \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "company": "Test Corp",
    "message": "Interested in your services",
    "source": "website",
    "lead_score": 8
  }'
```

Test helper endpoint:
```bash
curl https://your-app.railway.app/api/sts/prospects/to-warm \
  -H "x-api-key: your-api-key"
```

## n8n Workflow Setup

### Required n8n Credentials

1. **Supabase** - For database operations
2. **PhantomBuster** - For LinkedIn automation
3. **Telegram** - For notifications (optional)
4. **Your Agent API** - HTTP Header Auth with x-api-key

### Example n8n Workflow: STS Profile Warming

1. **Schedule Trigger** - Daily at 9 AM
2. **HTTP Request** - GET `/api/sts/prospects/to-warm`
3. **Loop** - For each prospect
4. **PhantomBuster** - Visit profile
5. **Wait** - Random 30-60 seconds
6. **Supabase** - Update last_visited timestamp
7. **LinkedIn Limits** - Increment daily counter

### Example n8n Workflow: Inbound Lead Processing

1. **Webhook Trigger** - From website form
2. **HTTP Request** - POST to agent system `/webhook/sts/inbound`
3. **IF node** - Check lead score
4. **Telegram** (if hot lead) - Send alert
5. **Supabase** - Record in database
6. **Email** - Send auto-response

## Daily Limits & Safety

The system enforces LinkedIn safety limits automatically:

| Action | Daily Max | Per Run |
|--------|-----------|---------|
| Profile visits | 100 | 30-40 |
| Connection requests | 25 | 15-20 |
| Messages | 50 | 20-25 |
| InMails | 10 | 5-10 |

When a limit is reached, the helper endpoints return a 429 status code.

## Monitoring & Debugging

### Check Webhook Logs

Query the `n8n_webhook_logs` table to see all webhook requests:

```sql
SELECT * FROM n8n_webhook_logs
ORDER BY received_at DESC
LIMIT 20;
```

### Check Daily Limits

```sql
SELECT * FROM linkedin_daily_limits
WHERE date = CURRENT_DATE;
```

### Check Outreach Queue

```sql
SELECT * FROM outreach_queue
WHERE status = 'queued'
ORDER BY scheduled_for ASC;
```

### Check LinkedIn Interactions

```sql
SELECT
  interaction_type,
  COUNT(*) as count,
  COUNT(CASE WHEN response_received THEN 1 END) as responses
FROM linkedin_interactions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY interaction_type;
```

## Architecture Decisions

### Why Separate Tables for Prospects?

- **sts_outbound_prospects** - STS-specific fields (company research, tech stack)
- **pdc_partner_prospects** - PDC-specific fields (partner type, alignment score)
- Allows different workflows and scoring criteria per business

### Why Centralized Outreach Queue?

- Single source of truth for all outbound messages
- Consistent tracking across channels
- Easy to implement rate limiting and scheduling
- Simplifies response tracking

### Why Daily Limits Table?

- Prevents LinkedIn account restrictions
- Automatic reset at midnight
- Tracks usage per context (STS vs PDC)
- Returns remaining capacity to n8n workflows

## Next Steps

1. **Set up n8n workflows** - Use the workflow specs in N8N_WORKFLOWS_STS.md and N8N_WORKFLOWS_PDC.md
2. **Configure PhantomBuster** - Set up required Phantoms for LinkedIn automation
3. **Set up Telegram alerts** - For hot leads and workflow failures
4. **Test end-to-end** - Run a complete workflow from prospect search to outreach
5. **Monitor limits** - Check daily that limits are being respected

## Troubleshooting

### Webhook Not Receiving Data

- Check `x-webhook-secret` header matches `N8N_WEBHOOK_SECRET`
- Verify n8n can reach your deployed app URL
- Check `n8n_webhook_logs` table for error messages

### Daily Limit Not Working

- Verify migration 004 was applied successfully
- Check `increment_limit` function exists in Supabase
- Test with `checkDailyLimit()` function directly

### Outreach Not Queuing

- Verify all required fields in `queueOutreach()`
- Check Supabase table permissions
- Review error logs in application

## Support

For issues or questions:
1. Check the `n8n_webhook_logs` table for errors
2. Review application logs
3. Test endpoints with curl/Postman
4. Verify environment variables are set correctly
