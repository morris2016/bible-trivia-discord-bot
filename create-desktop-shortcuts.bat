@echo off
echo Creating desktop shortcuts for bot management...

set "DESKTOP=%USERPROFILE%\Desktop"
set "SCRIPT_DIR=%~dp0"

echo Creating "Monitor Bot" shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortCut.vbs
echo sLinkFile = "%DESKTOP%\Monitor Bot.lnk" >> CreateShortCut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortCut.vbs
echo oLink.TargetPath = "%SCRIPT_DIR%monitor-bot.bat" >> CreateShortCut.vbs
echo oLink.WorkingDirectory = "%SCRIPT_DIR%" >> CreateShortCut.vbs
echo oLink.Description = "Monitor your Discord bot status and logs" >> CreateShortCut.vbs
echo oLink.IconLocation = "cmd.exe" >> CreateShortCut.vbs
echo oLink.Save >> CreateShortCut.vbs

cscript CreateShortCut.vbs
del CreateShortCut.vbs

echo.
echo Desktop shortcuts created!
echo - Monitor Bot: Check status, logs, and manage bot
echo.

pause
