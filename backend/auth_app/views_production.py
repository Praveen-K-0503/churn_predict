from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.core.exceptions import ValidationError
import logging
from .models import CustomUser
from .serializers import UserSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if not user:
            logger.warning(f"Failed login attempt for username: {username}")
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': 'Account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Successful login for user: {username}")
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            'error': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    try:
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'manager')
        
        # Validation
        if not all([username, email, password]):
            return Response({
                'error': 'Username, email, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({
                'error': 'Password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        if CustomUser.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if CustomUser.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        with transaction.atomic():
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user created: {username}")
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return Response({
            'error': 'Signup failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        logger.info(f"User logged out: {request.user.username}")
        return Response({'message': 'Logged out successfully'})
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_users(request):
    """Debug endpoint to check users - remove in production"""
    users = CustomUser.objects.all()
    return Response({
        'total_users': users.count(),
        'users': [
            {
                'username': u.username,
                'email': u.email,
                'is_active': u.is_active,
                'role': u.role
            } for u in users
        ]
    })