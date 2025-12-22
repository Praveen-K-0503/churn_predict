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

echo [1/6] Installing dependencies...
cd backend
pip install -q -r requirements_simple.txt
echo ✅ Dependencies installed

echo.
echo [2/6] Setting up database...
set DJANGO_SETTINGS_MODULE=core.settings_simple
python manage.py makemigrations auth_app --verbosity=0
python manage.py makemigrations ml_app --verbosity=0
python manage.py migrate --verbosity=0
echo ✅ Database ready

echo.
echo [3/6] Creating admin user...
echo from auth_app.models import CustomUser; CustomUser.objects.get_or_create(username='admin', defaults={'email': 'admin@churnguard.com', 'is_staff': True, 'is_superuser': True, 'role': 'admin'}) | python manage.py shell --verbosity=0
echo from auth_app.models import CustomUser; u = CustomUser.objects.get(username='admin'); u.set_password('admin123'); u.save() | python manage.py shell --verbosity=0
echo ✅ Admin user ready

echo.
echo [4/6] Starting backend server...
start "ChurnGuard Backend" cmd /k "title ChurnGuard Backend && set DJANGO_SETTINGS_MODULE=core.settings_simple && python manage.py runserver"
echo ✅ Backend starting...

echo.
echo [5/6] Waiting for server...
timeout /t 3 /nobreak >nul
echo ✅ Server ready

echo.
echo [6/6] Opening frontend...
cd ..\simple-frontend
start "" index.html
echo ✅ Frontend opened

echo.
echo ================================================================================
echo                              🎉 CHURNGUARD IS RUNNING! 🎉
echo ================================================================================
echo.
echo 🌐 Backend API:       http://localhost:8000
echo 🔧 Admin Panel:       http://localhost:8000/admin
echo 💻 Frontend:          Opened in browser
echo.
echo 🔑 Login: admin / admin123
echo 📊 Dataset: 7,043 real telecom customers
echo.
echo ================================================================================
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /f /im python.exe >nul 2>&1
echo Done!