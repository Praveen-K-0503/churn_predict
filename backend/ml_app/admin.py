from django.contrib import admin
from .models import DatasetMeta, ModelVersion, TrainingLog, PredictionsRisk

@admin.register(DatasetMeta)
class DatasetMetaAdmin(admin.ModelAdmin):
    list_display = ['filename', 'rows', 'target_col', 'upload_date', 'user']
    list_filter = ['upload_date', 'target_col']
    search_fields = ['filename']

@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = ['model_type', 'dataset', 'version', 'created_at']
    list_filter = ['model_type', 'created_at']

@admin.register(TrainingLog)
class TrainingLogAdmin(admin.ModelAdmin):
    list_display = ['step', 'status', 'timestamp', 'model']
    list_filter = ['status', 'timestamp']

@admin.register(PredictionsRisk)
class PredictionsRiskAdmin(admin.ModelAdmin):
    list_display = ['user', 'risk_score', 'created_at']
    list_filter = ['risk_score', 'created_at']