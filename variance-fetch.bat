@echo off
REM ============================================
REM Variance - NBA Data Fetch Script
REM Run this manually or schedule with Task Scheduler
REM ============================================

REM Configuration
SET PROJECT_PATH=C:\Users\migg_\source\repos\Variance
SET SEASON=2025-26
SET LOG_FILE=%PROJECT_PATH%\logs\fetch-%date:~-4,4%%date:~-10,2%%date:~-7,2%.log

REM Create logs directory if it doesn't exist
if not exist "%PROJECT_PATH%\logs" mkdir "%PROJECT_PATH%\logs"

REM Navigate to project
cd /d "%PROJECT_PATH%"

REM Start logging
echo ============================================ >> "%LOG_FILE%"
echo NBA Data Fetch Started: %date% %time% >> "%LOG_FILE%"
echo Season: %SEASON% >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"

REM Fetch Teams & Stats
echo. >> "%LOG_FILE%"
echo [%time%] Fetching teams and stats... >> "%LOG_FILE%"
call npm run fetch:teams -- %SEASON% >> "%LOG_FILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%time%] ERROR: Teams fetch failed! >> "%LOG_FILE%"
    goto :error
)
echo [%time%] Teams fetch completed successfully >> "%LOG_FILE%"

REM Fetch Season Games
echo. >> "%LOG_FILE%"
echo [%time%] Fetching season games... >> "%LOG_FILE%"
call npm run fetch:games -- %SEASON% >> "%LOG_FILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%time%] ERROR: Games fetch failed! >> "%LOG_FILE%"
    goto :error
)
echo [%time%] Games fetch completed successfully >> "%LOG_FILE%"

REM Success
echo. >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
echo [%time%] All fetches completed successfully! >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
goto :end

:error
echo. >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
echo [%time%] FETCH FAILED - Check log for details >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
REM Optionally open log file on error
notepad "%LOG_FILE%"
exit /b 1

:end
echo Fetch completed. Log saved to: %LOG_FILE%
exit /b 0