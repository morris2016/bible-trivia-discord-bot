# Discord Bot Deployment to Koyeb

## Prerequisites
1. Create a Koyeb account at https://www.koyeb.com
2. Have your Discord bot token and application ID ready
3. Have your GospelWays API running and accessible

## Free Tier Benefits
- FREE tier with 0.5GB RAM and shared CPU
- Perfect for Discord bots that run continuously
- No costs for background services

## Deployment Steps

### 1. GitHub Repository Setup
Ensure your Discord bot code is pushed to your GitHub repository.

### 2. Deploy to Koyeb
1. Go to https://app.koyeb.com and sign in
2. Click "Create Service" → "Import from GitHub"
3. Connect your GitHub repository: `morris2016/bible-trivia-discord-bot`
4. Koyeb will automatically detect the `koyeb.yaml` configuration

### 3. Set Secrets
Before deployment, create these secrets in Koyeb (use uppercase with underscores):
- **Name**: `DISCORD_TOKEN` → **Value**: Your Discord bot token
- **Name**: `DISCORD_CLIENT_ID` → **Value**: `1425156714386165980`

### 4. Deploy
- Click "Deploy" - Koyeb handles everything automatically!
- The bot will be deployed as a background worker

### 5. Monitor
- View real-time logs in the Koyeb dashboard
- Monitor resource usage
- Bot will run 24/7 automatically

## Configuration
The bot deployment includes:
- ✅ Node.js buildpack for automatic dependency installation
- ✅ Background service (no public access needed)
- ✅ Production environment optimized
- ✅ GospelWays API integration
- ✅ Automatic restarts on errors

## Troubleshooting
- Check deployment logs for errors
- Verify secrets are properly set
- Confirm Discord permissions
- Ensure GospelWays API is accessible

## Cost
**Completely FREE** for your Discord bot with Koyeb's free tier!
- 0.5GB RAM included
- Shared CPU capacity
- No charges for background workers

## What's Deployed
- Bot runs from the `discord-bot/` directory
- Uses `discord-bot/package.json` for dependencies
- Connects to https://gospelways.com API
- Registers slash commands automatically
- Runs continuous background worker
