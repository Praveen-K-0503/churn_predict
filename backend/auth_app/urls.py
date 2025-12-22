from django.urls import path
from .views_simple import login_view, signup_view, logout_view
from django.http import JsonResponse

def auth_home(request):
    return JsonResponse({
        'message': 'ChurnGuard Auth API',
        'endpoints': {
            'login': '/api/auth/login/',
            'signup': '/api/auth/signup/',
            'logout': '/api/auth/logout/'
        }
    })

urlpatterns = [
    path('', auth_home, name='auth_home'),
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', logout_view, name='logout'),
]