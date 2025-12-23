from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
from django.conf import settings
from datetime import datetime
import re

# AI-powered dataset naming
def generate_smart_dataset_name(df, original_filename):
    """
    Generate intelligent dataset names based on content analysis
    """
    try:
        columns = df.columns.tolist()
        column_str = ' '.join(columns).lower()
        
        # Dataset type detection patterns
        if any(word in column_str for word in ['churn', 'customer', 'tenure', 'contract']):
            dataset_type = 'Customer Churn'
            domain = 'Telecom'
        elif any(word in column_str for word in ['sales', 'revenue', 'price', 'product']):
            dataset_type = 'Sales Analytics'
            domain = 'Business'
        elif any(word in column_str for word in ['employee', 'hr', 'salary', 'department']):
            dataset_type = 'HR Analytics'
            domain = 'Human Resources'
        else:
            dataset_type = 'General Analytics'
            domain = 'Business Intelligence'
        
        rows = len(df)
        size_desc = 'Large' if rows > 10000 else 'Medium' if rows > 1000 else 'Small'
        
        smart_name = f"{domain} {dataset_type} - {size_desc} Dataset ({rows:,} records)"
        
        return {
            'display_name': smart_name,
            'dataset_type': dataset_type,
            'domain': domain,
            'size_category': size_desc,
            'auto_generated': True
        }
    except:
        return {
            'display_name': original_filename,
            'dataset_type': 'Unknown',
            'domain': 'General',
            'size_category': 'Unknown',
            'auto_generated': False
        }

@csrf_exempt
def clean_dataset(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dataset_id = data.get('dataset_id')
            
            if not dataset_id:
                return JsonResponse({'error': 'dataset_id required'}, status=400)
            
            # Load dataset
            uploaded_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            dataset_files = [f for f in os.listdir(uploaded_dir) if dataset_id in f]
            
            if not dataset_files:
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            file_path = os.path.join(uploaded_dir, dataset_files[0])
            df = pd.read_csv(file_path)
            
            original_rows = len(df)
            
            # Data cleaning steps
            cleaning_results = {
                'original_rows': original_rows,
                'missing_values': {},
                'duplicates_removed': 0,
                'outliers_detected': 0,
                'data_types_fixed': []
            }
            
            # Handle missing values
            for col in df.columns:
                missing_count = df[col].isnull().sum()
                if missing_count > 0:
                    cleaning_results['missing_values'][col] = int(missing_count)
                    
                    if df[col].dtype == 'object':
                        df[col].fillna('Unknown', inplace=True)
                    else:
                        df[col].fillna(df[col].median(), inplace=True)
            
            # Fix TotalCharges if it exists
            if 'TotalCharges' in df.columns:
                df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
                df['TotalCharges'].fillna(0, inplace=True)
                cleaning_results['data_types_fixed'].append('TotalCharges')
            
            # Remove duplicates
            duplicates = df.duplicated().sum()
            df.drop_duplicates(inplace=True)
            cleaning_results['duplicates_removed'] = int(duplicates)
            
            # Detect outliers (simple IQR method for numerical columns)
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            outlier_count = 0
            for col in numerical_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                outliers = ((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum()
                outlier_count += outliers
            
            cleaning_results['outliers_detected'] = int(outlier_count)
            cleaning_results['cleaned_rows'] = len(df)
            cleaning_results['cleaning_summary'] = f"Dataset cleaned successfully. {sum(cleaning_results['missing_values'].values())} missing values filled, {duplicates} duplicates removed."
            
            # Save cleaned dataset
            cleaned_dir = os.path.join(settings.BASE_DIR, 'cleaned_datasets')
            os.makedirs(cleaned_dir, exist_ok=True)
            cleaned_file_path = os.path.join(cleaned_dir, f'cleaned_{dataset_files[0]}')
            df.to_csv(cleaned_file_path, index=False)
            
            return JsonResponse({
                'success': True,
                'cleaning_results': cleaning_results,
                'cleaned_file_path': cleaned_file_path
            })
            
        except Exception as e:
            return JsonResponse({'error': f'Cleaning failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Data cleaning endpoint'})

@csrf_exempt
def perform_eda(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dataset_id = data.get('dataset_id')
            
            if not dataset_id:
                return JsonResponse({'error': 'dataset_id required'}, status=400)
            
            # Load dataset
            uploaded_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            dataset_files = [f for f in os.listdir(uploaded_dir) if dataset_id in f]
            
            if not dataset_files:
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            file_path = os.path.join(uploaded_dir, dataset_files[0])
            df = pd.read_csv(file_path)
            
            # Handle TotalCharges conversion
            if 'TotalCharges' in df.columns:
                df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
                df['TotalCharges'].fillna(0, inplace=True)
            
            eda_results = {
                'dataset_info': {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'memory_usage': f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB"
                },
                'numerical_stats': {},
                'categorical_distribution': {},
                'correlations': {},
                'missing_values': {},
                'data_types': {}
            }
            
            # Numerical statistics
            numerical_cols = df.select_dtypes(include=[np.number]).columns
            for col in numerical_cols:
                eda_results['numerical_stats'][col] = {
                    'mean': float(df[col].mean()),
                    'median': float(df[col].median()),
                    'std': float(df[col].std()),
                    'min': float(df[col].min()),
                    'max': float(df[col].max())
                }
            
            # Categorical distributions
            categorical_cols = df.select_dtypes(include=['object']).columns
            for col in categorical_cols:
                if col != 'customerID':  # Skip ID columns
                    value_counts = df[col].value_counts().head(10)  # Top 10 values
                    eda_results['categorical_distribution'][col] = value_counts.to_dict()
            
            # Correlations with target variable (if exists)
            if 'Churn' in df.columns:
                # Convert Churn to binary
                df['Churn_Binary'] = df['Churn'].map({'Yes': 1, 'No': 0})
                
                correlations = {}
                for col in numerical_cols:
                    if col != 'Churn_Binary':
                        corr = df[col].corr(df['Churn_Binary'])
                        if not np.isnan(corr):
                            correlations[f'{col}_churn'] = float(corr)
                
                eda_results['correlations'] = correlations
            
            # Missing values
            for col in df.columns:
                missing_count = df[col].isnull().sum()
                if missing_count > 0:
                    eda_results['missing_values'][col] = int(missing_count)
            
            # Data types
            for col in df.columns:
                eda_results['data_types'][col] = str(df[col].dtype)
            
            return JsonResponse({
                'success': True,
                'eda_results': eda_results
            })
            
        except Exception as e:
            return JsonResponse({'error': f'EDA failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'EDA endpoint'})

@csrf_exempt
def get_cleaned_datasets(request):
    if request.method == 'GET':
        try:
            cleaned_dir = os.path.join(settings.BASE_DIR, 'cleaned_datasets')
            
            if not os.path.exists(cleaned_dir):
                return JsonResponse([], safe=False)
            
            datasets = []
            for filename in os.listdir(cleaned_dir):
                if filename.endswith('.csv'):
                    file_path = os.path.join(cleaned_dir, filename)
                    try:
                        df = pd.read_csv(file_path)
                        # Generate smart metadata
                        smart_metadata = generate_smart_dataset_name(df, filename)
                        
                        # Extract dataset ID from filename
                        dataset_id = filename.replace('cleaned_', '').replace('.csv', '')
                        datasets.append({
                            'id': dataset_id,
                            'name': filename,
                            'display_name': smart_metadata['display_name'],
                            'dataset_type': smart_metadata['dataset_type'],
                            'domain': smart_metadata['domain'],
                            'rows': len(df),
                            'columns': len(df.columns),
                            'size': f"{os.path.getsize(file_path) / 1024 / 1024:.2f} MB",
                            'cleaned_at': datetime.now().strftime('%Y-%m-%d'),
                            'created_at': datetime.now().isoformat()
                        })
                    except Exception as e:
                        print(f"Error reading {filename}: {str(e)}")
                        continue
            
            return JsonResponse(datasets, safe=False)
            
        except Exception as e:
            print(f"Error in get_cleaned_datasets: {str(e)}")
            return JsonResponse([], safe=False)
    
    return JsonResponse({'message': 'Cleaned datasets endpoint'})

@csrf_exempt
def get_dataset_details(request, dataset_id):
    if request.method == 'GET':
        try:
            # Check uploaded datasets first
            uploaded_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            dataset_files = [f for f in os.listdir(uploaded_dir) if dataset_id in f]
            
            if not dataset_files:
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            file_path = os.path.join(uploaded_dir, dataset_files[0])
            df = pd.read_csv(file_path)
            
            # Handle TotalCharges conversion for telco data
            if 'TotalCharges' in df.columns:
                df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
            
            dataset_info = {
                'id': dataset_id,
                'name': dataset_files[0],
                'rows': len(df),
                'columns': len(df.columns),
                'size': f"{os.path.getsize(file_path) / 1024 / 1024:.2f} MB",
                'column_names': list(df.columns),
                'data_types': {col: str(df[col].dtype) for col in df.columns},
                'missing_values': {col: int(df[col].isnull().sum()) for col in df.columns if df[col].isnull().sum() > 0},
                'sample_data': df.head(5).to_dict('records')
            }
            
            return JsonResponse(dataset_info)
            
        except Exception as e:
            return JsonResponse({'error': f'Failed to get dataset details: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Dataset details endpoint'})

@csrf_exempt
def delete_dataset(request, dataset_id):
    if request.method == 'DELETE':
        try:
            # Delete from uploaded datasets
            uploaded_dir = os.path.join(settings.BASE_DIR, 'uploaded_datasets')
            dataset_files = [f for f in os.listdir(uploaded_dir) if dataset_id in f]
            
            for file in dataset_files:
                file_path = os.path.join(uploaded_dir, file)
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete from cleaned datasets
            cleaned_dir = os.path.join(settings.BASE_DIR, 'cleaned_datasets')
            if os.path.exists(cleaned_dir):
                cleaned_files = [f for f in os.listdir(cleaned_dir) if dataset_id in f]
                for file in cleaned_files:
                    file_path = os.path.join(cleaned_dir, file)
                    if os.path.exists(file_path):
                        os.remove(file_path)
            
            return JsonResponse({'success': True, 'message': 'Dataset deleted successfully'})
            
        except Exception as e:
            return JsonResponse({'error': f'Delete failed: {str(e)}'}, status=500)
    
    return JsonResponse({'message': 'Delete dataset endpoint'})