from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
from django.conf import settings

@csrf_exempt
def get_dataset_data(request, dataset_id):
    """Get actual dataset data for advanced visualizations"""
    try:
        # Load dataset metadata
        metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
        metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
        
        if not os.path.exists(metadata_path):
            return JsonResponse({'error': 'Dataset not found'}, status=404)
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Load dataset
        file_path = metadata['file_path']
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                return JsonResponse({'error': 'Unsupported file format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Failed to load dataset: {str(e)}'}, status=400)
        
        # Convert to JSON-serializable format
        # Limit to first 100 rows for performance
        df_sample = df.head(100)
        
        # Convert DataFrame to list of dictionaries
        data = []
        for _, row in df_sample.iterrows():
            row_dict = {}
            for col in df_sample.columns:
                value = row[col]
                # Handle NaN values
                if pd.isna(value):
                    row_dict[col] = None
                elif isinstance(value, (int, float)):
                    row_dict[col] = float(value)
                else:
                    row_dict[col] = str(value)
            data.append(row_dict)
        
        return JsonResponse({
            'success': True,
            'data': data,
            'total_rows': len(df),
            'sample_rows': len(data),
            'columns': list(df.columns)
        })
        
    except Exception as e:
        return JsonResponse({
            'error': f'Failed to get dataset data: {str(e)}'
        }, status=500)