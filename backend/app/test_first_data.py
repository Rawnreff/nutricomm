# test_first_data.py
import requests
import json

def test_first_data():
    # Data sensor pertama
    data = {
        "id_kebun": "KBG001",
        "suhu": 28.5,
        "kelembapan_udara": 65.0,
        "kelembapan_tanah": 45.0,
        "cahaya": 700,
        "co2": 400,
        "timestamp": "2025-01-20T12:00:00"
    }
    
    try:
        response = requests.post(
            "http://localhost:5000/api/sensors/save",
            json=data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Data saved successfully: {result}")
        else:
            print(f"❌ Failed to save data: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def check_database():
    try:
        response = requests.get("http://localhost:5000/api/sensors/health")
        if response.status_code == 200:
            status = response.json()
            print(f"📊 Database Status: {status}")
        else:
            print(f"❌ Failed to check database: {response.text}")
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    print("🧪 Testing first data insertion...")
    check_database()
    test_first_data()
    check_database()