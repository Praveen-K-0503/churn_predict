@echo off
echo 🚀 ChurnGuard Production Deployment Starting...
echo Account: 906989717040
echo Dataset: 7,043 real telecom customers

REM Setup environment
copy .env.example .env
echo ✅ Environment configured

REM Install dependencies
echo 📦 Installing dependencies...
cd backend
pip install -r requirements.txt
cd ..\frontend
npm install
cd ..\infra
npm install
cd ..

REM Setup database
echo 🗄️ Setting up database...
cd backend
python manage.py migrate
python manage.py seed --create-admin --train-models
echo ✅ Database ready with real telecom data

REM Deploy to AWS
echo ☁️ Deploying to AWS...
cd ..\infra
cdk bootstrap
cdk deploy --require-approval never

echo 🎉 ChurnGuard Production Deployment Complete!
echo 📊 Dataset: 7,043 telecom customers loaded
echo 🤖 ML Models: Trained and ready
echo 🔐 Login: admin/admin123 or manager/manager123
pause