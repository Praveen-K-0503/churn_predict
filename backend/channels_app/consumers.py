import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TrainingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.job_id = self.scope['url_route']['kwargs']['job_id']
        self.group_name = f'training_{self.job_id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def training_update(self, event):
        await self.send(text_data=json.dumps({
            'progress': event['progress'],
            'step': event['step'],
            'status': event.get('status', 'running')
        }))

class AnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.dataset_id = self.scope['url_route']['kwargs']['dataset_id']
        self.group_name = f'analytics_{self.dataset_id}'
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def analytics_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'data': event['data']
        }))