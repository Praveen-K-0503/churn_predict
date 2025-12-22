import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class TrainingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.job_id = self.scope['url_route']['kwargs']['job_id']
        self.group_name = f'training_{self.job_id}'
        
        # Join group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    async def training_update(self, event):
        # Send training progress to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'training_update',
            'step': event['step'],
            'progress': event['progress'],
            'status': event['status']
        }))

class AnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.dataset_id = self.scope['url_route']['kwargs']['dataset_id']
        self.group_name = f'analytics_{self.dataset_id}'
        
        # Join group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass
    
    async def analytics_update(self, event):
        # Send analytics updates to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'data': event['data']
        }))