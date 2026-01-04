# Railway Deployment Guide

Deploy your AI agent system to Railway for production use.

## Prerequisites

- ✅ Tested locally and everything works
- ✅ Have a GitHub account
- ✅ Code pushed to a GitHub repository

## Step 1: Prepare for Deployment

### Push to GitHub

```bash
cd /Users/me/Desktop/tech/eric-agents

# Initialize git if not already done
git init

# Create .gitignore (should already exist)
# Make sure .env is in .gitignore!

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI agent system"

# Create GitHub repo and push
# (Follow GitHub instructions to add remote and push)
```

## Step 2: Set Up Railway

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repos
   - Select your `eric-agents` repository

3. **Configure Build Settings**
   - Railway should auto-detect Node.js
   - Root directory: `infrastructure`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

## Step 3: Set Environment Variables

In Railway dashboard:

1. Click on your deployment
2. Go to "Variables" tab
3. Add these environment variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
API_KEY=create-a-strong-random-key-here
PORT=3000
NODE_ENV=production
```

**IMPORTANT**:
- Don't copy from your local `.env` - paste values individually
- Generate a NEW strong `API_KEY` for production (use a password generator)
- Never commit `.env` to git!

## Step 4: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Wait for build to complete (2-3 minutes)
3. Check logs for any errors

## Step 5: Get Your Public URL

1. In Railway dashboard, click "Settings"
2. Click "Generate Domain"
3. You'll get a URL like: `https://your-app.up.railway.app`

## Step 6: Test Production Deployment

Test the health endpoint:

```bash
curl https://your-app.up.railway.app/health
```

Test an agent (replace URL and API key):

```bash
curl -X POST https://your-app.up.railway.app/trigger/research/personal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-production-api-key" \
  -d '{
    "name": "Test Person",
    "company": "Test Company",
    "context": "test"
  }'
```

## Step 7: Set Up Custom Domain (Optional)

1. In Railway, go to Settings
2. Add custom domain
3. Update your DNS records as instructed
4. SSL is automatic

## Monitoring & Logs

### View Logs
- Railway Dashboard → Your service → "Logs" tab
- Real-time logs of all requests and agent runs

### Monitor Costs
- Railway Dashboard → Project Settings → "Usage"
- Track API costs in Anthropic and OpenAI dashboards

### Set Up Alerts
- Railway can notify you of crashes or errors
- Set up in Settings → Notifications

## Environment-Specific Configuration

You can have different settings for dev vs production:

**Local (development)**:
```bash
# .env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

**Railway (production)**:
```bash
# Railway variables
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## Continuous Deployment

Once set up, Railway automatically deploys when you:
1. Push to your main/master branch
2. Changes are detected
3. Build passes
4. New version goes live

## Rollback

If something goes wrong:
1. Railway Dashboard → Deployments
2. Find a previous working deployment
3. Click "Redeploy"

## Cost Estimates

**Railway Costs** (as of 2024):
- Hobby plan: $5/month
- Includes: 500 hours runtime, 512MB RAM, shared CPU
- Good for testing and low-volume usage

**For production at scale**:
- Pro plan: $20/month
- Better performance, more resources

**Total Monthly Costs** (estimated):
- Railway: $5-20
- Anthropic API: $10-100 (depends on usage)
- OpenAI API: $5-20 (embeddings)
- Supabase: Free tier should be fine initially

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Using strong random `API_KEY` in production
- [ ] Using `SUPABASE_SERVICE_KEY` not anon key
- [ ] Environment variables set in Railway, not in code
- [ ] API endpoints require authentication
- [ ] Rate limiting is enabled

## Next Steps After Deployment

1. **Set up Trigger.dev** for scheduled jobs
2. **Build a frontend** to view leads and content
3. **Add webhooks** for external integrations
4. **Monitor costs** and optimize model usage
5. **Scale** as usage grows

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `package.json`

### Deploy Succeeds But App Crashes
- Check application logs in Railway
- Verify environment variables are set correctly
- Test database connection

### High Costs
- Check Anthropic/OpenAI usage dashboards
- Add rate limiting if needed
- Use Haiku model for simpler tasks
- Batch operations when possible

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: Join for community support
- GitHub Issues: Track problems in your repo
