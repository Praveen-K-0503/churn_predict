from django.urls import path
from .views_simple import datasets_view, upload_view, predict_view, analytics_view
from django.http import JsonResponse

def ml_home(request):
    return JsonResponse({
        'message': 'ChurnGuard ML API',
        'endpoints': {
            'datasets': '/api/ml/datasets/',
            'upload': '/api/ml/upload/',
            'predict': '/api/ml/predict/',
            'analytics': '/api/ml/analytics/1/'
        },
        'dataset_info': {
            'total_customers': 7043,
            'filename': 'telecom_churn.csv'
        }
    })

urlpatterns = [
    path('', ml_home, name='ml_home'),
    path('datasets/', datasets_view, name='datasets'),
    path('upload/', upload_view, name='upload'),
    path('predict/', predict_view, name='predict'),
    path('analytics/<int:dataset_id>/', analytics_view, name='analytics'),
]