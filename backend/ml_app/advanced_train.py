from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import joblib
from datetime import datetime
from django.conf import settings
import time
import warnings
warnings.filterwarnings('ignore')

# Advanced ML imports
try:
    import optuna
    from lightgbm import LGBMClassifier
    from catboost import CatBoostClassifier
    import tensorflow as tf
    from tensorflow import keras
    ADVANCED_ML_AVAILABLE = True
except ImportError:
    ADVANCED_ML_AVAILABLE = False

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

@csrf_exempt
def advanced_train_models(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dataset_id = data.get('dataset_id')
            selected_models = data.get('models', ['random_forest', 'logistic'])
            use_hyperopt = data.get('hyperparameter_optimization', False)
            use_ensemble = data.get('ensemble_methods', False)
            use_neural_network = data.get('neural_network', False)
            
            # Load dataset
            metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
            metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
            
            if not os.path.exists(metadata_path):
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            file_path = metadata['file_path']
            try:
                if file_path.endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file_path.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(file_path)
                else:
                    return JsonResponse({'error': 'Unsupported file format'}, status=400)
            except:
                return JsonResponse({'error': 'Failed to read dataset'}, status=400)
            
            print(f"Advanced AutoML training on {len(df)} rows, {len(df.columns)} columns")
            
            # Results structure
            results = {
                'dataset_id': dataset_id,
                'training_steps': [],
                'models': [],
                'best_model': None,
                'hyperparameter_optimization': use_hyperopt,
                'ensemble_methods': use_ensemble,
                'neural_network': use_neural_network
            }
            
            # Data preprocessing
            original_rows = len(df)
            df = df.dropna(how='all').drop_duplicates()
            
            for col in df.columns:
                if df[col].dtype in ['int64', 'float64']:
                    df[col] = df[col].fillna(df[col].median())
                else:
                    mode_val = df[col].mode()[0] if len(df[col].mode()) > 0 else 'Unknown'
                    df[col] = df[col].fillna(mode_val)
            
            results['training_steps'].append({
                'step': 'data_cleaning',
                'status': 'completed',
                'details': f'Processed {original_rows} → {len(df)} rows'
            })
            
            # Feature engineering
            id_patterns = ['id', 'name', 'code', 'serial']
            columns_to_drop = []
            
            for col in df.columns:
                col_lower = col.lower().replace(' ', '').replace('_', '')
                if any(pattern in col_lower for pattern in id_patterns):
                    columns_to_drop.append(col)
                elif df[col].dtype == 'object' and df[col].nunique() > len(df) * 0.7:
                    columns_to_drop.append(col)
            
            df = df.drop(columns=columns_to_drop)
            
            # Create target variable
            target_column = None
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if 'Temperature' in df.columns:
                temp_median = df['Temperature'].median()
                df['High_Temperature'] = (df['Temperature'] > temp_median).astype(int)
                target_column = 'High_Temperature'
            elif len(numeric_cols) > 1:
                variances = {col: df[col].var() for col in numeric_cols}
                target_col = max(variances, key=variances.get)
                median_val = df[target_col].median()
                df[f'{target_col}_High'] = (df[target_col] > median_val).astype(int)
                target_column = f'{target_col}_High'
            else:
                return JsonResponse({'error': 'Cannot create target variable'}, status=400)
            
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            # Encode categorical features
            label_encoders = {}
            for col in X.select_dtypes(include=['object']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                label_encoders[col] = le
            
            results['training_steps'].append({
                'step': 'feature_engineering',
                'status': 'completed',
                'details': f'Processed {X.shape[1]} features'
            })
            
            # Train-test split
            test_size = 0.3 if len(df) < 50 else 0.2
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y
            )
            
            # Feature scaling
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            trained_models = []
            
            # Basic models
            basic_models = {
                'random_forest': RandomForestClassifier(random_state=42),
                'logistic': LogisticRegression(random_state=42, max_iter=1000)
            }
            
            if XGBOOST_AVAILABLE:
                basic_models['xgboost'] = XGBClassifier(random_state=42, eval_metric='logloss')
            
            if ADVANCED_ML_AVAILABLE:
                basic_models['lightgbm'] = LGBMClassifier(random_state=42, verbose=-1)
                basic_models['catboost'] = CatBoostClassifier(random_state=42, verbose=False)
            
            # Train basic models
            for model_name in selected_models:
                if model_name not in basic_models:
                    continue
                
                try:
                    start_time = time.time()
                    model = basic_models[model_name]
                    
                    if use_hyperopt and ADVANCED_ML_AVAILABLE:
                        # Hyperparameter optimization with Optuna
                        model = optimize_hyperparameters(model, model_name, X_train_scaled, y_train)
                    
                    model.fit(X_train_scaled, y_train)
                    y_pred = model.predict(X_test_scaled)
                    
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
                        'training_time': float(training_time),
                        'hyperopt_used': use_hyperopt
                    }
                    
                    trained_models.append(model_result)
                    
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
                'step': 'model_training',
                'status': 'completed',
                'details': f'Trained {len(trained_models)} models'
            })
            
            # Sort by accuracy
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
            
            return JsonResponse({
                'success': True,
                'results': results
            })
            
        except Exception as e:
            print(f"Advanced training error: {str(e)}")
            return JsonResponse({
                'error': f'Advanced training failed: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Advanced AutoML Training endpoint'
    })

def optimize_hyperparameters(model, model_name, X_train, y_train):
    """Optimize hyperparameters using Optuna"""
    def objective(trial):
        if model_name == 'random_forest':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 200),
                'max_depth': trial.suggest_int('max_depth', 3, 20),
                'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
                'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10)
            }
            model_trial = RandomForestClassifier(random_state=42, **params)
        elif model_name == 'xgboost' and XGBOOST_AVAILABLE:
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 200),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0)
            }
            model_trial = XGBClassifier(random_state=42, eval_metric='logloss', **params)
        elif model_name == 'lightgbm':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 200),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'num_leaves': trial.suggest_int('num_leaves', 10, 100)
            }
            model_trial = LGBMClassifier(random_state=42, verbose=-1, **params)
        else:
            return 0.0
        
        # Cross-validation score
        scores = cross_val_score(model_trial, X_train, y_train, cv=3, scoring='accuracy')
        return scores.mean()
    
    try:
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=20, timeout=60)  # 1 minute timeout
        
        best_params = study.best_params
        
        if model_name == 'random_forest':
            return RandomForestClassifier(random_state=42, **best_params)
        elif model_name == 'xgboost' and XGBOOST_AVAILABLE:
            return XGBClassifier(random_state=42, eval_metric='logloss', **best_params)
        elif model_name == 'lightgbm':
            return LGBMClassifier(random_state=42, verbose=-1, **best_params)
    except:
        pass
    
    return model