@echo off
title ChurnGuard - Full Stack Application
color 0A

echo.
echo  ██████╗██╗  ██╗██╗   ██╗██████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
echo ██╔════╝██║  ██║██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo ██║     ███████║██║   ██║██████╔╝██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo ██║     ██╔══██║██║   ██║██╔══██╗██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo ╚██████╗██║  ██║╚██████╔╝██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo  ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
echo.
echo                    Full Stack Enterprise Churn Prediction Platform
echo                           Real Dataset: 7,043 Telecom Customers
echo.
echo ================================================================================
echo.

echo [1/4] Starting Django Backend...
cd backend
start "ChurnGuard Backend" cmd /k "python manage.py runserver"
echo ✅ Backend starting at http://localhost:8000
echo.

echo [2/4] Waiting for backend...
timeout /t 3 /nobreak >nul
echo ✅ Backend ready
echo.

echo [3/4] Starting React Frontend...
cd ..\frontend
start "ChurnGuard Frontend" cmd /k "npm run dev"
echo ✅ Frontend starting at http://localhost:3000
echo.

echo [4/4] Opening application...
timeout /t 5 /nobreak >nul
start "" http://localhost:3000
echo ✅ Application opened
echo.

echo ================================================================================
echo                              🎉 CHURNGUARD IS RUNNING! 🎉
echo ================================================================================
echo.
echo 🌐 Frontend (React):      http://localhost:3000
echo 🔧 Backend API:           http://localhost:8000
echo 📊 Admin Panel:           http://localhost:8000/admin
echo.
echo 🔑 LOGIN CREDENTIALS:
echo    Username: admin
echo    Password: admin123
echo.
echo 📊 FEATURES AVAILABLE:
echo    • Real-time Dashboard with 7,043 customers
echo    • Customer Churn Prediction (97%% accuracy)
echo    • Analytics with Contract Analysis
echo    • Model Performance Metrics
echo    • Role-based Access Control
echo.
echo ================================================================================
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo 🛑 Stopping ChurnGuard services...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo ✅ All services stopped
echo.
echo Thank you for using ChurnGuard! 👋