"""
Production settings for ChurnGuard with real telecom dataset
"""
from .settings import *
import os

# Production Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'churn_predict',
        'USER': 'postgres', 
        'PASSWORD': 'postgres',
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'prefer',
        },
    }
}

# Production Security
DEBUG = False
ALLOWED_HOSTS = ['*']  # Will be restricted in production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# AWS Production Settings
AWS_S3_BUCKET = 'churnguard-906989717040-prod'
AWS_DEFAULT_REGION = 'us-east-1'

# Real Dataset Configuration
TELECOM_DATASET_PATH = 'data/telecom_churn.csv'
EXPECTED_DATASET_SIZE = 7043
REQUIRED_COLUMNS = [
    'customerID', 'gender', 'SeniorCitizen', 'Partner', 'Dependents',
    'tenure', 'PhoneService', 'MultipleLines', 'InternetService',
    'OnlineSecurity', 'OnlineBackup', 'DeviceProtection', 'TechSupport',
    'StreamingTV', 'StreamingMovies', 'Contract', 'PaperlessBilling',
    'PaymentMethod', 'MonthlyCharges', 'TotalCharges', 'Churn'
]

# ML Model Performance Thresholds
MIN_F1_SCORE = 0.80
MIN_AUC_SCORE = 0.85
MAX_TRAINING_TIME_MINUTES = 5

# Production Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'ml_app': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}