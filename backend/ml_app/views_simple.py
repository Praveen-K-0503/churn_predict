from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import os
from django.conf import settings
import json
import numpy as np

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def datasets_view(request):
    """List available datasets"""
    try:
        # Check if telecom dataset exists
        dataset_path = os.path.join(settings.BASE_DIR.parent, 'data', 'telecom_churn.csv')
        
        if os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
            churn_counts = df['Churn'].value_counts()
            
            return JsonResponse({
                'success': True,
                'datasets': [{
                    'id': 1,
                    'filename': 'telecom_churn.csv',
                    'rows': int(len(df)),
                    'columns': int(len(df.columns)),
                    'churn_rate': float(round((churn_counts.get('Yes', 0) / len(df)) * 100, 1)),
                    'churned_customers': int(churn_counts.get('Yes', 0)),
                    'retained_customers': int(churn_counts.get('No', 0)),
                    'features': list(df.columns)
                }]
            })
        else:
            return JsonResponse({
                'success': False,
                'datasets': [], 
                'message': f'Dataset not found at: {dataset_path}'
            })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def upload_view(request):
    """Upload dataset endpoint"""
    if request.method == 'POST':
        return JsonResponse({'message': 'Upload functionality - under development'})
    return JsonResponse({'message': 'ChurnGuard Upload API - POST files here'})

@csrf_exempt
def predict_view(request):
    """Prediction endpoint"""
    if request.method == 'POST':
        return JsonResponse({
            'prediction': 'high_risk',
            'probability': 0.85,
            'message': 'ML prediction - under development'
        })
    return JsonResponse({'message': 'ChurnGuard Prediction API - POST customer data'})

def analytics_view(request, dataset_id):
    """Analytics dashboard data"""
    try:
        from django.conf import settings
        import os
        
        # Load real dataset for analytics
        dataset_path = os.path.join(settings.BASE_DIR.parent, 'data', 'telecom_churn.csv')
        
        if os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
            churn_counts = df['Churn'].value_counts()
            
            # Calculate real analytics
            total_customers = int(len(df))
            churn_rate = float(round((churn_counts.get('Yes', 0) / total_customers) * 100, 1))
            high_risk = int(total_customers * 0.15)  # Assume 15% high risk
            
            # Contract analysis
            contract_analysis = {}
            for contract, group in df.groupby('Contract')['Churn']:
                churn_pct = float(round((group == 'Yes').mean() * 100, 1))
                contract_analysis[contract] = churn_pct
            
            return JsonResponse({
                'success': True,
                'dataset_id': dataset_id,
                'total_customers': total_customers,
                'churn_rate': churn_rate,
                'churned_customers': int(churn_counts.get('Yes', 0)),
                'retained_customers': int(churn_counts.get('No', 0)),
                'high_risk_customers': high_risk,
                'contract_analysis': contract_analysis,
                'dataset_info': {
                    'filename': 'telecom_churn.csv',
                    'features': int(len(df.columns)),
                    'numeric_features': int(len(df.select_dtypes(include=['number']).columns))
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Dataset not found'
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })