from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
from django.conf import settings
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

@csrf_exempt
def natural_language_query(request):
    """Process natural language queries and return insights"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            query = data.get('query', '').lower().strip()
            dataset_id = data.get('dataset_id')
            
            if not query:
                return JsonResponse({'error': 'Query is required'}, status=400)
            
            if not dataset_id:
                return JsonResponse({'error': 'Dataset ID is required'}, status=400)
            
            # Load dataset
            metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
            metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
            
            if not os.path.exists(metadata_path):
                return JsonResponse({'error': 'Dataset not found'}, status=404)
            
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            file_path = metadata['file_path']
            try:
                if file_path.endswith('.csv'):
                    df = pd.read_csv(file_path)
                elif file_path.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(file_path)
                else:
                    return JsonResponse({'error': 'Unsupported file format'}, status=400)
            except:
                return JsonResponse({'error': 'Failed to read dataset'}, status=400)
            
            print(f"Processing NL query: '{query}' on dataset with {len(df)} rows")
            
            # Process the query
            result = process_query(query, df)
            
            return JsonResponse({
                'success': True,
                'query': query,
                'result': result,
                'dataset_info': {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': list(df.columns)
                }
            })
            
        except Exception as e:
            print(f"NL Query error: {str(e)}")
            return JsonResponse({
                'error': f'Query processing failed: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Natural Language Query endpoint',
        'examples': [
            'Show me high risk customers',
            'What factors drive churn?',
            'Find anomalies in temperature',
            'Show correlation between pressure and flow',
            'What is the average temperature?',
            'How many records have high pressure?'
        ]
    })

def process_query(query, df):
    """Process natural language query and return structured response"""
    
    # Intent classification
    intent = classify_intent(query)
    
    # Get numeric and categorical columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    all_cols = list(df.columns)
    
    result = {
        'intent': intent,
        'response_type': 'text',
        'answer': '',
        'data': None,
        'visualization': None,
        'confidence': 0.8
    }
    
    if intent == 'statistics':
        result = handle_statistics_query(query, df, numeric_cols)
    elif intent == 'filter':
        result = handle_filter_query(query, df, all_cols)
    elif intent == 'correlation':
        result = handle_correlation_query(query, df, numeric_cols)
    elif intent == 'anomaly':
        result = handle_anomaly_query(query, df, numeric_cols)
    elif intent == 'comparison':
        result = handle_comparison_query(query, df, all_cols)
    elif intent == 'count':
        result = handle_count_query(query, df, all_cols)
    else:
        result = handle_general_query(query, df)
    
    return result

def classify_intent(query):
    """Classify the intent of the natural language query"""
    
    # Statistics keywords
    if any(word in query for word in ['average', 'mean', 'median', 'max', 'min', 'sum', 'std', 'statistics']):
        return 'statistics'
    
    # Filter keywords
    if any(word in query for word in ['show me', 'find', 'get', 'high', 'low', 'above', 'below', 'greater', 'less']):
        return 'filter'
    
    # Correlation keywords
    if any(word in query for word in ['correlation', 'relationship', 'related', 'connection', 'between']):
        return 'correlation'
    
    # Anomaly keywords
    if any(word in query for word in ['anomaly', 'outlier', 'unusual', 'abnormal', 'strange']):
        return 'anomaly'
    
    # Comparison keywords
    if any(word in query for word in ['compare', 'vs', 'versus', 'difference', 'higher', 'lower']):
        return 'comparison'
    
    # Count keywords
    if any(word in query for word in ['how many', 'count', 'number of', 'total']):
        return 'count'
    
    return 'general'

def handle_statistics_query(query, df, numeric_cols):
    """Handle statistical queries"""
    result = {
        'intent': 'statistics',
        'response_type': 'data',
        'answer': '',
        'data': {},
        'visualization': 'table'
    }
    
    # Find mentioned columns
    mentioned_cols = [col for col in numeric_cols if col.lower() in query]
    
    if not mentioned_cols:
        mentioned_cols = numeric_cols[:3]  # Use first 3 numeric columns
    
    stats_data = []
    for col in mentioned_cols:
        stats = {
            'column': col,
            'mean': float(df[col].mean()),
            'median': float(df[col].median()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max())
        }
        stats_data.append(stats)
    
    result['data'] = stats_data
    result['answer'] = f"Statistical summary for {', '.join(mentioned_cols)}"
    
    return result

def handle_filter_query(query, df, all_cols):
    """Handle filtering queries"""
    result = {
        'intent': 'filter',
        'response_type': 'data',
        'answer': '',
        'data': [],
        'visualization': 'table'
    }
    
    # Find mentioned columns
    mentioned_cols = [col for col in all_cols if col.lower() in query]
    
    if not mentioned_cols:
        mentioned_cols = all_cols[:5]  # Use first 5 columns
    
    # Simple filtering logic
    filtered_df = df.copy()
    
    # High/Low filtering
    if 'high' in query:
        for col in mentioned_cols:
            if col in df.select_dtypes(include=[np.number]).columns:
                threshold = df[col].quantile(0.75)  # Top 25%
                filtered_df = filtered_df[filtered_df[col] > threshold]
                break
    elif 'low' in query:
        for col in mentioned_cols:
            if col in df.select_dtypes(include=[np.number]).columns:
                threshold = df[col].quantile(0.25)  # Bottom 25%
                filtered_df = filtered_df[filtered_df[col] < threshold]
                break
    
    # Convert to list of dictionaries
    data = []
    for _, row in filtered_df.head(20).iterrows():  # Limit to 20 rows
        row_dict = {}
        for col in mentioned_cols:
            value = row[col]
            if isinstance(value, (int, float, np.number)):
                row_dict[col] = float(value)
            else:
                row_dict[col] = str(value)
        data.append(row_dict)
    
    result['data'] = data
    result['answer'] = f"Found {len(filtered_df)} records matching your criteria"
    
    return result

def handle_correlation_query(query, df, numeric_cols):
    """Handle correlation queries"""
    result = {
        'intent': 'correlation',
        'response_type': 'data',
        'answer': '',
        'data': [],
        'visualization': 'heatmap'
    }
    
    if len(numeric_cols) < 2:
        result['answer'] = "Need at least 2 numeric columns for correlation analysis"
        return result
    
    # Calculate correlation matrix
    corr_matrix = df[numeric_cols].corr()
    
    # Convert to list format
    correlations = []
    for i, col1 in enumerate(numeric_cols):
        for j, col2 in enumerate(numeric_cols):
            if i < j:  # Avoid duplicates
                corr_val = corr_matrix.loc[col1, col2]
                if not pd.isna(corr_val):
                    correlations.append({
                        'feature1': col1,
                        'feature2': col2,
                        'correlation': float(corr_val)
                    })
    
    # Sort by absolute correlation
    correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    result['data'] = correlations[:10]  # Top 10 correlations
    result['answer'] = f"Top correlations found between {len(numeric_cols)} numeric features"
    
    return result

def handle_anomaly_query(query, df, numeric_cols):
    """Handle anomaly detection queries"""
    result = {
        'intent': 'anomaly',
        'response_type': 'data',
        'answer': '',
        'data': [],
        'visualization': 'scatter'
    }
    
    if len(numeric_cols) == 0:
        result['answer'] = "No numeric columns found for anomaly detection"
        return result
    
    # Simple anomaly detection using IQR method
    anomalies = []
    
    for col in numeric_cols[:3]:  # Check first 3 numeric columns
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        col_anomalies = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        
        for _, row in col_anomalies.head(10).iterrows():
            anomaly = {
                'column': col,
                'value': float(row[col]),
                'index': int(row.name),
                'type': 'high' if row[col] > upper_bound else 'low'
            }
            anomalies.append(anomaly)
    
    result['data'] = anomalies
    result['answer'] = f"Found {len(anomalies)} potential anomalies using IQR method"
    
    return result

def handle_comparison_query(query, df, all_cols):
    """Handle comparison queries"""
    result = {
        'intent': 'comparison',
        'response_type': 'data',
        'answer': '',
        'data': [],
        'visualization': 'bar'
    }
    
    # Find categorical column for grouping
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if not categorical_cols or not numeric_cols:
        result['answer'] = "Need both categorical and numeric columns for comparison"
        return result
    
    # Use first categorical and numeric column
    cat_col = categorical_cols[0]
    num_col = numeric_cols[0]
    
    # Group by categorical column and calculate mean
    comparison_data = []
    for category in df[cat_col].unique()[:10]:  # Limit to 10 categories
        subset = df[df[cat_col] == category]
        if len(subset) > 0:
            comparison_data.append({
                'category': str(category),
                'average': float(subset[num_col].mean()),
                'count': len(subset)
            })
    
    # Sort by average
    comparison_data.sort(key=lambda x: x['average'], reverse=True)
    
    result['data'] = comparison_data
    result['answer'] = f"Comparison of {num_col} across {cat_col} categories"
    
    return result

def handle_count_query(query, df, all_cols):
    """Handle counting queries"""
    result = {
        'intent': 'count',
        'response_type': 'data',
        'answer': '',
        'data': {},
        'visualization': 'number'
    }
    
    # Basic counts
    total_records = len(df)
    
    # Find mentioned columns
    mentioned_cols = [col for col in all_cols if col.lower() in query]
    
    counts = {
        'total_records': total_records,
        'total_columns': len(df.columns)
    }
    
    # Count unique values in categorical columns
    for col in mentioned_cols:
        if col in df.select_dtypes(include=['object']).columns:
            counts[f'{col}_unique'] = int(df[col].nunique())
    
    result['data'] = counts
    result['answer'] = f"Dataset contains {total_records} records and {len(df.columns)} columns"
    
    return result

def handle_general_query(query, df):
    """Handle general queries"""
    result = {
        'intent': 'general',
        'response_type': 'text',
        'answer': '',
        'data': None,
        'visualization': None
    }
    
    # Basic dataset info
    numeric_cols = len(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = len(df.select_dtypes(include=['object']).columns)
    
    result['answer'] = f"This dataset has {len(df)} rows and {len(df.columns)} columns. " \
                      f"It contains {numeric_cols} numeric columns and {categorical_cols} categorical columns. " \
                      f"You can ask me about statistics, correlations, anomalies, or specific data filters."
    
    return result