import json
import uuid
import mlflow
import redis
from celery import shared_task
from django.conf import settings
from .models import DatasetMeta, ModelVersion, TrainingLog
from .utils.pipeline import (
    load_data, clean_data, engineer_features, 
    balance_split, train_models, get_shap_explanation, save_model_to_s3
)

@shared_task(bind=True, max_retries=3)
def train_pipeline(self, dataset_id, models_to_train):
    """Complete ML training pipeline"""
    try:
        # Get dataset
        dataset = DatasetMeta.objects.get(id=dataset_id)
        
        # Load data
        TrainingLog.objects.create(
            model_id=None, step='data_loading', status='started'
        )
        df = load_data(dataset.s3_key)
        
        # Clean data
        TrainingLog.objects.create(
            model_id=None, step='data_cleaning', status='started'
        )
        df_clean = clean_data(df)
        
        # Feature engineering
        TrainingLog.objects.create(
            model_id=None, step='feature_engineering', status='started'
        )
        df_engineered = engineer_features(df_clean)
        
        # Balance and split
        TrainingLog.objects.create(
            model_id=None, step='data_balancing', status='started'
        )
        X_train, X_test, y_train, y_test, scaler, feature_names = balance_split(df_engineered)
        
        # Train models
        TrainingLog.objects.create(
            model_id=None, step='model_training', status='started'
        )
        results, best_model, best_model_name = train_models(X_train, X_test, y_train, y_test)
        
        # MLflow logging
        with mlflow.start_run():
            mlflow.log_params({
                'dataset_rows': len(df),
                'features': len(feature_names),
                'best_model': best_model_name
            })
            
            for model_name, metrics in results.items():
                mlflow.log_metrics({
                    f'{model_name}_f1': metrics['f1_score'],
                    f'{model_name}_auc': metrics['auc']
                })
        
        # Save best model
        model_s3_key = f"models/{dataset_id}_{best_model_name}_{uuid.uuid4().hex}.pkl"
        save_model_to_s3(best_model, scaler, model_s3_key)
        
        # Get SHAP explanations
        shap_explanations = get_shap_explanation(best_model, X_test, feature_names)
        
        # Save model version
        model_version = ModelVersion.objects.create(
            dataset=dataset,
            model_type=best_model_name,
            metrics_json=results[best_model_name],
            s3_pkl_key=model_s3_key
        )
        
        TrainingLog.objects.create(
            model=model_version, step='training_complete', status='success'
        )
        
        return {
            'status': 'success',
            'model_version': model_version.version,
            'metrics': results[best_model_name],
            'shap': shap_explanations
        }
        
    except Exception as exc:
        TrainingLog.objects.create(
            model_id=None, step='training_failed', status=f'error: {str(exc)}'
        )
        raise self.retry(exc=exc, countdown=60)

@shared_task
def stream_updates():
    """Generate simulated real-time events"""
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        
        # Simulate telecom events
        events = [
            {'type': 'billing_alert', 'customer_id': f'C{uuid.uuid4().hex[:8]}', 'amount': 89.99},
            {'type': 'service_call', 'customer_id': f'C{uuid.uuid4().hex[:8]}', 'duration': 15},
            {'type': 'data_usage', 'customer_id': f'C{uuid.uuid4().hex[:8]}', 'gb_used': 25.5}
        ]
        
        import random
        event = random.choice(events)
        event['timestamp'] = str(uuid.uuid4())
        
        r.lpush('telecom_events', json.dumps(event))
        r.expire('telecom_events', 300)  # 5 min TTL
        
        return f"Generated event: {event['type']}"
        
    except Exception as e:
        return f"Stream error: {str(e)}"