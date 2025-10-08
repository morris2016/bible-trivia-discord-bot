# Discord Bot Deployment to Render

## Prerequisites
1. Create a Render account at https://render.com
2. Have your Discord bot token and application ID ready
3. Have your GospelWays API running and accessible

## Deployment Steps

### 1. Create a GitHub Repository
Ensure your Discord bot code is pushed to a GitHub repository.

### 2. Deploy to Render
1. Go to https://dashboard.render.com
2. Click "New +" and select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file and configure the service

### 3. Set Environment Variables
After deployment, set the following environment variables in Render:
- `DISCORD_TOKEN`: Your Discord bot token (keep secret)
- `DISCORD_CLIENT_ID`: Your Discord application ID (keep secret)

The other environment variables are pre-configured in `render.yaml`.

### 4. Monitor the Deployment
- View logs in the Render dashboard
- The bot will automatically start and register slash commands
- Monitor for any connection issues

## Configuration
The bot is configured to:
- Run as a background worker (never sleeps)
- Connect to your GospelWays API at https://gospelways.com
- Use production logging levels
- Handle graceful shutdowns

## Troubleshooting
- Check logs for token-related errors
- Verify API endpoints are accessible
- Ensure Discord bot permissions are set correctly
- Check Render service status

## Cost
This service runs on Render's free tier with:
- 750 hours/month free
- No additional costs for worker services that stay active
