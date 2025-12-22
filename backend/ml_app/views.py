import uuid
import json
import boto3
import pandas as pd
from io import BytesIO
from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from auth_app.views import role_required
from .models import DatasetMeta, ModelVersion, PredictionsRisk
from .tasks import train_pipeline

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required(['admin'])
def upload_view(request):
    """Upload dataset to S3 and create metadata"""
    try:
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        if not file.name.endswith(('.csv', '.xlsx', '.xls')):
            return Response({'error': 'Invalid file type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Upload to S3
        s3_key = f"datasets/{uuid.uuid4().hex}_{file.name}"
        s3 = boto3.client('s3')
        s3.upload_fileobj(file, settings.AWS_S3_BUCKET, s3_key)
        
        # Read file to get metadata
        file.seek(0)
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Infer target column
        target_col = 'Churn'
        if 'Churn' in df.columns:
            # Map Yes/No to 1/0 for analysis
            churn_dist = df['Churn'].value_counts()
        else:
            target_col = df.columns[-1]  # Assume last column is target
            churn_dist = df[target_col].value_counts()
        
        # Create dataset metadata
        dataset = DatasetMeta.objects.create(
            user=request.user,
            filename=file.name,
            rows=len(df),
            target_col=target_col,
            s3_key=s3_key
        )
        
        # Trigger ETL pipeline
        job = train_pipeline.delay(dataset.id, ['RandomForest', 'XGBoost'])
        
        return Response({
            'dataset_id': dataset.id,
            'job_id': str(job.id),
            'rows': len(df),
            'columns': list(df.columns),
            'target_distribution': churn_dist.to_dict()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_datasets_view(request):
    """List user's datasets"""
    datasets = DatasetMeta.objects.filter(user=request.user).order_by('-upload_date')
    
    data = []
    for dataset in datasets:
        latest_model = ModelVersion.objects.filter(dataset=dataset).order_by('-created_at').first()
        data.append({
            'id': dataset.id,
            'filename': dataset.filename,
            'rows': dataset.rows,
            'upload_date': dataset.upload_date,
            'latest_model': {
                'type': latest_model.model_type if latest_model else None,
                'f1_score': latest_model.metrics_json.get('f1_score') if latest_model else None
            } if latest_model else None
        })
    
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@role_required(['admin'])
def train_view(request):
    """Start training job"""
    dataset_id = request.data.get('dataset_id')
    models = request.data.get('models', ['RandomForest'])
    
    if not dataset_id:
        return Response({'error': 'dataset_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        dataset = DatasetMeta.objects.get(id=dataset_id, user=request.user)
        job = train_pipeline.delay(dataset_id, models)
        
        return Response({
            'job_id': str(job.id),
            'status': 'started'
        })
    except DatasetMeta.DoesNotExist:
        return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compare_models_view(request, dataset_id):
    """Compare model performance"""
    try:
        dataset = DatasetMeta.objects.get(id=dataset_id, user=request.user)
        models = ModelVersion.objects.filter(dataset=dataset).order_by('-created_at')
        
        comparison = []
        for model in models:
            comparison.append({
                'version': model.version,
                'model_type': model.model_type,
                'f1_score': model.metrics_json.get('f1_score', 0),
                'auc': model.metrics_json.get('auc', 0),
                'precision': model.metrics_json.get('precision', 0),
                'recall': model.metrics_json.get('recall', 0),
                'created_at': model.created_at
            })
        
        return Response(comparison)
    except DatasetMeta.DoesNotExist:
        return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request, dataset_id):
    """Get analytics dashboard data"""
    cache_key = f"analytics_{dataset_id}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data)
    
    try:
        dataset = DatasetMeta.objects.get(id=dataset_id, user=request.user)
        latest_model = ModelVersion.objects.filter(dataset=dataset).order_by('-created_at').first()
        
        if not latest_model:
            return Response({'error': 'No trained models found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Load data for analysis
        s3 = boto3.client('s3')
        obj = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=dataset.s3_key)
        df = pd.read_csv(BytesIO(obj['Body'].read()))
        
        # Basic analytics
        churn_rate = df['Churn'].map({'Yes': 1, 'No': 0}).mean() if 'Churn' in df.columns else 0
        
        # Correlation analysis
        numeric_df = df.select_dtypes(include=['number'])
        correlation = numeric_df.corr().to_dict() if len(numeric_df.columns) > 1 else {}
        
        # Cohort analysis by tenure
        if 'tenure' in df.columns:
            df['tenure_bucket'] = pd.cut(df['tenure'], bins=5, labels=['0-1Y', '1-2Y', '2-3Y', '3-4Y', '4Y+'])
            cohort_analysis = df.groupby('tenure_bucket').agg({
                'Churn': lambda x: (x == 'Yes').mean() if 'Churn' in df.columns else 0,
                'customerID': 'count'
            }).to_dict()
        else:
            cohort_analysis = {}
        
        # High-risk customers (mock prediction)
        high_risk_customers = []
        if len(df) > 0:
            sample_customers = df.head(50).to_dict('records')
            for i, customer in enumerate(sample_customers):
                if i % 3 == 0:  # Mock high risk
                    high_risk_customers.append({
                        'customer_id': customer.get('customerID', f'C{i}'),
                        'risk_score': 0.85,
                        'monthly_charges': customer.get('MonthlyCharges', 0),
                        'tenure': customer.get('tenure', 0)
                    })
        
        # Insights
        insights = []
        if churn_rate > 0.2:
            insights.append("High churn rate detected. Consider retention campaigns.")
        if 'PaperlessBilling' in df.columns:
            paperless_churn = df[df['PaperlessBilling'] == 'Yes']['Churn'].map({'Yes': 1, 'No': 0}).mean()
            if paperless_churn > churn_rate * 1.2:
                insights.append("Paperless billing customers show higher churn. Review billing experience.")
        
        analytics_data = {
            'churn_rate': churn_rate,
            'total_customers': len(df),
            'correlation': correlation,
            'cohort_analysis': cohort_analysis,
            'model_performance': latest_model.metrics_json,
            'high_risk_customers': high_risk_customers,
            'insights': insights,
            'feature_importance': latest_model.metrics_json.get('feature_importance', {})
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, analytics_data, 300)
        
        return Response(analytics_data)
        
    except DatasetMeta.DoesNotExist:
        return Response({'error': 'Dataset not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_view(request):
    """Make single prediction"""
    try:
        customer_data = request.data.get('customer_data')
        dataset_id = request.data.get('dataset_id')
        
        if not customer_data or not dataset_id:
            return Response({'error': 'customer_data and dataset_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Get latest model
        dataset = DatasetMeta.objects.get(id=dataset_id, user=request.user)
        latest_model = ModelVersion.objects.filter(dataset=dataset).order_by('-created_at').first()
        
        if not latest_model:
            return Response({'error': 'No trained model found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Invoke Lambda for prediction
        lambda_client = boto3.client('lambda', region_name=settings.AWS_DEFAULT_REGION)
        
        payload = {
            'model_s3_key': latest_model.s3_pkl_key,
            'customer_data': customer_data
        }
        
        response = lambda_client.invoke(
            FunctionName='MLInference',
            Payload=json.dumps(payload)
        )
        
        result = json.loads(response['Payload'].read())
        
        # Determine risk level
        risk_score = result.get('probability', 0)
        if risk_score < 0.3:
            risk_level = 'low'
        elif risk_score < 0.7:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        # Generate insights
        insights = []
        if risk_level == 'high':
            insights.append("Offer 20% discount on next bill")
            insights.append("Assign dedicated customer success manager")
        elif risk_level == 'medium':
            insights.append("Send retention survey")
            insights.append("Offer service upgrade")
        
        # Save prediction
        PredictionsRisk.objects.create(
            user=request.user,
            dataset=dataset,
            risk_score=risk_score,
            insights={'recommendations': insights, 'risk_level': risk_level}
        )
        
        return Response({
            'risk_score': risk_score,
            'risk_level': risk_level,
            'probability': risk_score,
            'insights': insights,
            'shap_values': result.get('shap_values', {})
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)