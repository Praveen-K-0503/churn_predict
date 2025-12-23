from django.db import models
from django.contrib.auth.models import User

class DatasetMeta(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    rows = models.IntegerField()
    target_col = models.CharField(max_length=100, default='Churn')
    upload_date = models.DateTimeField(auto_now_add=True)
    s3_key = models.CharField(max_length=500)
    
    def __str__(self):
        return f"{self.filename} - {self.rows} rows"

class ModelVersion(models.Model):
    dataset = models.ForeignKey(DatasetMeta, on_delete=models.CASCADE)
    model_type = models.CharField(max_length=50)
    metrics_json = models.JSONField()
    s3_pkl_key = models.CharField(max_length=500)
    version = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.model_type} v{self.version}"

class TrainingLog(models.Model):
    model = models.ForeignKey(ModelVersion, on_delete=models.CASCADE)
    step = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.step} - {self.status}"

class PredictionsRisk(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset = models.ForeignKey(DatasetMeta, on_delete=models.CASCADE)
    risk_score = models.FloatField()
    insights = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Risk: {self.risk_score:.2f}"