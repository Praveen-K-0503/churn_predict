import json
import boto3
import joblib
import pandas as pd
import numpy as np
from io import BytesIO
import shap

def handler(event, context):
    """Lambda function for ML inference"""
    try:
        # Get parameters
        model_s3_key = event['model_s3_key']
        customer_data = event['customer_data']
        
        # Load model from S3
        s3 = boto3.client('s3')
        bucket = 'churn-bucket'
        
        obj = s3.get_object(Bucket=bucket, Key=model_s3_key)
        model_data = joblib.load(BytesIO(obj['Body'].read()))
        
        model = model_data['model']
        scaler = model_data['scaler']
        
        # Prepare input data
        df = pd.DataFrame([customer_data])
        
        # Feature engineering (simplified)
        if 'tenure' in df.columns:
            df['tenure_group'] = pd.cut(df['tenure'], bins=5, labels=[0, 1, 2, 3, 4])
        
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
        
        # Handle missing columns (align with training data)
        # This is simplified - in production, you'd save the feature columns
        expected_features = 20  # Approximate number of features after preprocessing
        current_features = len(df.columns)
        
        if current_features < expected_features:
            for i in range(expected_features - current_features):
                df[f'missing_feature_{i}'] = 0
        
        # Scale features
        X = scaler.transform(df.select_dtypes(include=[np.number]))
        
        # Make prediction
        probability = model.predict_proba(X)[0][1]
        prediction = model.predict(X)[0]
        
        # SHAP explanation (simplified)
        try:
            explainer = shap.Explainer(model)
            shap_values = explainer(X)
            top_features = {
                f'feature_{i}': float(shap_values.values[0][i]) 
                for i in range(min(5, len(shap_values.values[0])))
            }
        except:
            top_features = {}
        
        return {
            'statusCode': 200,
            'body': {
                'prediction': int(prediction),
                'probability': float(probability),
                'shap_values': top_features
            }
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {
                'error': str(e)
            }
        }