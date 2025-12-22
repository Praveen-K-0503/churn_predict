@echo off
echo ========================================
echo ChurnGuard - Complete Project Startup
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

echo [1/7] Installing backend dependencies...
cd backend
pip install -r requirements_simple.txt
if errorlevel 1 (
    echo WARNING: Some packages failed to install, continuing...
)

echo.
echo [2/7] Using simplified SQLite database...
set DJANGO_SETTINGS_MODULE=core.settings_simple

echo.
echo [3/7] Creating database migrations...
python manage.py makemigrations auth_app
python manage.py makemigrations ml_app
python manage.py migrate

echo.
echo [4/7] Creating admin user...
echo from auth_app.models import CustomUser; CustomUser.objects.get_or_create(username='admin', defaults={'email': 'admin@churnguard.com', 'is_staff': True, 'is_superuser': True, 'role': 'admin'}); print('Admin user ready') | python manage.py shell

echo.
echo [5/7] Setting admin password...
echo from auth_app.models import CustomUser; u = CustomUser.objects.get(username='admin'); u.set_password('admin123'); u.save(); print('Password set') | python manage.py shell

echo.
echo [6/7] Starting Django server...
start "ChurnGuard Backend" cmd /k "set DJANGO_SETTINGS_MODULE=core.settings_simple && python manage.py runserver"

echo.
echo [7/7] Waiting for server and opening frontend...
timeout /t 3 /nobreak >nul
cd ..\simple-frontend
start "" index.html

echo.
echo ========================================
echo ChurnGuard is now running!
echo ========================================
echo Backend API: http://localhost:8000
echo Admin Panel: http://localhost:8000/admin
echo Frontend: Opened in browser
echo.
echo Login Credentials:
echo Username: admin
echo Password: admin123
echo.
echo Dataset: 7,043 real telecom customers
echo ========================================
echo.
echo Press any key to stop the server...
pause >nul

echo Stopping Django server...
taskkill /f /im python.exe >nul 2>&1
echo Done!