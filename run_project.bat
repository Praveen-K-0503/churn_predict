@echo off
echo ========================================
echo ChurnGuard - Full Project Startup
echo Real-Time Telecom Churn Prediction
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo [1/6] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/6] Setting up database...
python manage.py makemigrations auth_app
python manage.py makemigrations ml_app
python manage.py migrate --run-syncdb

echo.
echo [3/6] Creating admin user and loading data...
python create_users.py

echo.
echo [4/6] Starting Django server in background...
start "ChurnGuard Backend" cmd /k "python manage.py runserver"

echo.
echo [5/6] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo [6/6] Opening frontend...
cd ..\simple-frontend
start "ChurnGuard Frontend" index.html

echo.
echo ========================================
echo ChurnGuard is now running!
echo ========================================
echo Backend API: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin
echo Frontend: simple-frontend/index.html
echo Login: admin / admin123
echo Dataset: 7,043 real telecom customers
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /f /im python.exe >nul 2>&1
echo Done!