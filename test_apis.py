import requests
import json
import time

def test_api():
    """Test all ChurnGuard APIs"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing ChurnGuard APIs...")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/api/")
        if response.status_code == 200:
            print("✅ API Health Check: PASSED")
        else:
            print("❌ API Health Check: FAILED")
    except:
        print("❌ API Health Check: SERVER NOT RUNNING")
        return False
    
    # Test 2: Admin panel
    try:
        response = requests.get(f"{base_url}/admin/")
        if response.status_code == 200:
            print("✅ Admin Panel: ACCESSIBLE")
        else:
            print("❌ Admin Panel: FAILED")
    except:
        print("❌ Admin Panel: FAILED")
    
    # Test 3: ML endpoints
    try:
        response = requests.get(f"{base_url}/api/ml/datasets/")
        if response.status_code in [200, 401]:  # 401 is OK, means auth is working
            print("✅ ML Datasets API: ACCESSIBLE")
        else:
            print("❌ ML Datasets API: FAILED")
    except:
        print("❌ ML Datasets API: FAILED")
    
    # Test 4: Analytics endpoint
    try:
        response = requests.get(f"{base_url}/api/ml/analytics/")
        if response.status_code in [200, 401]:
            print("✅ Analytics API: ACCESSIBLE")
        else:
            print("❌ Analytics API: FAILED")
    except:
        print("❌ Analytics API: FAILED")
    
    print("=" * 50)
    print("🎉 Basic API tests completed!")
    print("\n📋 Next Steps:")
    print("1. Open http://localhost:8000/admin")
    print("2. Login with: admin / admin123")
    print("3. Open simple-frontend/index.html")
    print("4. Test the prediction form")
    
    return True

if __name__ == "__main__":
    print("Waiting for server to start...")
    time.sleep(5)
    test_api()