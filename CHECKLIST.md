# Supabase Setup Checklist

Use this checklist to track your setup progress.

## Prerequisites
- [ ] Node.js and npm installed
- [ ] Supabase CLI installed (`brew install supabase/tap/supabase`)
- [ ] Git repository set up

## Step 1: Get Supabase Credentials
- [ ] Logged into https://supabase.com/dashboard
- [ ] Created new project OR selected existing project
- [ ] Copied Project URL from Settings > API
- [ ] Copied service_role key from Settings > API (NOT anon key)

## Step 2: Configure Environment
- [ ] `.env` file exists (copy from `.env.example` if needed)
- [ ] Updated `SUPABASE_URL` in `.env` with actual URL
- [ ] Updated `SUPABASE_SERVICE_KEY` in `.env` with actual key
- [ ] Removed placeholder values

## Step 3: Initialize Database
Choose ONE method and check when complete:

### Option A: Automated Setup Script (Recommended)
- [ ] Ran `./scripts/setup.sh`
- [ ] Script completed successfully
- [ ] Migrations pushed to Supabase

### Option B: Manual CLI
- [ ] Ran `supabase link --project-ref YOUR_REF`
- [ ] Ran `supabase db push`
- [ ] No errors reported

### Option C: Manual SQL
- [ ] Opened Supabase Dashboard > SQL Editor
- [ ] Executed `supabase/migrations/001_schema.sql`
- [ ] Executed `supabase/migrations/002_sales_nurture.sql`
- [ ] Executed `supabase/migrations/003_leadgen_tables.sql`
- [ ] All queries completed successfully

## Step 4: Verify Connection
- [ ] Ran `npm run test:connection`
- [ ] Saw "✅ Environment variables found"
- [ ] Saw "✅ Successfully connected to Supabase"
- [ ] Saw "✅ All X required tables verified"
- [ ] Saw "🎉 Supabase connection test PASSED!"

## Step 5: Add AI API Keys
- [ ] Added `ANTHROPIC_API_KEY` to `.env`
- [ ] (Optional) Added `OPENAI_API_KEY` to `.env`
- [ ] (Optional) Added `TAVILY_API_KEY` to `.env`

## Step 6: Test Agents
- [ ] Ran `npm run test:agent:leadgen:sts`
- [ ] Test passed with "🎉 STS Lead Gen Agent Test PASSED!"
- [ ] Ran `npm run test:agent:sales:pdc`
- [ ] Test passed with "🎉 PDC Sales Agent Test PASSED!"

## Step 7: Verify Data in Supabase
- [ ] Opened Supabase Dashboard > Table Editor
- [ ] See data in `agent_runs` table
- [ ] See data in `sts_inbound_leads` table
- [ ] See data in `pdc_athletes` table

## Step 8: Production Deployment (Optional)
- [ ] Chose deployment platform (Railway/Render/Vercel)
- [ ] Added environment variables to platform
- [ ] Deployed application
- [ ] Tested in production environment

## Troubleshooting Checklist
If you encounter issues, verify:

- [ ] No placeholder values remain in `.env`
- [ ] Using `service_role` key, not `anon` key
- [ ] No extra spaces or newlines in `.env` values
- [ ] Internet connection is working
- [ ] Supabase project is active in dashboard
- [ ] All migration files were executed
- [ ] TypeScript compiled without errors (`npm run build`)

## Success Criteria
You've successfully set up Supabase when:

✅ All test scripts pass
✅ Data appears in Supabase dashboard
✅ Agents can create, read, and update records
✅ No connection errors in logs

## Next Steps After Setup
Once everything is checked off:

1. Review agent code in `src/agents/`
2. Customize agents for your business needs
3. Set up scheduled jobs for automated runs
4. Deploy to production
5. Monitor agent performance in Supabase

---

**Need Help?**
- Review `SUPABASE_SETUP.md` for detailed instructions
- Check `SETUP_COMPLETE.md` for quick reference
- Run `./scripts/setup.sh` for guided setup
