from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import joblib
from django.conf import settings
from datetime import datetime

@csrf_exempt
def model_crud(request):
    """CRUD operations for trained models"""
    models_dir = os.path.join(settings.BASE_DIR, 'trained_models')
    metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
    
    if request.method == 'GET':
        # READ - List all trained models
        try:
            models = []
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith('.joblib'):
                        try:
                            # Extract dataset_id and model_name from filename
                            parts = filename.replace('.joblib', '').split('_')
                            if len(parts) >= 2:
                                dataset_id = parts[0]
                                model_name = '_'.join(parts[1:])
                                
                                # Load model metadata
                                metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
                                dataset_name = 'Unknown Dataset'
                                accuracy = 0.0
                                
                                if os.path.exists(metadata_path):
                                    with open(metadata_path, 'r') as f:
                                        metadata = json.load(f)
                                        dataset_name = metadata.get('filename', 'Unknown Dataset')
                                        
                                        # Get model accuracy from training results
                                        training_results = metadata.get('training_results', {})
                                        model_results = training_results.get('models', [])
                                        for model_result in model_results:
                                            if model_result.get('name') == model_name:
                                                accuracy = model_result.get('accuracy', 0.0)
                                                break
                                
                                models.append({
                                    'id': filename.replace('.joblib', ''),
                                    'name': f'{model_name.title()} ({dataset_name})',
                                    'model_type': model_name,
                                    'dataset_id': dataset_id,
                                    'dataset_name': dataset_name,
                                    'accuracy': accuracy,
                                    'file_path': os.path.join(models_dir, filename),
                                    'created_at': datetime.fromtimestamp(
                                        os.path.getctime(os.path.join(models_dir, filename))
                                    ).isoformat()
                                })
                        except Exception as e:
                            continue
            
            return JsonResponse({
                'models': sorted(models, key=lambda x: x.get('created_at', ''), reverse=True),
                'total': len(models)
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e), 'models': [], 'total': 0})
    
    elif request.method == 'DELETE':
        # DELETE - Remove trained model
        try:
            data = json.loads(request.body)
            model_id = data.get('model_id')
            
            if not model_id:
                return JsonResponse({'error': 'Model ID required'}, status=400)
            
            model_path = os.path.join(models_dir, f'{model_id}.joblib')
            if os.path.exists(model_path):
                os.remove(model_path)
                return JsonResponse({'success': True, 'message': 'Model deleted successfully'})
            else:
                return JsonResponse({'error': 'Model not found'}, status=404)
                
        except Exception as e:
            return JsonResponse({'error': f'Delete failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Model CRUD endpoint'})

@csrf_exempt
def download_model(request, model_id):
    """Download trained model file"""
    try:
        models_dir = os.path.join(settings.BASE_DIR, 'trained_models')
        model_path = os.path.join(models_dir, f'{model_id}.joblib')
        
        if not os.path.exists(model_path):
            return JsonResponse({'error': 'Model not found'}, status=404)
        
        with open(model_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{model_id}.joblib"'
            return response
            
    except Exception as e:
        return JsonResponse({'error': f'Download failed: {str(e)}'}, status=500)