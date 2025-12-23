import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import os
import uuid
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def dynamic_upload_and_train(request):
    """
    AI-powered dynamic upload that automatically:
    1. Analyzes uploaded data
    2. Cleans and preprocesses
    3. Trains multiple models
    4. Selects best model
    5. Saves for predictions
    """
    try:
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        job_id = str(uuid.uuid4())
        
        # Read file based on extension
        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Error reading file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # AI Data Analysis
        analysis_result = analyze_dataset(df)
        
        # AI Data Preprocessing
        processed_df, preprocessing_info = preprocess_dataset(df)
        
        # AI Model Training
        model_results = train_multiple_models(processed_df)
        
        # Save best model
        best_model_info = save_best_model(model_results, job_id)
        
        # Save dataset info
        dataset_info = {
            'dataset_id': job_id,
            'filename': file.name,
            'upload_time': datetime.now().isoformat(),
            'rows': len(df),
            'columns': list(df.columns),
            'analysis': analysis_result,
            'preprocessing': preprocessing_info,
            'model_performance': best_model_info,
            'job_id': job_id
        }
        
        # Save dataset metadata
        save_dataset_metadata(dataset_info)
        
        return Response({
            'success': True,
            'dataset_id': job_id,
            'rows': len(df),
            'columns': list(df.columns),
            'target_distribution': analysis_result.get('target_distribution', {}),
            'model_accuracy': best_model_info.get('accuracy', 0),
            'best_model': best_model_info.get('model_name', 'Unknown'),
            'job_id': job_id,
            'message': 'Dataset uploaded and AI training completed successfully!'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Upload and train error: {str(e)}")
        return Response({
            'error': f'Processing failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def analyze_dataset(df):
    """AI-powered dataset analysis"""
    analysis = {
        'shape': df.shape,
        'missing_values': df.isnull().sum().to_dict(),
        'data_types': df.dtypes.astype(str).to_dict(),
        'numeric_columns': df.select_dtypes(include=[np.number]).columns.tolist(),
        'categorical_columns': df.select_dtypes(include=['object']).columns.tolist(),
        'unique_values': {col: df[col].nunique() for col in df.columns},
    }
    
    # Detect target column (common names)
    target_candidates = ['churn', 'target', 'label', 'class', 'outcome']
    target_column = None
    
    for col in df.columns:
        if col.lower() in target_candidates:
            target_column = col
            break
    
    if target_column:
        analysis['target_column'] = target_column
        analysis['target_distribution'] = df[target_column].value_counts().to_dict()
        analysis['target_type'] = 'binary' if df[target_column].nunique() == 2 else 'multiclass'
    
    # Data quality assessment
    analysis['data_quality'] = {
        'completeness': (1 - df.isnull().sum().sum() / (df.shape[0] * df.shape[1])) * 100,
        'duplicates': df.duplicated().sum(),
        'outliers_detected': detect_outliers(df)
    }
    
    return analysis

def preprocess_dataset(df):
    """AI-powered data preprocessing"""
    preprocessing_info = {
        'steps_applied': [],
        'columns_dropped': [],
        'columns_encoded': [],
        'columns_scaled': []
    }
    
    # Make a copy
    processed_df = df.copy()
    
    # 1. Handle missing values
    if processed_df.isnull().sum().sum() > 0:
        # Numeric columns: fill with median
        numeric_cols = processed_df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if processed_df[col].isnull().sum() > 0:
                processed_df[col].fillna(processed_df[col].median(), inplace=True)
        
        # Categorical columns: fill with mode
        categorical_cols = processed_df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if processed_df[col].isnull().sum() > 0:
                processed_df[col].fillna(processed_df[col].mode()[0], inplace=True)
        
        preprocessing_info['steps_applied'].append('missing_values_handled')
    
    # 2. Remove duplicates
    if processed_df.duplicated().sum() > 0:
        processed_df.drop_duplicates(inplace=True)
        preprocessing_info['steps_applied'].append('duplicates_removed')
    
    # 3. Handle categorical variables
    categorical_cols = processed_df.select_dtypes(include=['object']).columns
    label_encoders = {}
    
    for col in categorical_cols:
        if col.lower() not in ['customerid', 'id']:  # Skip ID columns
            le = LabelEncoder()
            processed_df[col] = le.fit_transform(processed_df[col].astype(str))
            label_encoders[col] = le
            preprocessing_info['columns_encoded'].append(col)
    
    # 4. Feature engineering
    if 'tenure' in processed_df.columns and 'MonthlyCharges' in processed_df.columns:
        processed_df['tenure_monthly_ratio'] = processed_df['tenure'] / (processed_df['MonthlyCharges'] + 1)
        preprocessing_info['steps_applied'].append('feature_engineering')
    
    # 5. Remove ID columns
    id_columns = [col for col in processed_df.columns if 'id' in col.lower()]
    if id_columns:
        processed_df.drop(columns=id_columns, inplace=True)
        preprocessing_info['columns_dropped'].extend(id_columns)
    
    return processed_df, preprocessing_info

def train_multiple_models(df):
    """Train multiple ML models and compare performance"""
    # Detect target column
    target_candidates = ['churn', 'target', 'label', 'class', 'outcome']
    target_column = None
    
    for col in df.columns:
        if col.lower() in target_candidates:
            target_column = col
            break
    
    if not target_column:
        # Assume last column is target
        target_column = df.columns[-1]
    
    # Prepare features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Models to train
    models = {
        'XGBoost': XGBClassifier(random_state=42, eval_metric='logloss'),
        'RandomForest': RandomForestClassifier(random_state=42, n_estimators=100)
    }
    
    results = {}
    
    for name, model in models.items():
        try:
            # Train model
            if name == 'XGBoost':
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            else:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
            
            # Calculate metrics
            accuracy = (y_pred == y_test).mean()
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            results[name] = {
                'model': model,
                'scaler': scaler,
                'accuracy': accuracy,
                'auc_score': auc_score,
                'feature_names': list(X.columns),
                'target_column': target_column
            }
            
        except Exception as e:
            logger.error(f"Error training {name}: {str(e)}")
            continue
    
    return results

def save_best_model(model_results, job_id):
    """Save the best performing model"""
    if not model_results:
        return {'error': 'No models trained successfully'}
    
    # Find best model by AUC score
    best_model_name = max(model_results.keys(), key=lambda k: model_results[k]['auc_score'])
    best_model_info = model_results[best_model_name]
    
    # Create models directory
    models_dir = os.path.join(settings.BASE_DIR, 'saved_models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model and scaler
    model_path = os.path.join(models_dir, f'model_{job_id}.joblib')
    scaler_path = os.path.join(models_dir, f'scaler_{job_id}.joblib')
    
    joblib.dump(best_model_info['model'], model_path)
    joblib.dump(best_model_info['scaler'], scaler_path)
    
    return {
        'model_name': best_model_name,
        'accuracy': best_model_info['accuracy'],
        'auc_score': best_model_info['auc_score'],
        'model_path': model_path,
        'scaler_path': scaler_path,
        'feature_names': best_model_info['feature_names'],
        'target_column': best_model_info['target_column']
    }

def save_dataset_metadata(dataset_info):
    """Save dataset metadata for future reference"""
    metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
    os.makedirs(metadata_dir, exist_ok=True)
    
    metadata_path = os.path.join(metadata_dir, f'dataset_{dataset_info["dataset_id"]}.json')
    
    import json
    with open(metadata_path, 'w') as f:
        json.dump(dataset_info, f, indent=2, default=str)

def detect_outliers(df):
    """Detect outliers in numeric columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outliers_info = {}
    
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        outliers_info[col] = len(outliers)
    
    return outliers_info

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_dataset_info(request, dataset_id):
    """Get information about a specific dataset"""
    try:
        metadata_path = os.path.join(settings.BASE_DIR, 'dataset_metadata', f'dataset_{dataset_id}.json')
        
        if not os.path.exists(metadata_path):
            return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)
        
        import json
        with open(metadata_path, 'r') as f:
            dataset_info = json.load(f)
        
        return Response(dataset_info)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def list_datasets(request):
    """List all uploaded datasets"""
    try:
        metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
        
        if not os.path.exists(metadata_dir):
            return Response({'datasets': []})
        
        datasets = []
        import json
        
        for filename in os.listdir(metadata_dir):
            if filename.startswith('dataset_') and filename.endswith('.json'):
                with open(os.path.join(metadata_dir, filename), 'r') as f:
                    dataset_info = json.load(f)
                    datasets.append({
                        'dataset_id': dataset_info['dataset_id'],
                        'filename': dataset_info['filename'],
                        'upload_time': dataset_info['upload_time'],
                        'rows': dataset_info['rows'],
                        'columns': len(dataset_info['columns']),
                        'model_accuracy': dataset_info.get('model_performance', {}).get('accuracy', 0)
                    })
        
        # Sort by upload time (newest first)
        datasets.sort(key=lambda x: x['upload_time'], reverse=True)
        
        return Response({'datasets': datasets})
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)