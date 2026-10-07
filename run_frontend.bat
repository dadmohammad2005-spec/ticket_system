@echo off
title Apex Tickets - Frontend Web (Vite + React)
set PATH=%~dp0tools\node;%PATH%
cd /d "%~dp0frontend"
echo ===================================================
echo   Apex Tickets - React TypeScript Web App
echo   Frontend URL: http://localhost:5173
echo ===================================================
call npm run dev
pause
