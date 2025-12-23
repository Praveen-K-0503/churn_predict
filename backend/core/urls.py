from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_view(request):
    return HttpResponse("""
    <h1>ChurnGuard AI Platform</h1>
    <p>Backend server running successfully!</p>
    <ul>
        <li><a href="/admin/">Admin Panel</a></li>
        <li><a href="/api/ml/datasets/">ML API - Datasets</a></li>
        <li><a href="/api/ml/upload/">ML API - Upload</a></li>
        <li><a href="/api/ml/train/">ML API - Train</a></li>
        <li><a href="/api/ml/predict/">ML API - Predict</a></li>
        <li><a href="/api/ml/models/">ML API - Models</a></li>
    </ul>
    <p>AI-powered churn prediction with CRUD operations</p>
    """)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/ml/', include('ml_app.urls')),
]