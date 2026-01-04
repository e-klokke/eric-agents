# Telegram Bot - Complete Setup Guide

✅ **STATUS: All 9 agents integrated and ready to use**

## 🎯 Overview

Your Telegram bot now provides mobile + desktop access to all 9 AI agents:
- **3 Research agents** (Personal, PDC, STS)
- **2 Content generation agents** (PDC, STS)
- **2 Sales/Nurture agents** (PDC, STS)
- **2 Lead generation agents** (PDC, STS)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Telegram ID

**Option A: Use Another Bot (Easiest)**
1. Open Telegram
2. Search for `@userinfobot`
3. Start chat
4. It will show your user ID immediately

**Option B: Use the Helper Script**
1. Send any message to your bot
2. Check the output of the running script
3. Your ID will be displayed

### Step 2: Configure Your .env File

Add or update these lines in your `.env` file:

```env
# Your bot token (from @BotFather)
TELEGRAM_BOT_TOKEN=8418057873:AAEEKAjbV4tFpwcoZgIyEbDfKYNi7CIBHwU

# Your Telegram user ID (from @userinfobot or script)
TELEGRAM_ALLOWED_USERS=YOUR_USER_ID_HERE

# Example with multiple users:
# TELEGRAM_ALLOWED_USERS=123456789,987654321
```

### Step 3: Start the Bot

```bash
cd /Users/me/Desktop/tech/eric-agents/infrastructure
npm run bot
```

You should see:
```
🤖 Telegram bot started with all 9 agents
```

### Step 4: Test It!

Open Telegram and send `/start` to your bot.

---

## 📱 All Available Commands

### General AI Assistant (NEW!)

```
/ask <any question>
Get live answers to ANY question using real-time web data

Examples:
/ask what is the current price of bitcoin?
/ask latest AI trends 2026
/ask best restaurants in Tampa FL
/ask explain quantum computing simply
```

### Research Commands

```
/research_personal Name, Company
Example: /research_personal Satya Nadella, Microsoft

/research_athlete Name, Sport
Example: /research_athlete LeBron James, Basketball

/research_company Company, Website
Example: /research_company Acme Corp, acme.com
```

### Content Generation

```
/content_pdc Topic
Example: /content_pdc mental toughness

/content_sts Topic
Example: /content_sts Zero Trust security
```

### Sales & Pipeline Management

```
/pdc_followups
Shows athletes needing follow-up

/pdc_digest
Full PDC enrollment summary

/sts_followups
Shows companies needing follow-up

/sts_digest
Full STS pipeline summary
```

### Lead Generation

```
/pdc_leads
Recent PDC athlete leads

/sts_leads
Recent STS company leads
```

### Utility

```
/myid
Get your Telegram user ID

/start
Show all commands
```

---

## 🔒 Security Features

1. **User Whitelist**: Only users in `TELEGRAM_ALLOWED_USERS` can use the bot
2. **Unauthorized Message**: Users not in whitelist see: "❌ Unauthorized. Use /myid to get your user ID."
3. **All commands protected**: Every command checks authorization first

---

## 🌐 Deploy to Run 24/7 (Optional)

### Option 1: Railway (Recommended)

1. **Create a new service** on Railway
2. **Connect your GitHub repo**
3. **Set environment variables** in Railway dashboard:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ALLOWED_USERS`
   - All other required API keys
4. **Deploy**: Railway auto-deploys on push

### Option 2: Run on Your Server/VPS

```bash
# Install PM2 for process management
npm install -g pm2

# Start bot with PM2
pm2 start npm --name "eric-agents-bot" -- run bot

# View logs
pm2 logs eric-agents-bot

# Set to auto-start on reboot
pm2 startup
pm2 save
```

### Option 3: Local (Temporary)

```bash
# Just run in terminal
npm run bot

# Or run in background
nohup npm run bot > bot.log 2>&1 &
```

---

## 🎯 Usage Examples

### Morning Routine from Mobile

```
/pdc_followups
/sts_followups
/pdc_leads
/sts_leads
```

Result: Full pipeline overview in under 30 seconds

### Before a Meeting

```
/research_personal John Smith, Acme Corp
```

Result: Complete research brief with talking points

### Content Creation

```
/content_pdc handling pressure in playoffs
/content_sts cloud migration best practices
```

Result: 4+ social posts ready to publish

### Prospect Research

```
/research_company Tampa General Hospital, tgh.org
/research_athlete Marcus Thompson, Football
```

Result: Qualification scores and outreach strategies

---

## 💡 Pro Tips

1. **Use from anywhere**: Telegram works on phone, tablet, desktop
2. **Offline support**: Send commands when offline, they execute when reconnected
3. **Chat history**: All results saved in Telegram, searchable
4. **Quick access**: Pin the bot chat for instant access
5. **Multiple devices**: Same bot works on all your devices simultaneously

---

## 🔧 Troubleshooting

### Bot doesn't respond

**Check 1**: Is the bot running?
```bash
# Check if bot process is active
ps aux | grep telegram-bot
```

**Check 2**: Is your user ID correct in `.env`?
```bash
cat .env | grep TELEGRAM_ALLOWED_USERS
```

**Check 3**: Check bot logs
```bash
# If running with npm run bot, check terminal output
# If running with PM2:
pm2 logs eric-agents-bot
```

### "Unauthorized" message

Your user ID is not in `TELEGRAM_ALLOWED_USERS`:
1. Send `/myid` to the bot (this command works for everyone)
2. Copy your ID
3. Add to `.env`: `TELEGRAM_ALLOWED_USERS=your_id_here`
4. Restart bot: `npm run bot`

### Commands fail with errors

**Check database connection**:
```bash
npm run test:connection
```

**Check API keys**:
```bash
cat .env | grep API_KEY
```

Make sure you have:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## 📊 Cost Estimates

Running the bot 24/7:
- **Server hosting**: $5-10/month (Railway, DigitalOcean, etc.)
- **API costs**: ~$100-150/month (based on usage)
- **Telegram bot**: FREE

**Total**: ~$105-160/month for full mobile + desktop agent access

---

## 🎉 What's Working Now

✅ All 9 agents accessible via Telegram
✅ Mobile access (iOS, Android)
✅ Desktop access (Mac, Windows, Linux, Web)
✅ Security with user whitelist
✅ Rich formatted output
✅ Error handling
✅ Authorization checks

---

## 🚀 Next Steps

1. ✅ **Get your Telegram ID** (use @userinfobot)
2. ✅ **Add ID to .env file**
3. ✅ **Start the bot**: `npm run bot`
4. ✅ **Test with**: `/start`
5. 🔲 **Deploy to Railway** (optional, for 24/7 access)
6. 🔲 **Add more users** (optional, share with team)
7. 🔲 **Set up scheduled reports** (optional, daily digests)

---

## 📞 Quick Reference Card

Save this to your phone:

```
🔍 RESEARCH
/research_personal Name, Company
/research_athlete Name, Sport
/research_company Company, Website

✍️ CONTENT
/content_pdc Topic
/content_sts Topic

💼 PIPELINE
/pdc_followups
/pdc_digest
/sts_followups
/sts_digest

📈 LEADS
/pdc_leads
/sts_leads
```

---

Your agents are now accessible from anywhere, anytime! 🎉
