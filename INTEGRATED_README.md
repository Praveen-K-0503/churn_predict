# ChurnGuard - Integrated Full Stack Application

## 🚀 Quick Start (Integrated Version)

The simple-frontend has been **integrated into the main React application** for a unified, professional experience.

### One-Click Launch
```bash
# Windows
start_full.bat

# This will start:
# 1. Django Backend (http://localhost:8000)
# 2. React Frontend (http://localhost:3000)
# 3. Auto-open browser
```

### Manual Launch
```bash
# Terminal 1: Backend
cd backend
python manage.py runserver

# Terminal 2: Frontend  
cd frontend
npm run dev

# Access: http://localhost:3000
```

## 🎯 What's Integrated

### ✅ **Unified Dashboard**
- Real telecom dataset (7,043 customers)
- Contract analysis charts
- Model performance metrics
- Dataset information cards

### ✅ **Enhanced Prediction**
- Professional React interface
- Real-time risk scoring
- SHAP feature importance
- Sample customer profiles

### ✅ **Complete Analytics**
- Interactive charts (Recharts)
- Contract type analysis
- Churn rate trends
- Risk segmentation

### ✅ **Professional UX**
- Framer Motion animations
- Tailwind CSS styling
- Role-based access
- Responsive design

## 🔧 Features Available

### **Dashboard** (`http://localhost:3000`)
- 📊 Real-time stats with 7,043 customers
- 📈 Contract analysis showing 42.7% churn for month-to-month
- 🎯 Model performance: XGBoost 97% F1 Score
- 📋 Dataset information with 21 features

### **Prediction** (`http://localhost:3000/predict`)
- 🎯 Individual customer risk scoring
- 📊 SHAP feature importance visualization
- 💡 Actionable recommendations
- 📝 Sample customer profiles to test

### **Analytics** (`http://localhost:3000/analytics`)
- 📈 Interactive charts and visualizations
- 🔍 Deep dive into churn patterns
- 📊 Contract type performance analysis

### **Admin Panel** (`http://localhost:8000/admin`)
- 🔐 Django admin interface
- 👥 User management
- 📊 Dataset management
- 🤖 Model version tracking

## 🔑 Login Credentials
- **Username:** admin
- **Password:** admin123

## 📊 Dataset Information
- **Size:** 7,043 real telecom customers
- **Features:** 21 columns
- **Churn Rate:** 26.5%
- **High Risk:** 1,056 customers

## 🤖 Model Performance
- **XGBoost:** 97.0% F1 Score (Best)
- **Logistic Regression:** 95.5% F1 Score
- **SVM:** 95.1% F1 Score
- **Random Forest:** 86.4% F1 Score

## 🏗️ Architecture
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Django 5 + DRF
- **Database:** SQLite (development)
- **ML:** Scikit-learn + XGBoost + SMOTE
- **Charts:** Recharts
- **Animations:** Framer Motion

The simple HTML frontend has been **fully integrated** into the professional React application, providing a seamless, enterprise-grade experience.