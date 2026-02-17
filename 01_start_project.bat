@echo off
echo.
echo   WBC Deal Matching System
echo   ========================
echo.

echo   Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo   Installing dependencies...
    npm install
)

echo.
echo   Login: admin@wbc.com / check this out o01
echo   URL:   http://localhost:5173/
echo.

start http://localhost:5173/
npm run dev
