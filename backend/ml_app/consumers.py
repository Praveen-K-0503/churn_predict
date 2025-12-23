import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models
from datetime import datetime, timedelta
import random

class CustomerMonitoringConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("customer_monitoring", self.channel_name)
        await self.accept()
        
        # Start sending real-time data
        asyncio.create_task(self.send_realtime_data())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("customer_monitoring", self.channel_name)

    async def send_realtime_data(self):
        while True:
            try:
                # Get live customer metrics
                data = await self.get_customer_metrics()
                await self.send(text_data=json.dumps({
                    'type': 'customer_data',
                    'data': data,
                    'timestamp': datetime.now().isoformat()
                }))
                await asyncio.sleep(3)  # Update every 3 seconds
            except Exception as e:
                print(f"Error sending data: {e}")
                break

    async def get_customer_metrics(self):
        # In production, connect to actual data sources:
        # - Customer database
        # - Payment processing system
        # - Support ticket system
        # - Usage analytics
        
        return {
            'active_customers': await self.get_active_customers(),
            'churn_rate': await self.calculate_churn_rate(),
            'new_signups': await self.get_new_signups(),
            'payment_failures': await self.get_payment_failures(),
            'support_tickets': await self.get_support_tickets(),
            'high_risk_customers': await self.get_high_risk_customers()
        }

    async def get_active_customers(self):
        # Connect to customer database
        # return Customer.objects.filter(status='active').count()
        return 7043 + random.randint(-50, 50)

    async def calculate_churn_rate(self):
        # Calculate from recent churns
        return 26.5 + random.uniform(-2, 2)

    async def get_new_signups(self):
        # From signup system
        return random.randint(10, 30)

    async def get_payment_failures(self):
        # From payment processor
        return random.randint(5, 25)

    async def get_support_tickets(self):
        # From support system
        return random.randint(15, 45)

    async def get_high_risk_customers(self):
        # From ML prediction system
        return random.randint(800, 1200)