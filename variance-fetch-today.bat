@echo off
REM ============================================
REM Variance - Fetch Today's Games Only
REM Run this multiple times per day during game days
REM ============================================

REM Configuration
SET PROJECT_PATH=C:\Users\migg_\source\repos\Variance
SET LOG_FILE=%PROJECT_PATH%\logs\today-%date:~-4,4%%date:~-10,2%%date:~-7,2%.log

REM Create logs directory if it doesn't exist
if not exist "%PROJECT_PATH%\logs" mkdir "%PROJECT_PATH%\logs"

REM Navigate to project
cd /d "%PROJECT_PATH%"

echo [%time%] Fetching today's games... >> "%LOG_FILE%"
call npm run fetch:today >> "%LOG_FILE%" 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo [%time%] ERROR: Today's games fetch failed! >> "%LOG_FILE%"
    exit /b 1
)

echo [%time%] Today's games updated successfully >> "%LOG_FILE%"
exit /b 0