@echo off
echo =================================================
echo Discord Bible Trivia Bot - Windows Startup Setup
echo =================================================

echo This script will set up your Discord bot to run automatically on Windows startup.
echo.
echo WARNING: This will keep your computer running 24/7 and costs ~$200-300/year in electricity!
echo.

pause

echo Installing PM2 globally (if not already installed)...
call npm install -g pm2
if errorlevel 1 (
    echo ERROR: Failed to install PM2. Please check your Node.js installation.
    pause
    exit /b 1
)

echo Setting up PM2 startup for Windows...
call pm2 startup
if errorlevel 1 (
    echo WARNING: PM2 startup setup failed. You may need to run as Administrator.
)

echo Starting Discord bot with PM2...
call pm2 start ecosystem.config.cjs --name "discord-bot"
call pm2 save

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo Your Discord bot is now configured to:
echo - Start automatically when Windows boots
echo - Run indefinitely in the background
echo - Restart automatically if it crashes
echo.
echo IMPORTANT NOTES:
echo - Your computer MUST stay powered on 24/7
echo - Keep Task Manager open to monitor PM2
echo - Check pm2 logs discord-bot --lines 20 for errors
echo.
echo To restart the bot: pm2 restart discord-bot
echo To stop the bot: pm2 stop discord-bot
echo.

pause
