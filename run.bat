@echo off
setlocal enabledelayedexpansion

title Workspace Expense Tracker // Finance OS
cd /d "%~dp0"

echo ========================================================
echo   WORKSPACE EXPENSE TRACKER // FINANCE OS
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

:: 2. Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing project packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo.
)

:: 3. Launch browser after a brief delay in background
echo [INFO] Launching Workspace Expense Tracker...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/"

:: 4. Start the development server
echo [INFO] Starting Vite dev server on http://localhost:5173/
echo [INFO] Press Ctrl+C in this terminal window to stop the server.
echo.

call npm run dev

pause
