import boto3
import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_ratelimit.decorators import ratelimit
from functools import wraps
from .models import CustomUser
from .serializers import UserSerializer, SignupSerializer, LoginSerializer

def role_required(roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, 
                              status=status.HTTP_401_UNAUTHORIZED)
            if request.user.role not in roles:
                return Response({'error': 'Insufficient permissions'}, 
                              status=status.HTTP_403_FORBIDDEN)
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', method='POST')
def signup_view(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        # Verify reCAPTCHA
        recaptcha_token = request.data.get('recaptcha_token')
        if recaptcha_token:
            recaptcha_response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': settings.RECAPTCHA_SECRET_KEY,
                    'response': recaptcha_token
                }
            )
            if not recaptcha_response.json().get('success'):
                return Response({'error': 'reCAPTCHA verification failed'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        
        # Create Cognito user
        try:
            cognito = boto3.client('cognito-idp', region_name=settings.AWS_DEFAULT_REGION)
            cognito_response = cognito.admin_create_user(
                UserPoolId=settings.COGNITO_POOL_ID,
                Username=user.username,
                UserAttributes=[
                    {'Name': 'email', 'Value': user.email},
                ],
                TemporaryPassword='TempPass123!',
                MessageAction='SUPPRESS'
            )
            user.cognito_id = cognito_response['User']['Username']
            user.save()
        except Exception as e:
            print(f"Cognito error: {e}")
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', method='POST')
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Cognito global sign out
        if request.user.cognito_id:
            try:
                cognito = boto3.client('cognito-idp', region_name=settings.AWS_DEFAULT_REGION)
                cognito.admin_user_global_sign_out(
                    UserPoolId=settings.COGNITO_POOL_ID,
                    Username=request.user.cognito_id
                )
            except Exception as e:
                print(f"Cognito logout error: {e}")
        
        return Response({'message': 'Logged out successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)