import asyncio
import aiohttp
import asyncpg
from datetime import datetime
import json

class LiveDataStreamer:
    def __init__(self):
        self.db_pool = None
        self.kafka_consumer = None
        
    async def setup_connections(self):
        """Setup connections to data sources"""
        # Database connection
        self.db_pool = await asyncpg.create_pool(
            "postgresql://user:password@localhost/customer_db"
        )
        
        # Kafka for real-time events (optional)
        # self.kafka_consumer = await self.setup_kafka()
        
    async def stream_customer_events(self):
        """Stream live customer events"""
        while True:
            try:
                # Get recent customer activities
                async with self.db_pool.acquire() as conn:
                    # New signups
                    new_customers = await conn.fetch("""
                        SELECT COUNT(*) as count 
                        FROM customers 
                        WHERE created_at >= NOW() - INTERVAL '5 minutes'
                    """)
                    
                    # Recent churns
                    recent_churns = await conn.fetch("""
                        SELECT COUNT(*) as count 
                        FROM customers 
                        WHERE status = 'churned' 
                        AND updated_at >= NOW() - INTERVAL '5 minutes'
                    """)
                    
                    # Payment failures
                    payment_failures = await conn.fetch("""
                        SELECT COUNT(*) as count 
                        FROM payments 
                        WHERE status = 'failed' 
                        AND created_at >= NOW() - INTERVAL '5 minutes'
                    """)
                    
                    yield {
                        'new_customers': new_customers[0]['count'],
                        'recent_churns': recent_churns[0]['count'],
                        'payment_failures': payment_failures[0]['count'],
                        'timestamp': datetime.now().isoformat()
                    }
                    
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                print(f"Database streaming error: {e}")
                await asyncio.sleep(60)

    async def stream_payment_events(self):
        """Stream payment processing events"""
        # Connect to payment processor API (Stripe, PayPal, etc.)
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    # Get recent payment events
                    async with session.get(
                        'https://api.stripe.com/v1/events',
                        headers={'Authorization': 'Bearer sk_live_...'},
                        params={'limit': 100, 'type': 'invoice.payment_failed'}
                    ) as response:
                        data = await response.json()
                        
                        for event in data.get('data', []):
                            yield {
                                'type': 'payment_failure',
                                'customer_id': event['data']['object']['customer'],
                                'amount': event['data']['object']['amount_due'],
                                'timestamp': event['created']
                            }
                            
                    await asyncio.sleep(60)  # Check every minute
                    
                except Exception as e:
                    print(f"Payment streaming error: {e}")
                    await asyncio.sleep(300)

    async def stream_support_events(self):
        """Stream support ticket events"""
        # Connect to support system (Zendesk, Freshdesk, etc.)
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    async with session.get(
                        'https://yourcompany.zendesk.com/api/v2/tickets.json',
                        headers={'Authorization': 'Bearer your_token'},
                        params={'sort_by': 'created_at', 'sort_order': 'desc'}
                    ) as response:
                        data = await response.json()
                        
                        for ticket in data.get('tickets', []):
                            if self.is_recent(ticket['created_at']):
                                yield {
                                    'type': 'support_ticket',
                                    'customer_id': ticket['requester_id'],
                                    'priority': ticket['priority'],
                                    'subject': ticket['subject'],
                                    'timestamp': ticket['created_at']
                                }
                                
                    await asyncio.sleep(120)  # Check every 2 minutes
                    
                except Exception as e:
                    print(f"Support streaming error: {e}")
                    await asyncio.sleep(300)

    async def stream_usage_analytics(self):
        """Stream usage analytics from CDR/network data"""
        while True:
            try:
                # Connect to network analytics system
                async with self.db_pool.acquire() as conn:
                    # Get usage patterns
                    usage_data = await conn.fetch("""
                        SELECT customer_id, 
                               SUM(data_usage) as total_data,
                               COUNT(*) as session_count,
                               AVG(session_duration) as avg_duration
                        FROM usage_logs 
                        WHERE timestamp >= NOW() - INTERVAL '1 hour'
                        GROUP BY customer_id
                        HAVING SUM(data_usage) < 100  -- Low usage indicator
                    """)
                    
                    for record in usage_data:
                        yield {
                            'type': 'low_usage_alert',
                            'customer_id': record['customer_id'],
                            'data_usage': record['total_data'],
                            'sessions': record['session_count'],
                            'avg_duration': record['avg_duration']
                        }
                        
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                print(f"Usage streaming error: {e}")
                await asyncio.sleep(600)

    def is_recent(self, timestamp_str, minutes=5):
        """Check if timestamp is within last N minutes"""
        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return (datetime.now() - timestamp).total_seconds() < (minutes * 60)

# Usage example
async def main():
    streamer = LiveDataStreamer()
    await streamer.setup_connections()
    
    # Start all streams concurrently
    await asyncio.gather(
        streamer.stream_customer_events(),
        streamer.stream_payment_events(),
        streamer.stream_support_events(),
        streamer.stream_usage_analytics()
    )