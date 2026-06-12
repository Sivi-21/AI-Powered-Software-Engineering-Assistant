@echo off
title AI-Powered Software Engineering Assistant - Startup Utility

echo =======================================================================
echo     AI-Powered Software Engineering Assistant - Startup Utility
echo =======================================================================
echo.

:: Detect Python Virtual Environment and launch Backend
echo [1/2] Launching FastAPI Backend...
if exist "backend\.venv" (
    echo Found virtual environment in backend\.venv
    start "Backend - FastAPI" cmd /k "cd backend && call .venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) else if exist "backend\venv" (
    echo Found virtual environment in backend\venv
    start "Backend - FastAPI" cmd /k "cd backend && call venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
) else (
    echo No local virtual environment found, running with system python...
    start "Backend - FastAPI" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
)

:: Launch Frontend
echo [2/2] Launching React/Vite Frontend...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo  FastAPI Backend and React Frontend have been started in separate windows.
echo  - Backend API documentation: http://localhost:8000/docs
echo  - Frontend Dev Server: Refer to the Vite terminal window
echo =======================================================================
echo.
pause
