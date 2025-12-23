from django.http import JsonResponse
import pandas as pd
import os
from django.conf import settings

def schema_view(request, dataset_id):
    """Return dataset schema for dynamic form generation"""
    try:
        dataset_path = os.path.join(settings.BASE_DIR.parent, 'data', 'telecom_churn.csv')
        
        if os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
            
            # Define field types and options for telecom dataset
            schema = {
                'fields': [
                    {
                        'name': 'tenure',
                        'type': 'number',
                        'label': 'Tenure (months)',
                        'required': True,
                        'min': 0,
                        'max': 100,
                        'default': 12
                    },
                    {
                        'name': 'MonthlyCharges',
                        'type': 'number',
                        'label': 'Monthly Charges ($)',
                        'required': True,
                        'min': 0,
                        'step': 0.01,
                        'default': 70.0
                    },
                    {
                        'name': 'Contract',
                        'type': 'select',
                        'label': 'Contract Type',
                        'required': True,
                        'options': ['Month-to-month', 'One year', 'Two year'],
                        'default': 'Month-to-month'
                    },
                    {
                        'name': 'PaymentMethod',
                        'type': 'select',
                        'label': 'Payment Method',
                        'required': True,
                        'options': ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'],
                        'default': 'Electronic check'
                    },
                    {
                        'name': 'PaperlessBilling',
                        'type': 'select',
                        'label': 'Paperless Billing',
                        'required': True,
                        'options': ['Yes', 'No'],
                        'default': 'Yes'
                    },
                    {
                        'name': 'InternetService',
                        'type': 'select',
                        'label': 'Internet Service',
                        'required': True,
                        'options': ['Fiber optic', 'DSL', 'No'],
                        'default': 'Fiber optic'
                    }
                ]
            }
            
            return JsonResponse({
                'success': True,
                'schema': schema,
                'dataset_info': {
                    'total_features': len(df.columns),
                    'prediction_features': len(schema['fields'])
                }
            })
        else:
            return JsonResponse({'success': False, 'error': 'Dataset not found'})
            
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})