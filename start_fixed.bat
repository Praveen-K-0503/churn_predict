@echo off
echo Starting ChurnGuard Platform...

echo Installing backend dependencies...
cd backend
pip install -r requirements_complete.txt

echo Running Django migrations...
python manage.py makemigrations
python manage.py migrate

echo Creating superuser (if needed)...
echo from django.contrib.auth.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') | python manage.py shell

echo Starting Django server...
start "Django Server" python manage.py runserver

echo Installing frontend dependencies...
cd ..\frontend
npm install --legacy-peer-deps

echo Starting React development server...
start "React Server" npm run dev

echo.
echo ========================================
echo ChurnGuard Platform Started Successfully!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin
echo Login: admin / admin123
echo ========================================

pause