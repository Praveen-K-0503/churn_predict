from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_view(request):
    return HttpResponse("""
    <h1>ChurnGuard API Server</h1>
    <p>Backend is running successfully!</p>
    <ul>
        <li><a href="/admin/">Admin Panel</a></li>
        <li><a href="/api/auth/login/">Auth API - Login</a></li>
        <li><a href="/api/auth/signup/">Auth API - Signup</a></li>
        <li><a href="/api/ml/datasets/">ML API - Datasets</a></li>
        <li><a href="/api/ml/analytics/1/">ML API - Analytics</a></li>
        <li><a href="/api/ml/predict/">ML API - Predict</a></li>
    </ul>
    <p>Dataset: 7,043 telecom customers loaded</p>
    <p>Login: admin / admin123</p>
    """)

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('api/ml/', include('ml_app.urls')),
]