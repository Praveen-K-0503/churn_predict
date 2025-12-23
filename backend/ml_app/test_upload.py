from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST"])
def test_upload(request):
    try:
        if 'file' in request.FILES:
            file = request.FILES['file']
            return JsonResponse({
                'success': True,
                'filename': file.name,
                'size': file.size,
                'message': 'File upload test successful!'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'No file uploaded'
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })