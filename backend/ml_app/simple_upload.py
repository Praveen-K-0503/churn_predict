from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
import uuid
from django.conf import settings

@csrf_exempt
def simple_upload(request):
    if request.method == 'POST':
        try:
            file = request.FILES.get('file')
            if not file:
                return JsonResponse({'error': 'No file provided'}, status=400)
            
            if not file.name.endswith('.csv'):
                return JsonResponse({'error': 'Only CSV files supported'}, status=400)
            
            # Create upload directory
            upload_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            dataset_id = str(uuid.uuid4())[:8]
            filename = f"{dataset_id}_{file.name}"
            file_path = os.path.join(upload_dir, filename)
            
            # Save file
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            return JsonResponse({
                'success': True,
                'dataset_id': dataset_id,
                'filename': filename,
                'rows': 15,  # Mock row count
                'columns': ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature'],
                'message': 'File uploaded successfully'
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'message': 'Upload endpoint'})