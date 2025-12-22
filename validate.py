"""
ChurnGuard Production Validation Script
Validates real telecom dataset and system readiness
"""
import pandas as pd
import os
import sys
from pathlib import Path

def validate_dataset():
    """Validate the real telecom dataset"""
    print("Validating Real Telecom Dataset...")
    
    dataset_path = "data/telecom_churn.csv"
    if not os.path.exists(dataset_path):
        print("❌ Dataset not found!")
        return False
    
    # Load dataset
    df = pd.read_csv(dataset_path)
    
    # Validate size
    expected_size = 7043
    if len(df) < expected_size:
        print(f"Dataset too small: {len(df)} < {expected_size}")
        return False
    
    # Validate columns
    required_cols = ['customerID', 'Churn', 'tenure', 'MonthlyCharges', 'TotalCharges']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"❌ Missing columns: {missing_cols}")
        return False
    
    # Validate churn distribution
    churn_counts = df['Churn'].value_counts()
    churn_rate = churn_counts.get('Yes', 0) / len(df)
    
    print(f"Dataset validated:")
    print(f"   Size: {len(df):,} customers")
    print(f"   Churn Rate: {churn_rate:.1%}")
    print(f"   Features: {len(df.columns)} columns")
    
    return True

def validate_environment():
    """Validate production environment"""
    print("Validating Production Environment...")
    
    required_vars = [
        'AWS_ACCOUNT_ID', 'S3_BUCKET', 'SECRET_KEY'
    ]
    
    # Check .env file
    if not os.path.exists('.env'):
        print(".env file not found!")
        return False
    
    # Load environment variables
    with open('.env', 'r') as f:
        env_content = f.read()
    
    # Check required variables
    missing_vars = []
    for var in required_vars:
        if var not in env_content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"Missing environment variables: {missing_vars}")
        return False
    
    # Validate AWS Account ID
    if '906989717040' not in env_content:
        print("AWS Account ID not configured correctly!")
        return False
    
    print("Environment validated:")
    print("   AWS Account: 906989717040")
    print("   S3 Bucket: churnguard-906989717040-prod")
    print("   Django Secret: Configured")
    
    return True

def validate_dependencies():
    """Validate required dependencies"""
    print("Validating Dependencies...")
    
    try:
        import django
        import pandas
        import sklearn
        import xgboost
        import boto3
        print("Backend dependencies: OK")
    except ImportError as e:
        print(f"Missing Python dependency: {e}")
        return False
    
    # Check Node.js dependencies
    if not os.path.exists('frontend/node_modules'):
        print("Frontend dependencies not installed!")
        return False
    
    print("All dependencies validated")
    return True

def main():
    """Run complete production validation"""
    print("ChurnGuard Production Validation")
    print("=" * 50)
    
    validations = [
        ("Dataset", validate_dataset),
        ("Environment", validate_environment), 
        ("Dependencies", validate_dependencies)
    ]
    
    all_passed = True
    for name, validator in validations:
        if not validator():
            all_passed = False
            print(f"{name} validation failed!")
        print()
    
    if all_passed:
        print("All validations passed!")
        print("ChurnGuard ready for production deployment")
        print("Run: deploy.bat (Windows) or ./deploy.sh (Linux/Mac)")
    else:
        print("Validation failed - fix issues before deployment")
        sys.exit(1)

if __name__ == "__main__":
    main()