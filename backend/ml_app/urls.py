from django.urls import path
from .train_views import train_models, predict_single
from .simple_upload import simple_upload
from .simple_datasets import simple_datasets
from .analytics import get_analytics
from .ai_explanations import explain_training_results, generate_equipment_insights
from .data_cleaning import clean_dataset, perform_eda, get_cleaned_datasets, delete_dataset, get_dataset_details
from .chatbot_ai import chat_with_ai
from django.http import JsonResponse

def ml_home(request):
    return JsonResponse({
        'message': 'ChurnGuard AI Platform',
        'status': 'active',
        'endpoints': {
            'datasets': '/api/ml/datasets/',
            'upload': '/api/ml/upload/',
            'train': '/api/ml/train/',
            'predict': '/api/ml/predict/',
            'analytics': '/api/ml/analytics/1/',
            'ai_explain': '/api/ml/ai-explain/',
            'equipment_insights': '/api/ml/equipment-insights/'
        }
    })

urlpatterns = [
    path('', ml_home, name='ml_home'),
    path('datasets/', simple_datasets, name='simple_datasets'),
    path('upload/', simple_upload, name='simple_upload'),
    path('train/', train_models, name='train_models'),
    path('predict/', predict_single, name='predict_single'),
    path('analytics/<str:dataset_id>/', get_analytics, name='get_analytics'),
    path('ai-explain/', explain_training_results, name='ai_explain'),
    path('equipment-insights/', generate_equipment_insights, name='equipment_insights'),
    
    # Data Cleaning & EDA endpoints
    path('clean/', clean_dataset, name='clean_dataset'),
    path('eda/', perform_eda, name='perform_eda'),
    path('cleaned-datasets/', get_cleaned_datasets, name='get_cleaned_datasets'),
    path('datasets/<str:dataset_id>/', delete_dataset, name='delete_dataset'),
    path('dataset-details/<str:dataset_id>/', get_dataset_details, name='get_dataset_details'),
    
    # AI Chatbot endpoint
    path('chat/', chat_with_ai, name='chat_with_ai'),
]