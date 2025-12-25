# Discord Bot Deployment to Railway

## Prerequisites
1. Create a Railway account at https://railway.app
2. Have your Discord bot token and application ID ready
3. Have your GospelWays API running and accessible

## Free Tier Benefits
- FREE tier with 512MB RAM and shared CPU
- Perfect for Discord bots that run continuously
- Automatic scaling and zero-downtime deployments

## Deployment Steps

### 1. GitHub Repository Setup
Ensure your Discord bot code is pushed to your GitHub repository.

### 2. Deploy to Railway
1. Go to https://railway.app and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository: `morris2016/bible-trivia-discord-bot`
4. Railway will automatically detect the Dockerfile in the root directory
5. Set the root directory to `discord-bot/` if needed (Railway should auto-detect)

### 3. Set Environment Variables
In your Railway project dashboard, go to "Variables" and add these environment variables:
- **Name**: `DISCORD_TOKEN` → **Value**: Your Discord bot token
- **Name**: `DISCORD_CLIENT_ID` → **Value**: `1425156714386165980`
- **Name**: `NODE_ENV` → **Value**: `production`
- **Name**: `API_GAME_URL` → **Value**: `https://gospelways.pages.dev/api/bible-games`
- **Name**: `LOG_LEVEL` → **Value**: `info`
- **Name**: `PORT` → **Value**: `8000` (optional, Railway sets this automatically)

### 4. Deploy
- Click "Deploy" - Railway handles everything automatically!
- The bot will be deployed as a service

### 5. Monitor
- View real-time logs in the Railway dashboard
- Monitor resource usage
- Bot will run 24/7 automatically

## Configuration
The bot deployment includes:
- ✅ Docker build for consistent deployment
- ✅ Automatic dependency installation from package.json
- ✅ Production environment optimized
- ✅ GospelWays API integration
- ✅ Automatic restarts on errors
- ✅ Health check endpoint at `/health`

## Troubleshooting
- Check deployment logs for errors
- Verify environment variables are properly set
- Confirm Discord permissions
- Ensure GospelWays API is accessible

## Cost
**Completely FREE** for your Discord bot with Railway's free tier!
- 512MB RAM included
- Shared CPU capacity
- 24/7 uptime included

## What's Deployed
- Bot runs from the `discord-bot/` directory
- Uses Dockerfile for containerized deployment
- Uses `discord-bot/package.json` for dependencies
- Connects to https://gospelways.pages.dev API
- Registers slash commands automatically
- Runs continuous service
