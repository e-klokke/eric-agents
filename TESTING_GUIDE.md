# Testing Guide - Eric's AI Agent System

This guide will help you test your AI agent system locally before deployment.

## Prerequisites

✅ You must have completed these steps:
1. Installed dependencies: `npm install`
2. Set up `.env` file with your API keys
3. Pushed database migrations to Supabase
4. See `SUPABASE_SETUP.md` for setup instructions

## Quick Test Checklist

### 1. Test Database Connection

Verify Supabase connection and all tables exist:

```bash
npm run test:connection
```

Expected output:
```
🔍 Testing Supabase Connection...

1️⃣  Checking environment variables...
✅ Environment variables found

2️⃣  Testing database connection...
✅ Successfully connected to Supabase

3️⃣  Verifying database tables...
✅ All 13 required tables verified

4️⃣  Testing RPC functions...
✅ get_sts_leadgen_summary
✅ get_pdc_leadgen_summary

🎉 Supabase connection test PASSED!
```

If this test fails, check `SUPABASE_SETUP.md` for troubleshooting.

### 2. Test All Agents

Run the complete test suite:

```bash
npm run test:all
```

This runs:
- Database connection test
- STS lead generation agent test
- PDC sales nurture agent test

### 3. Test Individual Agents

Test specific agents one at a time:

```bash
# Test STS lead generation
npm run test:agent:leadgen:sts

# Test PDC sales nurture
npm run test:agent:sales:pdc
```

These tests will:
- Create sample data in the database
- Run the agent logic
- Display results in the terminal
- Store data in Supabase for verification

### 4. Manual API Testing (Optional)

If you've started the HTTP server (`npm run dev`), you can also test via API:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API info
curl http://localhost:3000/api/info
```

For testing individual agent endpoints via API, see the endpoint documentation in `src/index.ts`.

## Verify Database Results

After running agents, verify data was stored in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Table Editor** in sidebar
4. Check these tables for test data:
   - `agent_runs` - Agent execution logs
   - `sts_inbound_leads` - STS test lead data
   - `pdc_athletes` - PDC test athlete data
   - `pdc_followup_queue` - PDC follow-up tasks

## Troubleshooting

### Connection Test Fails

**Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"**
- Check your `.env` file exists and has values
- Ensure you're using the `service_role` key, not `anon` key
- Restart your terminal after updating `.env`

**Error: "Database tables don't exist yet"**
- Run migrations: `supabase db push`
- Or manually run SQL files in Supabase Dashboard

**Error: "Connection failed"**
- Check your internet connection
- Verify SUPABASE_URL is correct
- Verify you're using service_role key from Project Settings → API

### Agent Tests Fail

**Error: "Missing ANTHROPIC_API_KEY"**
- Add your Anthropic API key to `.env`
- Get key from: https://console.anthropic.com/settings/keys

**Error: "Missing OPENAI_API_KEY"**
- Add your OpenAI API key to `.env`
- Get key from: https://platform.openai.com/api-keys

**Error: "Insufficient credits"**
- Check Anthropic credits: https://console.anthropic.com/settings/usage
- Check OpenAI credits: https://platform.openai.com/usage

## Next Steps After Testing

Once all tests pass successfully:

✅ **Database connection verified**
✅ **All tables created and accessible**
✅ **Agents running without errors**
✅ **Data stored correctly in Supabase**

You're ready to:
1. Deploy to production (see `DEPLOY_RAILWAY.md`)
2. Set up scheduled jobs with Trigger.dev
3. Configure Telegram bot for manual triggers (optional)
4. Add external integrations (Apollo.io, Hunter.io, etc.)

## Cost Monitoring

Estimated cost per agent run:
- Lead Generation agents: ~$0.05-0.10
- Sales Nurture agents: ~$0.02-0.05
- Research agents: ~$0.10-0.15
- Content generation: ~$0.05

Monitor your API usage:
- Anthropic Console: https://console.anthropic.com/settings/usage
- OpenAI Dashboard: https://platform.openai.com/usage

## Additional Testing Options

### Telegram Bot Testing

If you've configured `TELEGRAM_BOT_TOKEN` in `.env`:

```bash
npm run bot
```

Then message your bot with commands like:
- `/help` - List available commands
- `/status` - Check system status

### HTTP Server Testing

For production-like testing:

```bash
npm run dev
```

Then use the API endpoints documented in `src/index.ts`.

---

For more information, see:
- `SUPABASE_SETUP.md` - Database setup
- `README.md` - System overview
- `DEPLOY_RAILWAY.md` - Production deployment
