@echo off
echo =====================================
echo Killing All Command Manager Instances
echo =====================================
echo.

echo Killing all "Command Manager.exe" processes...
taskkill /F /IM "Command Manager.exe" /T 2>nul

echo Killing all "electron.exe" processes...
taskkill /F /IM "electron.exe" /T 2>nul

echo Killing all node processes related to Command Manager...
taskkill /F /IM "node.exe" /T 2>nul

echo.
echo =====================================
echo All instances terminated
echo =====================================
echo.
pause
