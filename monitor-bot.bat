@echo off
echo =========================================================
echo Discord Bible Trivia Bot - Status Monitor
echo =========================================================

echo Bot Status:
pm2 status

echo.
echo Bot Logs (last 10 lines):
pm2 logs discord-bot --lines 10 --nostream

echo.
echo Process Details:
pm2 show discord-bot

echo.
echo Memory Usage:
pm2 monit | findstr "Memory"

echo.
echo Commands:
echo - View full logs: pm2 logs discord-bot
echo - Restart bot: pm2 restart discord-bot
echo - Stop bot: pm2 stop discord-bot
echo.

pause
