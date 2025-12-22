import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from ml_app.models import DatasetMeta, ModelVersion
from ml_app.utils.pipeline import load_data, clean_data, engineer_features, balance_split, train_models, save_model_to_s3

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with telecom churn data and train baseline models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-admin',
            action='store_true',
            help='Create admin user',
        )
        parser.add_argument(
            '--train-models',
            action='store_true',
            help='Train baseline models',
        )

    def handle(self, *args, **options):
        self.stdout.write('Starting ChurnGuard data seeding...')

        # Create admin user if requested
        if options['create_admin']:
            self.create_admin_user()

        # Load telecom dataset
        dataset = self.load_telecom_dataset()

        # Train models if requested
        if options['train_models']:
            self.train_baseline_models(dataset)

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded ChurnGuard database')
        )

    def create_admin_user(self):
        """Create admin user for demo"""
        try:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@churnguard.com',
                password='admin123',
                role='admin'
            )
            self.stdout.write(f'Created admin user: {admin_user.username}')
        except Exception as e:
            self.stdout.write(f'Admin user already exists or error: {e}')

        try:
            manager_user = User.objects.create_user(
                username='manager',
                email='manager@churnguard.com',
                password='manager123',
                role='manager'
            )
            self.stdout.write(f'Created manager user: {manager_user.username}')
        except Exception as e:
            self.stdout.write(f'Manager user already exists or error: {e}')

    def load_telecom_dataset(self):
        """Load telecom churn dataset"""
        try:
            # Get admin user
            admin_user = User.objects.get(username='admin')
        except User.DoesNotExist:
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@churnguard.com',
                password='admin123',
                role='admin'
            )

        # Check if dataset already exists
        existing_dataset = DatasetMeta.objects.filter(filename='telecom_churn.csv').first()
        if existing_dataset:
            self.stdout.write('Telecom dataset already exists')
            return existing_dataset

        # Load CSV data
        csv_path = os.path.join('..', 'data', 'telecom_churn.csv')
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'Dataset not found at {csv_path}'))
            return None

        df = pd.read_csv(csv_path)
        
        # Create dataset metadata
        dataset = DatasetMeta.objects.create(
            user=admin_user,
            filename='telecom_churn.csv',
            rows=len(df),
            target_col='Churn',
            s3_key='datasets/telecom_churn.csv'  # Mock S3 key for local dev
        )

        self.stdout.write(f'Loaded telecom dataset: {len(df)} rows')
        return dataset

    def train_baseline_models(self, dataset):
        """Train baseline models on telecom data"""
        if not dataset:
            self.stdout.write(self.style.ERROR('No dataset available for training'))
            return

        try:
            # Load and process data
            csv_path = os.path.join('..', 'data', 'telecom_churn.csv')
            df = pd.read_csv(csv_path)
            
            self.stdout.write('Cleaning data...')
            df_clean = clean_data(df)
            
            self.stdout.write('Engineering features...')
            df_engineered = engineer_features(df_clean)
            
            self.stdout.write('Balancing and splitting data...')
            X_train, X_test, y_train, y_test, scaler, feature_names = balance_split(df_engineered)
            
            self.stdout.write('Training models...')
            results, best_model, best_model_name = train_models(X_train, X_test, y_train, y_test)
            
            # Create model version
            model_version = ModelVersion.objects.create(
                dataset=dataset,
                model_type=best_model_name,
                metrics_json=results[best_model_name],
                s3_pkl_key=f'models/{dataset.id}_{best_model_name}_baseline.pkl'
            )
            
            # Print results
            self.stdout.write('\nModel Performance Results:')
            self.stdout.write('-' * 50)
            for model_name, metrics in results.items():
                f1_score = metrics['f1_score'] * 100
                auc_score = metrics['auc'] * 100
                marker = '*' if model_name == best_model_name else ' '
                self.stdout.write(f'{marker} {model_name:15} | F1: {f1_score:5.1f}% | AUC: {auc_score:5.1f}%')
            
            self.stdout.write(f'\nBest model: {best_model_name}')
            self.stdout.write(f'F1 Score: {results[best_model_name]["f1_score"]:.3f}')
            self.stdout.write(f'AUC Score: {results[best_model_name]["auc"]:.3f}')
            
            # Validate performance meets requirements
            if results[best_model_name]['f1_score'] >= 0.8:
                self.stdout.write(self.style.SUCCESS('OK Model meets F1 > 0.8 requirement'))
            else:
                self.stdout.write(self.style.WARNING('WARNING Model F1 score below 0.8 threshold'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Training failed: {str(e)}'))

    def create_sample_predictions(self, dataset):
        """Create sample high-risk predictions for demo"""
        try:
            admin_user = User.objects.get(username='admin')
            
            # Sample high-risk customers
            sample_customers = [
                {'customer_id': 'C001', 'risk_score': 0.89, 'insights': ['Offer retention discount', 'Assign dedicated support']},
                {'customer_id': 'C002', 'risk_score': 0.76, 'insights': ['Send satisfaction survey', 'Upgrade service offer']},
                {'customer_id': 'C003', 'risk_score': 0.82, 'insights': ['Contract renewal incentive', 'Loyalty program enrollment']},
            ]
            
            from ml_app.models import PredictionsRisk
            
            for customer in sample_customers:
                PredictionsRisk.objects.create(
                    user=admin_user,
                    dataset=dataset,
                    risk_score=customer['risk_score'],
                    insights={'recommendations': customer['insights'], 'customer_id': customer['customer_id']}
                )
            
            self.stdout.write(f'Created {len(sample_customers)} sample predictions')
            
        except Exception as e:
            self.stdout.write(f'Error creating sample predictions: {e}')