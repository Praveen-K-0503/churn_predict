from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/training/(?P<job_id>\w+)/$', consumers.TrainingConsumer.as_asgi()),
    re_path(r'ws/analytics/(?P<dataset_id>\d+)/$', consumers.AnalyticsConsumer.as_asgi()),
]