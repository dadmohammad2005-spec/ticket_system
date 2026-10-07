@echo off
title Apex Tickets Launcher
echo ===================================================
echo   Launching Apex Online Ticket Booking System...
echo ===================================================
start "Apex Backend" cmd /c "%~dp0run_backend.bat"
start "Apex Frontend" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both servers have been launched in separate windows!
echo - Backend API & Swagger: http://127.0.0.1:8000/api/docs/
echo - Frontend Application:  http://localhost:5173
echo.
pause
