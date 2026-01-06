# n8n Cloud Quick Start Guide

## Overview
This guide will get you up and running with n8n Cloud for LinkedIn automation in ~30 minutes.

## Prerequisites Checklist

- [ ] n8n Cloud account (free tier is fine)
- [ ] Agent system deployed to Railway
- [ ] Supabase project running
- [ ] PhantomBuster account ($59/mo)
- [ ] LinkedIn Sales Navigator account

## Step-by-Step Setup

### 1. Sign Up for n8n Cloud

1. Visit [n8n.io](https://n8n.io)
2. Click "Start for free"
3. Complete registration
4. You'll land in the n8n dashboard

**Cost:** Free (2,500 executions/month)

### 2. Generate Webhook Secret

Run this command locally:
```bash
openssl rand -hex 32
```

Save this value - you'll use it in two places.

### 3. Add Environment Variables to Railway

In Railway dashboard → Your Project → Variables:

```bash
# Add these new variables:
N8N_WEBHOOK_SECRET=<paste the secret from step 2>
PHANTOMBUSTER_KEY=<your phantombuster api key>
```

Then redeploy your Railway app.

### 4. Set Up n8n Credentials

In n8n Cloud, click **Credentials** → **Add Credential**:

#### A. HTTP Header Auth (for Agent API)
- **Name:** `Eric Agents API`
- **Header Name:** `x-api-key`
- **Header Value:** Your `API_KEY` (same one in Railway)

#### B. Supabase
- **Name:** `Eric Agents Supabase`
- **Host:** Your Supabase project URL (without https://)
- **Service Role Key:** Your Supabase service key

#### C. HTTP Header Auth (for PhantomBuster)
- **Name:** `PhantomBuster`
- **Header Name:** `X-Phantombuster-Key`
- **Header Value:** Your PhantomBuster API key

#### D. Telegram (Optional)
- **Bot Token:** Your Telegram bot token
- **Chat ID:** Your Telegram user ID

### 5. Test Your Agent Connection

1. In n8n, create a new workflow
2. Import the test workflow from `docs/N8N_TEST_WORKFLOW.json`
3. Update the URL to your Railway app:
   ```
   https://YOUR-APP.up.railway.app/api/sts/prospects/to-warm
   ```
4. Select your "Eric Agents API" credential
5. Click "Test workflow"

**Expected result:** Should return JSON with prospects (or empty array if none exist yet)

### 6. Set Up PhantomBuster

1. Sign up at [phantombuster.com](https://phantombuster.com) ($59/mo starter plan)
2. Install required Phantoms:
   - **LinkedIn Sales Navigator Search Export**
   - **LinkedIn Profile Visitor**
   - **LinkedIn Network Booster**
   - **LinkedIn Message Sender**

3. Configure LinkedIn session:
   - Install PhantomBuster Chrome extension
   - Log into LinkedIn Sales Navigator
   - Use extension to capture session cookie
   - Add cookie to each Phantom

4. Get Phantom IDs (from each Phantom's URL)

### 7. Import Production Workflows

Now you're ready to import the real workflows:

#### STS Workflows
1. **STS Profile Warming** - Visit prospect profiles daily
2. **STS Connection Requests** - Send connection requests
3. **STS Inbound Processor** - Handle website leads

#### PDC Workflows
1. **PDC Partner Search** - Find wealth managers
2. **PDC School Search** - Find athletic directors
3. **PDC Partner Outreach** - Automated partnership outreach

**Import process:**
1. In n8n, click **Workflows** → **Add Workflow**
2. Click the **⋮** menu → **Import from File**
3. Select workflow JSON from the specs in `N8N_WORKFLOWS_STS.md` and `N8N_WORKFLOWS_PDC.md`
4. Update all URLs to your Railway app
5. Select your credentials
6. Activate the workflow

### 8. Configure Webhook URLs

For inbound lead capture, set these webhook URLs in your website/forms:

```bash
# STS website form
https://n8n.cloud/webhook/YOUR-INSTANCE-ID/sts-inbound

# PDC website form
https://n8n.cloud/webhook/YOUR-INSTANCE-ID/pdc-inbound
```

The webhook will then call your agent system at:
```
https://your-app.up.railway.app/webhook/sts/inbound
```

### 9. Test Complete Flow

**Test STS Flow:**
1. Trigger "STS Profile Warming" workflow manually
2. Check Supabase `linkedin_daily_limits` table - should see count increment
3. Check `linkedin_interactions` table - should see profile visits logged

**Test PDC Flow:**
1. Submit test form to PDC webhook
2. Check `inbound_leads` table - should see new lead
3. Check `n8n_webhook_logs` - should see webhook logged

### 10. Monitor & Scale

**Daily Monitoring:**
- Check n8n execution history for failures
- Monitor `linkedin_daily_limits` to ensure staying under limits
- Review `n8n_webhook_logs` for webhook issues

**When to Upgrade:**
- If you hit 2,500 executions/month → Upgrade to Pro ($20/mo)
- If you need more complex workflows → Consider self-hosting

## Troubleshooting

### Webhook Not Working
1. Check `N8N_WEBHOOK_SECRET` matches in both n8n and Railway
2. Verify Railway app is deployed and running (`/health` endpoint)
3. Check `n8n_webhook_logs` table for errors

### Agent API Returns 401
1. Verify `x-api-key` header matches your `API_KEY` in Railway
2. Check credential is selected in n8n node

### PhantomBuster Fails
1. Verify LinkedIn session cookie is still valid (re-capture if needed)
2. Check PhantomBuster credit usage
3. Ensure Phantom IDs are correct in workflow

### Daily Limits Not Working
1. Verify migration 004 was applied to Supabase
2. Check `increment_limit` function exists
3. Test `checkDailyLimit` function directly

## Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| n8n Cloud Starter | $0 (free) |
| PhantomBuster | $59 |
| LinkedIn Sales Nav | $99+ |
| Railway (agents) | ~$5-10 |
| **Total** | **~$165/mo** |

## Next Steps

1. ✅ Set up n8n Cloud
2. ✅ Test agent connection
3. ✅ Configure PhantomBuster
4. Import STS workflows
5. Import PDC workflows
6. Test end-to-end automation
7. Monitor daily execution

**You're ready to automate!** 🚀

For detailed workflow specs, see:
- `N8N_WORKFLOWS_STS.md`
- `N8N_WORKFLOWS_PDC.md`
- `N8N_INTEGRATION.md`
