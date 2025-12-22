#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from auth_app.models import CustomUser
from ml_app.models import Dataset
import pandas as pd

def create_users():
    """Create admin and manager users"""
    print("Creating users...")
    
    # Create admin user
    if not CustomUser.objects.filter(username='admin').exists():
        admin = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@churnguard.com',
            password='admin123',
            role='admin'
        )
        print("✓ Admin user created: admin / admin123")
    else:
        print("✓ Admin user already exists")
    
    # Create manager user
    if not CustomUser.objects.filter(username='manager').exists():
        manager = CustomUser.objects.create_user(
            username='manager',
            email='manager@churnguard.com',
            password='manager123',
            role='manager'
        )
        print("✓ Manager user created: manager / manager123")
    else:
        print("✓ Manager user already exists")

def load_dataset():
    """Load the telecom dataset"""
    print("Loading dataset...")
    
    if Dataset.objects.filter(name='Telecom Churn Dataset').exists():
        print("✓ Dataset already loaded")
        return
    
    # Load CSV data
    csv_path = '../data/telecom_churn.csv'
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        
        # Create dataset record
        dataset = Dataset.objects.create(
            name='Telecom Churn Dataset',
            description='Real telecom customer data with 7,043 records',
            file_path=csv_path,
            total_records=len(df),
            churn_rate=df['Churn'].value_counts(normalize=True).get('Yes', 0) * 100,
            status='processed'
        )
        
        print(f"✓ Dataset loaded: {len(df)} records, {dataset.churn_rate:.1f}% churn rate")
    else:
        print("⚠ Dataset file not found, skipping...")

if __name__ == '__main__':
    try:
        create_users()
        load_dataset()
        print("\n✓ Setup completed successfully!")
    except Exception as e:
        print(f"\n✗ Error during setup: {e}")
        sys.exit(1)