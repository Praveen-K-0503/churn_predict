import pandas as pd
import numpy as np
import boto3
import joblib
from io import BytesIO
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import shap
from django.conf import settings

def load_data(s3_key):
    """Load data from S3"""
    s3 = boto3.client('s3')
    obj = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
    
    if s3_key.endswith('.csv'):
        return pd.read_csv(BytesIO(obj['Body'].read()))
    elif s3_key.endswith(('.xlsx', '.xls')):
        return pd.read_excel(BytesIO(obj['Body'].read()))
    else:
        raise ValueError("Unsupported file format")

def clean_data(df):
    """Clean and preprocess data"""
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Handle missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
    
    categorical_cols = df.select_dtypes(include=['object']).columns
    df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode().iloc[0])
    
    # Remove outliers using IQR for MonthlyCharges
    if 'MonthlyCharges' in df.columns:
        Q1 = df['MonthlyCharges'].quantile(0.25)
        Q3 = df['MonthlyCharges'].quantile(0.75)
        IQR = Q3 - Q1
        df = df[~((df['MonthlyCharges'] < (Q1 - 1.5 * IQR)) | 
                  (df['MonthlyCharges'] > (Q3 + 1.5 * IQR)))]
    
    return df

def engineer_features(df):
    """Feature engineering"""
    df = df.copy()
    
    # Tenure bins
    if 'tenure' in df.columns:
        df['tenure_group'] = pd.cut(df['tenure'], bins=5, labels=['Very Low', 'Low', 'Medium', 'High', 'Very High'])
    
    # RFM-like features
    if 'tenure' in df.columns and 'MonthlyCharges' in df.columns and 'TotalCharges' in df.columns:
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)
        df['avg_monthly_charges'] = df['TotalCharges'] / (df['tenure'] + 1)
        df['charges_per_service'] = df['MonthlyCharges'] / (df.select_dtypes(include=['object']).eq('Yes').sum(axis=1) + 1)
    
    # One-hot encoding for categorical variables
    categorical_cols = ['Contract', 'InternetService', 'PaymentMethod']
    for col in categorical_cols:
        if col in df.columns:
            dummies = pd.get_dummies(df[col], prefix=col)
            df = pd.concat([df, dummies], axis=1)
            df.drop(col, axis=1, inplace=True)
    
    # Binary encoding
    binary_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling']
    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].map({'Yes': 1, 'No': 0, 'Male': 1, 'Female': 0})
    
    return df

def balance_split(df, target_col='Churn'):
    """Balance dataset and split"""
    # Encode target
    if target_col in df.columns:
        df[target_col] = df[target_col].map({'Yes': 1, 'No': 0})
    
    # Separate features and target
    X = df.drop([target_col, 'customerID'], axis=1, errors='ignore')
    y = df[target_col]
    
    # Handle categorical columns
    X = pd.get_dummies(X)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # Apply SMOTE
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_balanced)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train_balanced, y_test, scaler, X.columns

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models"""
    models = {
        'LogisticRegression': LogisticRegression(random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
        'XGBoost': XGBClassifier(random_state=42),
        'SVM': SVC(probability=True, random_state=42)
    }
    
    results = {}
    trained_models = {}
    
    for name, model in models.items():
        # Train model
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        # Metrics
        report = classification_report(y_test, y_pred, output_dict=True)
        auc = roc_auc_score(y_test, y_prob)
        
        results[name] = {
            'f1_score': report['weighted avg']['f1-score'],
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'auc': auc
        }
        
        trained_models[name] = model
    
    # Ensemble model
    ensemble = VotingClassifier([
        ('lr', models['LogisticRegression']),
        ('rf', models['RandomForest']),
        ('xgb', models['XGBoost'])
    ], voting='soft')
    
    ensemble.fit(X_train, y_train)
    y_pred_ensemble = ensemble.predict(X_test)
    y_prob_ensemble = ensemble.predict_proba(X_test)[:, 1]
    
    report_ensemble = classification_report(y_test, y_pred_ensemble, output_dict=True)
    auc_ensemble = roc_auc_score(y_test, y_prob_ensemble)
    
    results['Ensemble'] = {
        'f1_score': report_ensemble['weighted avg']['f1-score'],
        'precision': report_ensemble['weighted avg']['precision'],
        'recall': report_ensemble['weighted avg']['recall'],
        'auc': auc_ensemble
    }
    
    trained_models['Ensemble'] = ensemble
    
    # Find best model
    best_model_name = max(results.keys(), key=lambda k: results[k]['f1_score'])
    best_model = trained_models[best_model_name]
    
    return results, best_model, best_model_name

def get_shap_explanation(model, X_sample, feature_names):
    """Generate SHAP explanations"""
    try:
        explainer = shap.Explainer(model)
        shap_values = explainer(X_sample[:100])  # Limit for performance
        
        # Get feature importance
        importance = np.abs(shap_values.values).mean(0)
        feature_importance = dict(zip(feature_names, importance))
        
        return {
            'feature_importance': dict(sorted(feature_importance.items(), 
                                            key=lambda x: x[1], reverse=True)[:10])
        }
    except Exception as e:
        print(f"SHAP error: {e}")
        return {'feature_importance': {}}

def save_model_to_s3(model, scaler, s3_key):
    """Save model and scaler to S3"""
    s3 = boto3.client('s3')
    
    # Save model
    model_buffer = BytesIO()
    joblib.dump({'model': model, 'scaler': scaler}, model_buffer)
    model_buffer.seek(0)
    
    s3.upload_fileobj(model_buffer, settings.AWS_S3_BUCKET, s3_key)
    
    return s3_key