import json
import redis
import uuid
import random
import os

def handler(event, context):
    """Generate simulated telecom events"""
    try:
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
        r = redis.Redis.from_url(redis_url)
        
        # Telecom event templates
        event_types = [
            {
                'type': 'billing_alert',
                'customer_id': f'C{random.randint(1000, 9999)}',
                'amount': round(random.uniform(50, 150), 2),
                'overdue_days': random.randint(1, 30)
            },
            {
                'type': 'service_call',
                'customer_id': f'C{random.randint(1000, 9999)}',
                'duration_minutes': random.randint(5, 45),
                'issue_type': random.choice(['technical', 'billing', 'general'])
            },
            {
                'type': 'data_usage_alert',
                'customer_id': f'C{random.randint(1000, 9999)}',
                'gb_used': round(random.uniform(15, 50), 1),
                'plan_limit': random.choice([20, 30, 50])
            },
            {
                'type': 'contract_expiry',
                'customer_id': f'C{random.randint(1000, 9999)}',
                'days_until_expiry': random.randint(1, 90),
                'contract_type': random.choice(['monthly', 'yearly', '2-year'])
            }
        ]
        
        # Generate random event
        event = random.choice(event_types).copy()
        event['timestamp'] = context.aws_request_id if context else str(uuid.uuid4())
        event['event_id'] = str(uuid.uuid4())
        
        # Push to Redis stream
        r.lpush('telecom_events', json.dumps(event))
        r.expire('telecom_events', 300)  # 5 minute TTL
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Generated {event["type"]} event',
                'event_id': event['event_id']
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }