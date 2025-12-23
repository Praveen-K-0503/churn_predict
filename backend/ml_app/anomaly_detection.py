from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
from sklearn.covariance import EllipticEnvelope
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from django.conf import settings
import warnings
warnings.filterwarnings('ignore')

try:
    from pyod.models.knn import KNN
    from pyod.models.lof import LOF
    from pyod.models.iforest import IForest
    from pyod.models.ocsvm import OCSVM
    from pyod.models.abod import ABOD
    PYOD_AVAILABLE = True
except ImportError:
    PYOD_AVAILABLE = False

@csrf_exempt
def detect_anomalies(request):
    """Detect anomalies in dataset using multiple algorithms"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            dataset_id = data.get('dataset_id')
            algorithm = data.get('algorithm', 'isolation_forest')
            contamination = data.get('contamination', 0.1)
            
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
            
            print(f"Anomaly detection on {len(df)} rows using {algorithm}")
            
            # Prepare data - use only numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if len(numeric_cols) == 0:
                return JsonResponse({'error': 'No numeric columns found'}, status=400)
            
            X = df[numeric_cols].fillna(df[numeric_cols].median())
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Detect anomalies based on algorithm
            if algorithm == 'isolation_forest':
                detector = IsolationForest(
                    contamination=contamination,
                    random_state=42,
                    n_estimators=100
                )
                predictions = detector.fit_predict(X_scaled)
                scores = detector.score_samples(X_scaled)
                
            elif algorithm == 'local_outlier_factor':
                detector = LocalOutlierFactor(
                    contamination=contamination,
                    novelty=False
                )
                predictions = detector.fit_predict(X_scaled)
                scores = detector.negative_outlier_factor_
                
            elif algorithm == 'one_class_svm':
                detector = OneClassSVM(
                    nu=contamination,
                    kernel='rbf',
                    gamma='auto'
                )
                predictions = detector.fit_predict(X_scaled)
                scores = detector.score_samples(X_scaled)
                
            elif algorithm == 'elliptic_envelope':
                detector = EllipticEnvelope(
                    contamination=contamination,
                    random_state=42
                )
                predictions = detector.fit_predict(X_scaled)
                scores = detector.score_samples(X_scaled)
                
            elif algorithm == 'knn' and PYOD_AVAILABLE:
                detector = KNN(contamination=contamination)
                detector.fit(X_scaled)
                predictions = detector.labels_
                scores = detector.decision_scores_
                predictions = np.where(predictions == 1, -1, 1)
                
            else:
                return JsonResponse({'error': f'Unknown algorithm: {algorithm}'}, status=400)
            
            # Convert predictions (-1 for anomaly, 1 for normal)
            anomalies = predictions == -1
            anomaly_indices = np.where(anomalies)[0].tolist()
            
            # Get anomaly details
            anomaly_data = []
            for idx in anomaly_indices[:100]:  # Limit to 100 anomalies
                row_data = df.iloc[idx].to_dict()
                anomaly_data.append({
                    'index': int(idx),
                    'score': float(scores[idx]),
                    'data': {k: (float(v) if isinstance(v, (int, float, np.number)) else str(v)) 
                            for k, v in row_data.items()}
                })
            
            # Sort by score (most anomalous first)
            anomaly_data.sort(key=lambda x: x['score'])
            
            # Calculate statistics
            anomaly_stats = {
                'total_records': len(df),
                'total_anomalies': int(anomalies.sum()),
                'anomaly_percentage': float(anomalies.sum() / len(df) * 100),
                'normal_records': int((~anomalies).sum()),
                'algorithm_used': algorithm,
                'contamination_rate': contamination
            }
            
            # Feature-wise anomaly analysis
            feature_analysis = {}
            for col in numeric_cols:
                col_data = df[col][anomalies]
                if len(col_data) > 0:
                    feature_analysis[col] = {
                        'mean_anomaly': float(col_data.mean()),
                        'mean_normal': float(df[col][~anomalies].mean()),
                        'std_anomaly': float(col_data.std()),
                        'min_anomaly': float(col_data.min()),
                        'max_anomaly': float(col_data.max())
                    }
            
            # Anomaly distribution by feature
            anomaly_distribution = []
            for col in numeric_cols[:5]:  # Top 5 features
                anomaly_vals = df[col][anomalies].values
                normal_vals = df[col][~anomalies].values
                
                anomaly_distribution.append({
                    'feature': col,
                    'anomaly_mean': float(np.mean(anomaly_vals)) if len(anomaly_vals) > 0 else 0,
                    'normal_mean': float(np.mean(normal_vals)) if len(normal_vals) > 0 else 0,
                    'difference': float(abs(np.mean(anomaly_vals) - np.mean(normal_vals))) if len(anomaly_vals) > 0 and len(normal_vals) > 0 else 0
                })
            
            return JsonResponse({
                'success': True,
                'statistics': anomaly_stats,
                'anomalies': anomaly_data,
                'feature_analysis': feature_analysis,
                'anomaly_distribution': sorted(anomaly_distribution, key=lambda x: x['difference'], reverse=True),
                'numeric_columns': numeric_cols
            })
            
        except Exception as e:
            print(f"Anomaly detection error: {str(e)}")
            return JsonResponse({
                'error': f'Anomaly detection failed: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'message': 'Anomaly Detection endpoint',
        'available_algorithms': [
            'isolation_forest',
            'local_outlier_factor',
            'one_class_svm',
            'elliptic_envelope',
            'knn'
        ]
    })

@csrf_exempt
def get_anomaly_insights(request, dataset_id):
    """Get anomaly insights and recommendations"""
    try:
        # Load dataset
        metadata_dir = os.path.join(settings.BASE_DIR, 'dataset_metadata')
        metadata_path = os.path.join(metadata_dir, f'{dataset_id}.json')
        
        if not os.path.exists(metadata_path):
            return JsonResponse({'error': 'Dataset not found'}, status=404)
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        file_path = metadata['file_path']
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Quick anomaly detection with Isolation Forest
        X = df[numeric_cols].fillna(df[numeric_cols].median())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        detector = IsolationForest(contamination=0.1, random_state=42)
        predictions = detector.fit_predict(X_scaled)
        
        anomalies = predictions == -1
        anomaly_count = anomalies.sum()
        
        # Generate insights
        insights = {
            'anomaly_rate': float(anomaly_count / len(df) * 100),
            'risk_level': 'High' if anomaly_count / len(df) > 0.15 else 'Medium' if anomaly_count / len(df) > 0.05 else 'Low',
            'total_anomalies': int(anomaly_count),
            'recommendations': []
        }
        
        # Add recommendations
        if insights['anomaly_rate'] > 15:
            insights['recommendations'].append('High anomaly rate detected - investigate data quality')
            insights['recommendations'].append('Consider reviewing data collection process')
        elif insights['anomaly_rate'] > 5:
            insights['recommendations'].append('Moderate anomaly rate - monitor closely')
            insights['recommendations'].append('Review anomalous records for patterns')
        else:
            insights['recommendations'].append('Low anomaly rate - data quality is good')
            insights['recommendations'].append('Continue regular monitoring')
        
        return JsonResponse(insights)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)