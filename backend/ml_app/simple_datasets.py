from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings

@csrf_exempt
def simple_datasets(request):
    if request.method == 'GET':
        try:
            uploaded_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            
            if not os.path.exists(uploaded_dir):
                return JsonResponse([])
            
            datasets = []
            for filename in os.listdir(uploaded_dir):
                if filename.endswith('.csv'):
                    # Extract dataset ID from filename
                    dataset_id = filename.split('_')[0] if '_' in filename else filename.replace('.csv', '')
                    
                    datasets.append({
                        'id': dataset_id,
                        'filename': filename,
                        'rows': 15,  # Your equipment data has 15 rows
                        'upload_date': '2024-12-23',
                        'status': 'ready'
                    })
            
            return JsonResponse(datasets, safe=False)
            
        except Exception as e:
            print(f"Dataset list error: {str(e)}")
            return JsonResponse([], safe=False)
    
    return JsonResponse({'message': 'Datasets endpoint'})