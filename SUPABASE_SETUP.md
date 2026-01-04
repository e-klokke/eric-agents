# Supabase Setup Guide

## Step 1: Get Your Supabase Credentials

### Option A: Create New Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - Name: `eric-agents` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to you
5. Wait for project to initialize (~2 minutes)

### Option B: Use Existing Supabase Project
1. Go to https://supabase.com/dashboard
2. Select your existing project

## Step 2: Get API Keys

1. In Supabase Dashboard, go to **Project Settings** (gear icon)
2. Click **API** in sidebar
3. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **service_role key** (under "Project API keys" - this is the secret key)

⚠️ **Important**: Use `service_role` key, NOT `anon` key (agents need full database access)

## Step 3: Configure Environment Variables

```bash
# Edit .env file
nano .env

# Replace with your actual values:
SUPABASE_URL=https://your-actual-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key

# Keep other keys as-is for now
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

## Step 4: Initialize Database Schema

### Using Supabase CLI (Recommended)

```bash
# Link to your project
supabase link --project-ref your-project-ref

# The project-ref is the part before .supabase.co in your URL
# Example: https://abcdefgh.supabase.co -> project-ref is "abcdefgh"

# Push migrations to create all tables
supabase db push

# When prompted, confirm with 'y' to push all three migrations:
# • 001_schema.sql
# • 002_sales_nurture.sql
# • 003_leadgen_tables.sql
```

**Note on Vector Index**: The migration skips creating a vector index on the `memories` table due to pgvector's 2000 dimension limit (we use 3072-dimensional embeddings). Vector search will still work via sequential scan. This is fine for small-to-medium datasets.

### Alternative: Manual SQL Execution

If you prefer not to use the CLI:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run these migration files in order:
   - `supabase/migrations/001_schema.sql` → Run
   - `supabase/migrations/002_sales_nurture.sql` → Run
   - `supabase/migrations/003_leadgen_tables.sql` → Run

## Step 5: Verify Connection

```bash
# Test connection
npm run test:connection

# This should output:
# ✅ Connected to Supabase
# ✅ Database tables verified
```

## Step 6: Test Agents

```bash
# Test all agents at once
npm run test:all

# Or test individually:
npm run test:agent:leadgen:sts  # STS lead generation
npm run test:agent:sales:pdc     # PDC sales nurture
```

## Troubleshooting

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"
- Make sure `.env` file exists and has correct values
- Restart your terminal/process after updating `.env`

### Error: "relation does not exist"
- Database tables haven't been created yet
- Run migrations using Method A or B above

### Error: "Invalid API key"
- Make sure you're using `service_role` key, not `anon` key
- Check for extra spaces or newlines in `.env` file

### Error: "Cannot connect to Supabase"
- Check your internet connection
- Verify the SUPABASE_URL is correct
- Check Supabase project status in dashboard

## Next Steps

Once setup is complete:
1. ✅ Test all 4 agents
2. ✅ Verify data is being stored in Supabase
3. ✅ Set up scheduled jobs (optional)
4. ✅ Deploy to production (Railway/Render/etc.)

## Database Schema Overview

After migrations, you'll have:
- **24 tables** for leads, deals, outreach, referrals
- **4 RPC functions** for summary stats
- **Indexes** for query performance
- **Triggers** for auto-updating timestamps

View your tables in Supabase Dashboard → **Table Editor**
