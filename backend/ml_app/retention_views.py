from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from .models import DatasetMeta
import os
from django.conf import settings

class RetentionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        try:
            dataset = DatasetMeta.objects.get(id=dataset_id)
            data_path = os.path.join(settings.BASE_DIR.parent, 'data', 'telecom_churn.csv')
            
            if not os.path.exists(data_path):
                return Response({'error': 'Dataset not found'}, status=404)
            
            df = pd.read_csv(data_path)
            
            # Add mock prediction probabilities
            np.random.seed(42)
            df['pred_prob'] = np.random.beta(2, 5, len(df))  # Realistic churn distribution
            
            # Identify high-risk, high-value customers
            risks = df['pred_prob'] > 0.7
            high_value = df['TotalCharges'].astype(str).str.replace(' ', '0').astype(float) > 1000
            
            # Customer segmentation
            features_for_clustering = df[['tenure', 'MonthlyCharges']].fillna(0)
            kmeans = KMeans(n_clusters=3, random_state=42)
            segments = kmeans.fit_predict(features_for_clustering)
            
            recommendations = []
            target_customers = df[risks & high_value].head(20)
            
            for idx, row in target_customers.iterrows():
                # A/B test simulation
                ab_treatment = np.random.choice(['A:Discount', 'B:Upgrade'], p=[0.6, 0.4])
                expected_uplift = 0.15 if ab_treatment.startswith('A') else 0.10
                
                # Rule-based recommendations
                if row['Contract'] == 'Month-to-month':
                    rule_rec = 'Offer annual contract discount'
                elif row['PaymentMethod'] == 'Electronic check':
                    rule_rec = 'Switch to automatic payment'
                else:
                    rule_rec = 'Personalized retention offer'
                
                recommendations.append({
                    'customer_id': row['customerID'],
                    'segment': int(segments[idx]),
                    'risk_score': float(row['pred_prob']),
                    'monthly_charges': float(row['MonthlyCharges']),
                    'tenure': int(row['tenure']),
                    'ab_treatment': ab_treatment,
                    'expected_uplift': expected_uplift,
                    'rule_recommendation': rule_rec,
                    'priority': 'High' if row['pred_prob'] > 0.8 else 'Medium'
                })
            
            ab_summary = {
                'A_rate': 0.6,
                'B_rate': 0.4,
                'avg_uplift': 0.125,
                'total_customers': len(recommendations)
            }
            
            return Response({
                'success': True,
                'recommendations': recommendations,
                'ab_summary': ab_summary,
                'segments_info': {
                    'total_segments': 3,
                    'high_risk_count': len(target_customers)
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)