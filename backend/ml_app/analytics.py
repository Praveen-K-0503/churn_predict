from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def get_analytics(request, dataset_id):
    if request.method == 'GET':
        try:
            # Mock analytics data for telco customer churn dataset
            analytics_data = {
                'dataset_id': dataset_id,
                'total_customers': 7043,
                'churn_rate': 26.5,
                'contract_distribution': {
                    'Month-to-month': 3875,
                    'One year': 1473,
                    'Two year': 1695
                },
                'internet_service': {
                    'Fiber optic': 3096,
                    'DSL': 2421,
                    'No': 1526
                },
                'avg_monthly_charges': 64.76,
                'avg_total_charges': 2283.30,
                'avg_tenure': 32.4,
                'churn_by_contract': {
                    'Month-to-month': 42.7,
                    'One year': 11.3,
                    'Two year': 2.8
                },
                'insights': [
                    'Month-to-month customers have highest churn rate (42.7%)',
                    'Fiber optic customers show higher churn tendency',
                    'Longer tenure customers are more likely to stay'
                ],
                'customer_segments': [
                    {'segment': 'High Risk', 'count': 1869, 'churn_rate': 100, 'avg_charges': 74.44},
                    {'segment': 'Medium Risk', 'count': 2587, 'churn_rate': 15.2, 'avg_charges': 61.27},
                    {'segment': 'Low Risk', 'count': 2587, 'churn_rate': 3.1, 'avg_charges': 58.32}
                ]
            }
            
            return JsonResponse(analytics_data)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'message': 'Analytics endpoint'})