from django.urls import path
from .views_production import login_view, signup_view, logout_view, user_profile, debug_users
from django.http import JsonResponse

def auth_home(request):
    return JsonResponse({
        'message': 'ChurnGuard Auth API v2.0',
        'status': 'active',
        'endpoints': {
            'login': '/api/auth/login/',
            'signup': '/api/auth/signup/',
            'logout': '/api/auth/logout/',
            'profile': '/api/auth/profile/',
            'debug': '/api/auth/debug/'
        }
    })

urlpatterns = [
    path('', auth_home, name='auth_home'),
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', logout_view, name='logout'),
    path('profile/', user_profile, name='profile'),
    path('debug/', debug_users, name='debug'),
]