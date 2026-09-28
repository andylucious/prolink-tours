@echo off
REM Starts the Tours ERP (website + back office) on http://localhost:3000
REM Keep this window open while using the system; close it to stop.
REM If the server ever crashes, this automatically restarts it.
title Tours ERP - http://localhost:3000
cd /d "%~dp0"

:restart
call npm.cmd run dev
echo.
echo ==============================================
echo  The server stopped. Restarting in 3 seconds...
echo  (Close this window to stop it for good.)
echo ==============================================
timeout /t 3 >nul
goto restart
