from django.urls import re_path
from . import consumers
from .equipment_consumer import EquipmentMonitoringConsumer

websocket_urlpatterns = [
    re_path(r'ws/analytics/(?P<dataset_id>\w+)/$', consumers.AnalyticsConsumer.as_asgi()),
    re_path(r'ws/training/(?P<training_id>\w+)/$', consumers.TrainingConsumer.as_asgi()),
    re_path(r'ws/equipment-monitoring/$', EquipmentMonitoringConsumer.as_asgi()),
]