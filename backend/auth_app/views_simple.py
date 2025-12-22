from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
import json

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'username': user.username,
                        'role': user.role,
                        'email': user.email
                    }
                })
            else:
                return JsonResponse({'success': False, 'error': 'Invalid credentials'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'message': 'ChurnGuard Auth API - POST to login'})

@csrf_exempt
def signup_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            from .models import CustomUser
            
            user = CustomUser.objects.create_user(
                username=data.get('username'),
                email=data.get('email'),
                password=data.get('password'),
                role=data.get('role', 'manager')
            )
            
            return JsonResponse({
                'success': True,
                'user': {
                    'username': user.username,
                    'role': user.role,
                    'email': user.email
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'message': 'ChurnGuard Signup API - POST to register'})

def logout_view(request):
    return JsonResponse({'message': 'Logout endpoint'})