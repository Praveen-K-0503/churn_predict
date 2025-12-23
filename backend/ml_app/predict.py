from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
import joblib
from django.conf import settings

@csrf_exempt
def predict_view(request):
    """Make predictions using trained models"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            model_id = data.get('model_id')
            input_data = data.get('input_data', {})
            
            if not model_id:
                return JsonResponse({'error': 'Model ID required'}, status=400)
            
            if not input_data:
                return JsonResponse({'error': 'Input data required'}, status=400)
            
            # Load trained model
            models_dir = os.path.join(settings.BASE_DIR, 'trained_models')
            model_path = os.path.join(models_dir, f'{model_id}.joblib')
            
            if not os.path.exists(model_path):
                return JsonResponse({'error': 'Model not found'}, status=404)
            
            # Load model and preprocessing components
            model_data = joblib.load(model_path)
            model = model_data['model']
            scaler = model_data['scaler']
            label_encoders = model_data.get('label_encoders', {})
            feature_names = model_data.get('feature_names', [])
            
            # Prepare input data
            input_df = pd.DataFrame([input_data])
            
            # Ensure all required features are present
            for feature in feature_names:
                if feature not in input_df.columns:
                    input_df[feature] = 0  # Default value
            
            # Select only the features used in training
            input_df = input_df[feature_names]
            
            # Apply label encoding for categorical features
            for col, encoder in label_encoders.items():
                if col in input_df.columns:
                    try:
                        input_df[col] = encoder.transform(input_df[col].astype(str))
                    except:
                        # Handle unseen categories
                        input_df[col] = 0
            
            # Scale features
            input_scaled = scaler.transform(input_df)
            
            # Make prediction
            prediction = model.predict(input_scaled)[0]
            
            # Get prediction probability if available
            prediction_proba = None
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(input_scaled)[0]
                prediction_proba = {
                    'class_0': float(proba[0]),
                    'class_1': float(proba[1]) if len(proba) > 1 else 0.0
                }
            
            # Determine risk level and recommendation
            risk_score = prediction_proba['class_1'] if prediction_proba else float(prediction)
            
            if risk_score > 0.7:
                risk_level = 'High'
                recommendation = 'Immediate attention required - high risk detected'
            elif risk_score > 0.4:
                risk_level = 'Medium' 
                recommendation = 'Monitor closely - moderate risk detected'
            else:
                risk_level = 'Low'
                recommendation = 'Normal operation - low risk detected'
            
            return JsonResponse({
                'success': True,
                'prediction': int(prediction),
                'risk_score': risk_score,
                'risk_level': risk_level,
                'recommendation': recommendation,
                'prediction_proba': prediction_proba,
                'model_used': model_id
            })
            
        except Exception as e:
            return JsonResponse({
                'error': f'Prediction failed: {str(e)}'
            }, status=500)
    
    elif request.method == 'GET':
        # Get available models for prediction
        try:
            models_dir = os.path.join(settings.BASE_DIR, 'trained_models')
            metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
            
            models = []
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith('.joblib'):
                        try:
                            parts = filename.replace('.joblib', '').split('_')
                            if len(parts) >= 2:
                                dataset_id = parts[0]
                                model_name = '_'.join(parts[1:])
                                
                                # Get dataset info
                                metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
                                dataset_name = 'Unknown Dataset'
                                
                                if os.path.exists(metadata_path):
                                    with open(metadata_path, 'r') as f:
                                        metadata = json.load(f)
                                        dataset_name = metadata.get('filename', 'Unknown Dataset')
                                
                                # Load model to get feature names
                                model_path = os.path.join(models_dir, filename)
                                model_data = joblib.load(model_path)
                                feature_names = model_data.get('feature_names', [])
                                
                                models.append({
                                    'id': filename.replace('.joblib', ''),
                                    'name': f'{model_name.title()} ({dataset_name})',
                                    'model_type': model_name,
                                    'dataset_name': dataset_name,
                                    'feature_names': feature_names
                                })
                        except Exception as e:
                            continue
            
            return JsonResponse({
                'models': models,
                'total': len(models)
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e), 'models': [], 'total': 0})
    
    return JsonResponse({'message': 'Prediction endpoint - POST for predictions, GET for available models'})