@echo off
setlocal enabledelayedexpansion

title Vank
cd /d "%~dp0"

echo ========================================================
echo   VANK // LOCAL FINANCE WORKSPACE
echo ========================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: Check the locked dependency tree after switching branches or pulling updates.
call npm ls --depth=0 >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing project packages...
    call npm ci
    if errorlevel 1 (
      echo [ERROR] Failed to install dependencies.
      pause
      exit /b 1
    )
)

:: 3. Launch browser after a brief delay in background
echo [INFO] Launching Vank...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/"

:: 4. Start both the API and the frontend
echo [INFO] Starting Vank on http://localhost:5173/
echo [INFO] Press Ctrl+C in this terminal window to stop the server.
echo.

call npm start

pause
