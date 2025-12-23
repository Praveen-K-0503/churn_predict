import pytest
import pandas as pd
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from ml_app.models import DatasetMeta
import json

User = get_user_model()

class TestRetentionAPI(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        self.client.force_login(self.user)
        
        # Create test dataset
        self.dataset = DatasetMeta.objects.create(
            user=self.user,
            filename='test_telecom.csv',
            rows=100,
            target_col='Churn',
            s3_key='test/key'
        )

    def test_retention_recommendations(self):
        \"\"\"Test retention recommendations endpoint\"\"\"
        response = self.client.get(f'/api/ml/retention/{self.dataset.id}/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('recommendations', data)
        self.assertIn('ab_summary', data)
        
        # Check recommendation structure
        if data['recommendations']:
            rec = data['recommendations'][0]
            self.assertIn('customer_id', rec)
            self.assertIn('risk_score', rec)
            self.assertIn('expected_uplift', rec)
            self.assertIn('ab_treatment', rec)

    def test_retention_ab_summary(self):
        \"\"\"Test A/B test summary in retention response\"\"\"
        response = self.client.get(f'/api/ml/retention/{self.dataset.id}/')
        data = response.json()
        
        ab_summary = data['ab_summary']
        self.assertIn('A_rate', ab_summary)
        self.assertIn('B_rate', ab_summary)
        self.assertIn('avg_uplift', ab_summary)
        
        # Rates should sum to 1.0
        self.assertAlmostEqual(
            ab_summary['A_rate'] + ab_summary['B_rate'], 
            1.0, 
            places=1
        )

class TestAdvancedAnalytics(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        self.client.force_login(self.user)

    def test_analytics_advanced_features(self):
        \"\"\"Test advanced analytics features\"\"\"
        response = self.client.get('/api/ml/analytics/1/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check for advanced analytics components
        self.assertIn('cohort_analysis', data)
        self.assertIn('heatmap', data)
        self.assertIn('roc_curve', data)
        self.assertIn('feature_importance', data)
        self.assertIn('shap_summary', data)

    def test_roc_curve_data(self):
        \"\"\"Test ROC curve data structure\"\"\"
        response = self.client.get('/api/ml/analytics/1/')
        data = response.json()
        
        roc_data = data['roc_curve']
        self.assertIn('fpr', roc_data)
        self.assertIn('tpr', roc_data)
        self.assertIn('auc', roc_data)
        
        # AUC should be between 0 and 1
        self.assertGreaterEqual(roc_data['auc'], 0)
        self.assertLessEqual(roc_data['auc'], 1)

class TestPredictionAPI(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='manager'
        )
        self.client.force_login(self.user)

    def test_prediction_with_shap(self):
        \"\"\"Test prediction endpoint with SHAP explanations\"\"\"
        customer_data = {
            'tenure': 1,
            'MonthlyCharges': 85.0,
            'Contract': 'Month-to-month',
            'PaymentMethod': 'Electronic check',
            'PaperlessBilling': 'Yes'
        }
        
        response = self.client.post(
            '/api/ml/predict/',
            data=json.dumps({'customer_data': customer_data}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('risk_score', data)
        self.assertIn('risk_level', data)
        self.assertIn('shap_values', data)
        self.assertIn('explain', data)
        
        # Risk level should be valid
        self.assertIn(data['risk_level'], ['low', 'medium', 'high'])
        
        # Should have SHAP explanations
        self.assertEqual(len(data['explain']), 3)  # Top 3 features

    def test_high_risk_prediction(self):
        \"\"\"Test high-risk customer prediction\"\"\"
        high_risk_customer = {
            'tenure': 1,
            'MonthlyCharges': 90.0,
            'Contract': 'Month-to-month',
            'PaymentMethod': 'Electronic check',
            'PaperlessBilling': 'Yes'
        }
        
        response = self.client.post(
            '/api/ml/predict/',
            data=json.dumps({'customer_data': high_risk_customer}),
            content_type='application/json'
        )
        
        data = response.json()
        
        # Should be high risk based on factors
        self.assertGreater(data['risk_score'], 0.7)
        self.assertEqual(data['risk_level'], 'high')
        
        # Should have retention insights
        self.assertIn('insights', data)
        self.assertGreater(len(data['insights']), 0)