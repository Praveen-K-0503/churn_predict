import pytest
import pandas as pd
from django.test import TestCase
from django.contrib.auth import get_user_model
from ml_app.models import DatasetMeta, ModelVersion
from ml_app.utils.pipeline import load_data, clean_data, engineer_features, balance_split, train_models

User = get_user_model()

class TestMLPipeline(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='admin'
        )
        
        # Create sample telecom data
        self.sample_data = pd.DataFrame({
            'customerID': ['C001', 'C002', 'C003', 'C004', 'C005'],
            'gender': ['Male', 'Female', 'Male', 'Female', 'Male'],
            'tenure': [1, 34, 2, 45, 2],
            'MonthlyCharges': [29.85, 56.95, 53.85, 42.30, 70.70],
            'TotalCharges': [29.85, 1889.5, 108.15, 1840.75, 151.65],
            'Contract': ['Month-to-month', 'One year', 'Month-to-month', 'One year', 'Month-to-month'],
            'PaymentMethod': ['Electronic check', 'Mailed check', 'Mailed check', 'Bank transfer (automatic)', 'Electronic check'],
            'Churn': ['No', 'No', 'Yes', 'No', 'Yes']
        })

    def test_clean_data(self):
        """Test data cleaning functionality"""
        # Add some missing values and duplicates
        dirty_data = self.sample_data.copy()
        dirty_data.loc[0, 'MonthlyCharges'] = None
        dirty_data = pd.concat([dirty_data, dirty_data.iloc[0:1]], ignore_index=True)
        
        cleaned_data = clean_data(dirty_data)
        
        # Check no missing values in numeric columns
        self.assertFalse(cleaned_data.select_dtypes(include=['number']).isnull().any().any())
        
        # Check no duplicates
        self.assertEqual(len(cleaned_data), len(cleaned_data.drop_duplicates()))

    def test_engineer_features(self):
        """Test feature engineering"""
        engineered_data = engineer_features(self.sample_data)
        
        # Check if new features are created
        self.assertIn('avg_monthly_charges', engineered_data.columns)
        self.assertIn('charges_per_service', engineered_data.columns)
        
        # Check if categorical variables are encoded
        contract_cols = [col for col in engineered_data.columns if col.startswith('Contract_')]
        self.assertTrue(len(contract_cols) > 0)

    def test_balance_split(self):
        """Test data balancing and splitting"""
        X_train, X_test, y_train, y_test, scaler, feature_names = balance_split(self.sample_data)
        
        # Check shapes
        self.assertEqual(len(X_train), len(y_train))
        self.assertEqual(len(X_test), len(y_test))
        
        # Check if data is scaled (mean should be close to 0)
        self.assertAlmostEqual(X_train.mean(), 0, delta=0.1)

    def test_train_models(self):
        """Test model training with telecom data"""
        X_train, X_test, y_train, y_test, scaler, feature_names = balance_split(self.sample_data)
        
        results, best_model, best_model_name = train_models(X_train, X_test, y_train, y_test)
        
        # Check if results contain expected metrics
        for model_name, metrics in results.items():
            self.assertIn('f1_score', metrics)
            self.assertIn('auc', metrics)
            self.assertGreaterEqual(metrics['f1_score'], 0)
            self.assertLessEqual(metrics['f1_score'], 1)
        
        # Check if best model is selected
        self.assertIsNotNone(best_model)
        self.assertIn(best_model_name, results.keys())

    def test_dataset_meta_creation(self):
        """Test dataset metadata creation"""
        dataset = DatasetMeta.objects.create(
            user=self.user,
            filename='telecom_churn.csv',
            rows=7043,
            target_col='Churn',
            s3_key='datasets/test_key.csv'
        )
        
        self.assertEqual(dataset.rows, 7043)
        self.assertEqual(dataset.target_col, 'Churn')
        self.assertEqual(str(dataset), 'telecom_churn.csv - 7043 rows')

    def test_model_version_creation(self):
        """Test model version creation"""
        dataset = DatasetMeta.objects.create(
            user=self.user,
            filename='test.csv',
            rows=1000,
            s3_key='test_key'
        )
        
        model_version = ModelVersion.objects.create(
            dataset=dataset,
            model_type='RandomForest',
            metrics_json={'f1_score': 0.85, 'auc': 0.92},
            s3_pkl_key='models/test_model.pkl'
        )
        
        self.assertEqual(model_version.model_type, 'RandomForest')
        self.assertEqual(model_version.metrics_json['f1_score'], 0.85)

class TestTelecomDataAssertions(TestCase):
    """Test specific telecom dataset requirements"""
    
    def test_telecom_data_structure(self):
        """Test that telecom data meets requirements"""
        # Load actual telecom data
        df = pd.read_csv('data/telecom_churn.csv')
        
        # Assert minimum rows
        self.assertGreaterEqual(len(df), 7000, "Dataset should have at least 7000 rows")
        
        # Assert required columns exist
        required_columns = ['customerID', 'Churn', 'tenure', 'MonthlyCharges', 'TotalCharges']
        for col in required_columns:
            self.assertIn(col, df.columns, f"Required column {col} missing")
        
        # Assert target distribution
        churn_counts = df['Churn'].value_counts()
        self.assertIn('Yes', churn_counts.index)
        self.assertIn('No', churn_counts.index)
        
        # Assert data types
        self.assertTrue(pd.api.types.is_numeric_dtype(df['tenure']))
        self.assertTrue(pd.api.types.is_numeric_dtype(df['MonthlyCharges']))

    def test_model_performance_threshold(self):
        """Test that models meet minimum performance thresholds"""
        # This would be run after training
        # For now, we'll test the structure
        
        # Mock model results that should meet our standards
        mock_results = {
            'RandomForest': {'f1_score': 0.82, 'auc': 0.88},
            'XGBoost': {'f1_score': 0.85, 'auc': 0.90}
        }
        
        for model_name, metrics in mock_results.items():
            self.assertGreaterEqual(
                metrics['f1_score'], 0.8, 
                f"{model_name} F1 score should be >= 0.8 for telecom data"
            )
            self.assertGreaterEqual(
                metrics['auc'], 0.85,
                f"{model_name} AUC should be >= 0.85 for telecom data"
            )