from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import joblib
from datetime import datetime
from django.conf import settings
import time
import warnings
warnings.filterwarnings('ignore')

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

@csrf_exempt
def train_models(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dataset_id = data.get('dataset_id')
            selected_models = data.get('models', ['random_forest', 'logistic'])
            
            # Load dataset metadata
            metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
            metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
            
            if not os.path.exists(metadata_path):
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Load COMPLETE dataset - NO row limits
            file_path = metadata['file_path']
            try:
                if file_path.endswith('.csv'):
                    df = pd.read_csv(file_path)  # Load ALL rows
                elif file_path.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(file_path)  # Load ALL rows
                else:
                    return JsonResponse({'error': 'Unsupported file format'}, status=400)
            except:
                return JsonResponse({'error': 'Failed to read dataset'}, status=400)
            
            print(f"Training on FULL dataset: {len(df)} rows, {len(df.columns)} columns")
            
            # Results structure
            results = {
                'dataset_id': dataset_id,
                'training_steps': [],
                'models': [],
                'best_model': None
            }
            
            # Step 1: Data Cleaning - Process ALL rows
            original_rows = len(df)
            df = df.dropna(how='all').drop_duplicates()
            
            # Fill missing values for ALL data
            for col in df.columns:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
                else:
                    mode_val = df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown'
                    df[col] = df[col].fillna(mode_val)
            
            results['training_steps'].append({
                'step': 'cleaning',
                'status': 'completed',
                'details': f'Processed ALL {original_rows} → {len(df)} rows'
            })
            
            # Step 2: Feature Engineering - Use ALL data
            id_patterns = ['id', 'name', 'code', 'serial']
            columns_to_drop = []
            
            for col in df.columns:
                col_lower = col.lower().replace(' ', '').replace('_', '')
                if any(pattern in col_lower for pattern in id_patterns):
                    columns_to_drop.append(col)
                elif df[col].dtype == 'object' and df[col].nunique() > len(df) * 0.7:
                    columns_to_drop.append(col)
            
            df = df.drop(columns=columns_to_drop)
            
            # Create target column from ALL data
            target_column = None
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if 'Temperature' in df.columns:
                temp_median = df['Temperature'].median()  # Use ALL data for median
                df['High_Temperature'] = (df['Temperature'] > temp_median).astype(int)
                target_column = 'High_Temperature'
            elif len(numeric_cols) > 1:
                # Use column with highest variance as target - calculated from ALL data
                variances = {col: df[col].var() for col in numeric_cols}
                target_col = max(variances, key=variances.get)
                median_val = df[target_col].median()  # Use ALL data for median
                df[f'{target_col}_High'] = (df[target_col] > median_val).astype(int)
                target_column = f'{target_col}_High'
            else:
                return JsonResponse({'error': 'Cannot create target variable'}, status=400)
            
            # Prepare features from ALL data
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            print(f"Feature matrix: {X.shape}, Target: {y.shape}")
            
            # Encode categorical features - ALL data
            label_encoders = {}
            for col in X.select_dtypes(include=['object']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                label_encoders[col] = le
            
            results['training_steps'].append({
                'step': 'preprocessing',
                'status': 'completed',
                'details': f'Processed {X.shape[1]} features from {len(df)} rows'
            })
            
            # Step 3: Train-Test Split - Use ALL data
            if len(df) < 10:
                return JsonResponse({'error': 'Dataset too small'}, status=400)
            
            test_size = 0.3 if len(df) < 50 else 0.2
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
            
            print(f"Training set: {X_train.shape}, Test set: {X_test.shape}")
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Step 4: Model Training on ALL data
            model_configs = {
                'random_forest': RandomForestClassifier(random_state=42, n_estimators=100),
                'logistic': LogisticRegression(random_state=42, max_iter=1000),
                'xgboost': XGBClassifier(random_state=42, n_estimators=100) if XGBOOST_AVAILABLE else None
            }
            
            trained_models = []
            
            for model_name in selected_models:
                if model_name not in model_configs or model_configs[model_name] is None:
                    continue
                
                try:
                    start_time = time.time()
                    model = model_configs[model_name]
                    
                    print(f"Training {model_name} on {len(X_train)} samples...")
                    
                    # Train model on ALL training data
                    model.fit(X_train_scaled, y_train)
                    
                    # Predictions on ALL test data
                    y_pred = model.predict(X_test_scaled)
                    
                    # Metrics
                    accuracy = accuracy_score(y_test, y_pred)
                    f1 = f1_score(y_test, y_pred, average='weighted')
                    
                    try:
                        if hasattr(model, 'predict_proba'):
                            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
                            auc = roc_auc_score(y_test, y_pred_proba)
                        else:
                            auc = accuracy
                    except:
                        auc = accuracy
                    
                    training_time = time.time() - start_time
                    
                    model_result = {
                        'name': model_name,
                        'accuracy': float(accuracy),
                        'f1_score': float(f1),
                        'auc_score': float(auc),
                        'training_time': float(training_time)
                    }
                    
                    trained_models.append(model_result)
                    print(f"{model_name} trained: {accuracy:.3f} accuracy")
                    
                    # Save model
                    models_dir = os.path.join(settings.BASE_DIR, 'trained_models')
                    os.makedirs(models_dir, exist_ok=True)
                    model_path = os.path.join(models_dir, f'{dataset_id}_{model_name}.joblib')
                    
                    joblib.dump({
                        'model': model,
                        'scaler': scaler,
                        'label_encoders': label_encoders,
                        'feature_names': list(X.columns),
                        'target_column': target_column
                    }, model_path)
                    
                except Exception as e:
                    print(f"Error training {model_name}: {str(e)}")
                    continue
            
            if not trained_models:
                return JsonResponse({'error': 'All models failed to train'}, status=400)
            
            results['training_steps'].append({
                'step': 'training',
                'status': 'completed',
                'details': f'Trained {len(trained_models)} models on {len(df)} rows'
            })
            
            # Step 5: Results
            trained_models.sort(key=lambda x: x['accuracy'], reverse=True)
            results['models'] = trained_models
            results['best_model'] = trained_models[0]['name']
            
            results['training_steps'].append({
                'step': 'evaluation',
                'status': 'completed',
                'details': f'Best: {results["best_model"]} ({trained_models[0]["accuracy"]:.3f})'
            })
            
            # Update metadata
            metadata['training_status'] = 'completed'
            metadata['training_results'] = results
            metadata['trained_at'] = datetime.now().isoformat()
            
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            print(f"Training completed successfully on {len(df)} rows")
            
            return JsonResponse({
                'success': True,
                'results': results
            })
            
        except Exception as e:
            print(f"Training error: {str(e)}")
            return JsonResponse({
                'error': f'Training failed: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'AI Training endpoint'
    })