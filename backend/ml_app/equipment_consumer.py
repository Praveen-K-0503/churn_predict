import json
import asyncio
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime

class EquipmentMonitoringConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("equipment_monitoring", self.channel_name)
        await self.accept()
        
        # Start sending real-time data
        self.monitoring_task = asyncio.create_task(self.send_equipment_data())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("equipment_monitoring", self.channel_name)
        if hasattr(self, 'monitoring_task'):
            self.monitoring_task.cancel()

    async def send_equipment_data(self):
        equipment_base = [
            {'id': 'Reactor-001', 'type': 'Reactor', 'baseFlow': 150.5, 'basePressure': 25.3, 'baseTemp': 85.2},
            {'id': 'Pump-002', 'type': 'Pump', 'baseFlow': 200.0, 'basePressure': 45.7, 'baseTemp': 65.1},
            {'id': 'Heat Exchanger-003', 'type': 'Heat Exchanger', 'baseFlow': 175.2, 'basePressure': 30.1, 'baseTemp': 120.5},
            {'id': 'Compressor-004', 'type': 'Compressor', 'baseFlow': 300.8, 'basePressure': 60.2, 'baseTemp': 95.3},
            {'id': 'Valve-005', 'type': 'Valve', 'baseFlow': 125.3, 'basePressure': 20.5, 'baseTemp': 55.8}
        ]
        
        while True:
            try:
                equipment_data = []
                alerts = []
                
                for eq in equipment_base:
                    variance = 0.15
                    flowrate = eq['baseFlow'] + (random.random() - 0.5) * eq['baseFlow'] * variance
                    pressure = eq['basePressure'] + (random.random() - 0.5) * eq['basePressure'] * variance
                    temperature = eq['baseTemp'] + (random.random() - 0.5) * eq['baseTemp'] * variance
                    
                    # Status determination
                    status = 'normal'
                    risk = random.random() * 0.3
                    
                    if temperature > eq['baseTemp'] * 1.15 or pressure > eq['basePressure'] * 1.2:
                        status = 'warning'
                        risk = random.random() * 0.3 + 0.4
                    elif temperature > eq['baseTemp'] * 1.25 or pressure > eq['basePressure'] * 1.3:
                        status = 'critical'
                        risk = random.random() * 0.3 + 0.7
                        
                        # Generate alert
                        alerts.append({
                            'id': eq['id'],
                            'message': f"{eq['id']}: High {'temperature' if temperature > eq['baseTemp'] * 1.2 else 'pressure'} detected",
                            'severity': status,
                            'timestamp': datetime.now().strftime('%H:%M:%S')
                        })
                    
                    equipment_data.append({
                        'id': eq['id'],
                        'type': eq['type'],
                        'flowrate': round(flowrate, 1),
                        'pressure': round(pressure, 1),
                        'temperature': round(temperature, 1),
                        'status': status,
                        'risk': round(risk, 2),
                        'efficiency': round(85 + random.random() * 15, 1),
                        'timestamp': datetime.now().strftime('%H:%M:%S'),
                        'baseFlow': eq['baseFlow'],
                        'basePressure': eq['basePressure'],
                        'baseTemp': eq['baseTemp']
                    })
                
                await self.send(text_data=json.dumps({
                    'type': 'equipment_data',
                    'equipment': equipment_data,
                    'alerts': alerts,
                    'timestamp': datetime.now().isoformat()
                }))
                
                await asyncio.sleep(3)  # Send data every 3 seconds
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in equipment monitoring: {e}")
                await asyncio.sleep(5)