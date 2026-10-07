@echo off
title Apex Tickets - Backend Server (Django)
cd /d "%~dp0backend"
echo ===================================================
echo   Apex Tickets - Django REST Framework Backend
echo   API URL: http://127.0.0.1:8000/api/
echo   Swagger Docs: http://127.0.0.1:8000/api/docs/
echo   Admin Panel: http://127.0.0.1:8000/admin/
echo ===================================================
call venv\Scripts\activate.bat
python manage.py runserver 127.0.0.1:8000
pause
