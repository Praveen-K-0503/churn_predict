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
    """Enhanced prediction endpoint with SHAP explanations"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            customer_data = data.get('customer_data', {})
            
            # Mock prediction with realistic logic
            risk_score = 0.3  # Base risk
            
            # Risk factors based on telecom domain knowledge
            if customer_data.get('Contract') == 'Month-to-month':
                risk_score += 0.4
            if customer_data.get('PaymentMethod') == 'Electronic check':
                risk_score += 0.2
            if int(customer_data.get('tenure', 12)) < 12:
                risk_score += 0.3
            if float(customer_data.get('MonthlyCharges', 50)) > 80:
                risk_score += 0.2
            if customer_data.get('PaperlessBilling') == 'Yes':
                risk_score += 0.1
            
            risk_score = min(risk_score, 0.95)
            
            # Risk level classification
            if risk_score > 0.7:
                risk_level = 'high'
                insights = [
                    'Offer 20% discount on next bill',
                    'Assign dedicated customer success manager',
                    'Upgrade to annual contract with incentive'
                ]
            elif risk_score > 0.4:
                risk_level = 'medium'
                insights = [
                    'Send satisfaction survey',
                    'Offer service upgrade',
                    'Enroll in loyalty program'
                ]
            else:
                risk_level = 'low'
                insights = [
                    'Continue current service level',
                    'Consider upselling additional features'
                ]
            
            # Mock SHAP explanations
            shap_values = {
                'Contract_Month-to-month': 0.23 if customer_data.get('Contract') == 'Month-to-month' else -0.15,
                'tenure': -0.18 if int(customer_data.get('tenure', 12)) > 24 else 0.12,
                'PaymentMethod_Electronic_check': 0.15 if customer_data.get('PaymentMethod') == 'Electronic check' else -0.08,
                'MonthlyCharges': 0.10 if float(customer_data.get('MonthlyCharges', 50)) > 70 else -0.05
            }
            
            # Top 3 SHAP features
            top_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
            explain = [
                {'feature': k.replace('_', ' '), 'value': v, 'impact': 'Increases risk' if v > 0 else 'Decreases risk'}
                for k, v in top_features
            ]
            
            return JsonResponse({
                'success': True,
                'risk_score': risk_score,
                'probability': risk_score,
                'risk_level': risk_level,
                'insights': insights,
                'shap_values': shap_values,
                'explain': explain,
                'customer_data': customer_data
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'message': 'ChurnGuard Prediction API - POST customer data'})

def analytics_view(request, dataset_id):
    """Enhanced analytics dashboard data with advanced visualizations"""
    try:
        from django.conf import settings
        import os
        from sklearn.metrics import roc_curve, auc
        from sklearn.model_selection import train_test_split
        from sklearn.ensemble import RandomForestClassifier
        import seaborn as sns
        
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
            
            # Cohort analysis
            df['tenure_bucket'] = pd.cut(df['tenure'], bins=5, labels=['0-14', '15-29', '30-44', '45-59', '60+'])
            cohort_df = df.groupby(['tenure_bucket', 'Contract'])['Churn'].agg(['mean', 'count']).reset_index()
            cohort_json = cohort_df.to_dict('records')
            
            # Correlation heatmap
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            corr_matrix = df[numeric_cols].corr()
            heatmap_json = {
                'x': corr_matrix.columns.tolist(),
                'y': corr_matrix.columns.tolist(),
                'z': corr_matrix.values.tolist()
            }
            
            # Mock ROC curve (would use real model in production)
            y = (df['Churn'] == 'Yes').astype(int)
            X = df[['tenure', 'MonthlyCharges']].fillna(0)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
            
            # Quick model for ROC
            model = RandomForestClassifier(n_estimators=10, random_state=42)
            model.fit(X_train, y_train)
            y_proba = model.predict_proba(X_test)[:, 1]
            
            fpr, tpr, _ = roc_curve(y_test, y_proba)
            roc_auc = auc(fpr, tpr)
            roc_json = {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist(),
                'auc': float(roc_auc)
            }
            
            # Feature importance
            feature_importance = dict(zip(X.columns, model.feature_importances_))
            importance_json = [
                {'feature': k.replace('_', ' '), 'importance': float(v * 100)}
                for k, v in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            ]
            
            # Mock SHAP summary
            shap_summary = {
                'base_value': 0.265,  # Overall churn rate
                'values': [0.15, -0.08, 0.12, -0.05],  # Mock SHAP values
                'feature_names': ['MonthlyCharges', 'tenure', 'Contract_Month-to-month', 'PaymentMethod'],
                'explanation': 'Higher monthly charges and month-to-month contracts increase churn risk'
            }
            
            return JsonResponse({
                'success': True,
                'dataset_id': dataset_id,
                'total_customers': total_customers,
                'churn_rate': churn_rate,
                'churned_customers': int(churn_counts.get('Yes', 0)),
                'retained_customers': int(churn_counts.get('No', 0)),
                'high_risk_customers': high_risk,
                'contract_analysis': contract_analysis,
                'cohort_analysis': cohort_json,
                'heatmap': heatmap_json,
                'roc_curve': roc_json,
                'feature_importance': importance_json,
                'shap_summary': shap_summary,
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