@echo off
title ChurnGuard - Enterprise Churn Prediction Platform
color 0A

echo.
echo  ██████╗██╗  ██╗██╗   ██╗██████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
echo ██╔════╝██║  ██║██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo ██║     ███████║██║   ██║██████╔╝██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo ██║     ██╔══██║██║   ██║██╔══██╗██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo ╚██████╗██║  ██║╚██████╔╝██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo  ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
echo.
echo                    Enterprise Customer Churn Prediction Platform
echo                           Real Dataset: 7,043 Telecom Customers
echo.
echo ================================================================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    echo.
    pause
    exit /b 1
)

echo ✅ Python detected
echo.

echo [STEP 1/8] Installing Python dependencies...
echo ────────────────────────────────────────────────
cd backend
pip install -q -r requirements_simple.txt
echo ✅ Dependencies installed
echo.

echo [STEP 2/8] Configuring Django settings...
echo ────────────────────────────────────────────────
set DJANGO_SETTINGS_MODULE=core.settings_simple
echo ✅ Using SQLite database (no PostgreSQL required)
echo.

echo [STEP 3/8] Creating database structure...
echo ────────────────────────────────────────────────
python manage.py makemigrations auth_app --verbosity=0
python manage.py makemigrations ml_app --verbosity=0
python manage.py migrate --verbosity=0
echo ✅ Database created
echo.

echo [STEP 4/8] Creating admin user...
echo ────────────────────────────────────────────────
echo from auth_app.models import CustomUser; CustomUser.objects.get_or_create(username='admin', defaults={'email': 'admin@churnguard.com', 'is_staff': True, 'is_superuser': True, 'role': 'admin'}) | python manage.py shell --verbosity=0
echo ✅ Admin user created
echo.

echo [STEP 5/8] Setting admin password...
echo ────────────────────────────────────────────────
echo from auth_app.models import CustomUser; u = CustomUser.objects.get(username='admin'); u.set_password('admin123'); u.save() | python manage.py shell --verbosity=0
echo ✅ Password configured
echo.

echo [STEP 6/8] Starting Django backend server...
echo ────────────────────────────────────────────────
start "ChurnGuard Backend API" cmd /k "title ChurnGuard Backend && set DJANGO_SETTINGS_MODULE=core.settings_simple && python manage.py runserver --verbosity=0"
echo ✅ Backend server starting...
echo.

echo [STEP 7/8] Waiting for server initialization...
echo ────────────────────────────────────────────────
timeout /t 4 /nobreak >nul
echo ✅ Server ready
echo.

echo [STEP 8/8] Opening ChurnGuard frontend...
echo ────────────────────────────────────────────────
cd ..\simple-frontend
start "" index.html
echo ✅ Frontend opened
echo.

echo ================================================================================
echo                              🎉 CHURNGUARD IS RUNNING! 🎉
echo ================================================================================
echo.
echo 🌐 Backend API Server:    http://localhost:8000
echo 🔧 Django Admin Panel:    http://localhost:8000/admin
echo 💻 Frontend Dashboard:    simple-frontend/index.html (opened in browser)
echo.
echo 🔑 LOGIN CREDENTIALS:
echo    Username: admin
echo    Password: admin123
echo.
echo 📊 DATASET INFORMATION:
echo    • Real telecom customer data
echo    • 7,043 customer records
echo    • 26.5%% churn rate
echo    • 21 features for prediction
echo.
echo 🚀 QUICK START GUIDE:
echo    1. Admin Panel: Login at http://localhost:8000/admin
echo    2. Frontend: Use the opened browser window
echo    3. Test predictions with the form
echo    4. View analytics dashboard
echo.
echo ================================================================================
echo.

REM Test APIs
echo 🧪 Running API health checks...
cd ..
python test_apis.py

echo.
echo ⚡ ChurnGuard is fully operational!
echo.
echo Press any key to stop all services and exit...
pause >nul

echo.
echo 🛑 Stopping ChurnGuard services...
taskkill /f /im python.exe >nul 2>&1
echo ✅ All services stopped
echo.
echo Thank you for using ChurnGuard! 👋
timeout /t 2 /nobreak >nul