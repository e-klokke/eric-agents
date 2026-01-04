# Supabase Setup - Complete Guide

## 🎯 Quick Start (3 Steps)

```bash
# 1. Run the setup script
./scripts/setup.sh

# 2. Test connection
npm run test:connection

# 3. Test agents
npm run test:agent:leadgen:sts
npm run test:agent:sales:pdc
```

## 📋 What Was Created

### Documentation
- ✅ `SUPABASE_SETUP.md` - Detailed setup instructions
- ✅ `SETUP_COMPLETE.md` - This file (quick reference)

### Test Scripts
- ✅ `scripts/setup.sh` - Interactive setup wizard
- ✅ `scripts/test-connection.ts` - Connection testing
- ✅ `scripts/test-agent-leadgen-sts.ts` - STS lead gen test
- ✅ `scripts/test-agent-sales-pdc.ts` - PDC sales test

### npm Scripts Added
```json
{
  "test:connection": "Test Supabase connection",
  "test:agent:leadgen:sts": "Test STS lead generation",
  "test:agent:sales:pdc": "Test PDC sales nurture",
  "test:all": "Run all tests"
}
```

## 🔧 Setup Checklist

### 1. Get Supabase Credentials

- [ ] Go to https://supabase.com/dashboard
- [ ] Create or select your project
- [ ] Navigate to Settings > API
- [ ] Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
- [ ] Copy **service_role key** (secret key, not anon key!)

### 2. Configure Environment

- [ ] Update `.env` file with your actual Supabase credentials:
  ```bash
  SUPABASE_URL=https://your-actual-project.supabase.co
  SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### 3. Initialize Database

Choose **ONE** method:

**Option A: Using Setup Script (Recommended)**
```bash
./scripts/setup.sh
```

**Option B: Manual CLI**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**Option C: Manual SQL**
1. Go to Supabase Dashboard > SQL Editor
2. Run `supabase/migrations/001_schema.sql`
3. Run `supabase/migrations/002_sales_nurture.sql`
4. Run `supabase/migrations/003_leadgen_tables.sql`

### 4. Verify Setup

```bash
# Test connection
npm run test:connection

# Should output:
# ✅ Environment variables found
# ✅ Successfully connected to Supabase
# ✅ All 12 required tables verified
# 🎉 Supabase connection test PASSED!
```

### 5. Test Agents

```bash
# Test STS lead generation
npm run test:agent:leadgen:sts

# Test PDC sales nurture
npm run test:agent:sales:pdc

# Run all tests
npm run test:all
```

## 🗄️ Database Schema

After setup, you'll have **24 tables**:

### Core Tables (6)
- `agent_runs` - Agent execution tracking
- `memories` - Vector memory storage
- `pdc_leads` - PDC lead tracking
- `sts_companies` - STS company prospects
- `content_library` - Content for social media
- `social_queue` - Social media scheduling

### PDC Sales (5)
- `pdc_athletes` - Athlete enrollment pipeline
- `pdc_followup_queue` - Follow-up sequences
- `pdc_referral_partners` - Partner relationships
- `pdc_referrals` - Referral tracking
- `pdc_events` - Workshops and events

### STS Sales (3)
- `sts_deals` - Enterprise deal pipeline
- `sts_followup_queue` - Follow-up sequences
- `sts_partner_updates` - Vendor updates

### STS Lead Gen (5)
- `sts_inbound_leads` - Website leads
- `sts_outbound_prospects` - Target companies
- `sts_trigger_events` - Signals (funding, hiring)
- `sts_referrals` - Client referrals
- `sts_outreach_queue` - Outreach automation

### PDC Lead Gen (5)
- `pdc_inbound_leads` - Website/social leads
- `pdc_outbound_prospects` - Schools/clubs
- `pdc_partner_prospects` - Strategic partners
- `pdc_referral_requests` - Referral tracking
- `pdc_outreach_queue` - Outreach automation

## 🧪 Test Examples

### Test STS Lead Generation
```bash
npm run test:agent:leadgen:sts
```

Tests:
1. ✅ Capture inbound lead from website
2. ✅ Build prospect list by ICP criteria
3. ✅ Generate personalized outreach
4. ✅ Generate daily lead digest

### Test PDC Sales Nurture
```bash
npm run test:agent:sales:pdc
```

Tests:
1. ✅ Schedule athlete consultation
2. ✅ Check due follow-ups
3. ✅ Generate enrollment pipeline digest

## 🚨 Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"
- Make sure `.env` file exists
- Verify credentials are not placeholder values
- Restart terminal/process after updating `.env`

### "relation does not exist"
- Database tables haven't been created
- Run migrations: `supabase db push`
- Or run SQL files manually in Supabase dashboard

### "Invalid API key"
- Using `anon` key instead of `service_role` key
- Check for extra spaces/newlines in `.env`

### "Cannot connect to Supabase"
- Check internet connection
- Verify `SUPABASE_URL` is correct
- Check Supabase project status in dashboard

## 📦 What Each Agent Does

### STS Lead Generation (`test:agent:leadgen:sts`)
- Captures inbound leads from website
- Builds prospect lists by ICP
- Monitors trigger events (funding, hiring)
- Generates personalized outreach
- Tracks referrals

### PDC Lead Generation (`test:agent:leadgen:pdc`)
- Captures athlete/parent inquiries
- Targets schools and clubs
- Finds strategic partners
- Generates outreach campaigns
- Tracks referrals

### STS Sales Nurture (`test:agent:sales:sts`)
- Manages enterprise deal pipeline
- Automates follow-up sequences
- Generates proposals
- Prepares for sales meetings
- Tracks partner updates

### PDC Sales Nurture (`test:agent:sales:pdc`)
- Manages athlete enrollment pipeline
- Schedules consultations
- Automates parent follow-ups
- Nurtures partner relationships
- Tracks workshop leads

## 🚀 Next Steps

1. **Add AI API Keys** to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```

2. **Test All Agents**:
   ```bash
   npm run test:all
   ```

3. **Deploy to Production**:
   - Railway: `railway up`
   - Render: Push to GitHub, connect repo
   - Vercel: `vercel deploy`

4. **Set Up Scheduled Jobs** (optional):
   - Use Trigger.dev for job scheduling
   - Or use Supabase Edge Functions + cron
   - Or use Vercel Cron Jobs

5. **Monitor in Supabase**:
   - View data in Table Editor
   - Check agent runs in `agent_runs` table
   - Monitor leads, deals, and outreach

## 🎉 You're Ready!

Your agent system is now fully configured and ready to:
- ✅ Capture and qualify leads automatically
- ✅ Generate personalized outreach at scale
- ✅ Nurture deals through the sales pipeline
- ✅ Track referrals and partnerships
- ✅ Automate follow-up sequences

Start building! 🚀
