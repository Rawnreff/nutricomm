"""
ESP32 Simulator - Test Script
Mensimulasikan pengiriman data sensor dari ESP32 ke backend
"""

import requests
import time
import random
from datetime import datetime

# Backend URL (GANTI dengan IP laptop Anda)
BACKEND_URL = "http://10.218.18.170:5000/api/sensors/save"
KEBUN_ID = "KBG001"
INTERVAL = 1  # detik

def generate_sensor_data():
    """Generate random sensor data (simulasi sensor ESP32)"""
    return {
        "id_kebun": KEBUN_ID,
        "suhu": round(25 + random.uniform(0, 10), 1),              # 25-35°C
        "kelembapan_udara": round(50 + random.uniform(0, 30), 1),  # 50-80%
        "kelembapan_tanah": round(30 + random.uniform(0, 40), 1),  # 30-70%
        "cahaya": random.randint(300, 800),                         # 300-800 lux
        "co2": random.randint(300, 600),                            # 300-600 ppm
        "timestamp": datetime.now().isoformat()
    }

def send_data(data):
    """Kirim data ke backend"""
    try:
        response = requests.post(BACKEND_URL, json=data, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print(f"SUCCESS [{datetime.now().strftime('%H:%M:%S')}] Data sent successfully!")
            print(f"   Suhu: {data['suhu']}°C | Kelembapan: {data['kelembapan_udara']}% | Tanah: {data['kelembapan_tanah']}%")
            print(f"   Cahaya: {data['cahaya']} lux | CO2: {data['co2']} ppm")
            print(f"   Update counter: {result.get('update_counter', 0)}/120")
            print()
            return True
        else:
            print(f"ERROR: HTTP {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"Connection Error: Backend tidak bisa diakses di {BACKEND_URL}")
        print(f"   Pastikan Flask backend sudah running!")
        return False
    except requests.exceptions.Timeout:
        print(f"Timeout: Backend tidak merespon dalam 5 detik")
        return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_health():
    """Test backend health endpoint"""
    try:
        health_url = BACKEND_URL.replace('/api/sensors/save', '/api/sensors/health')
        response = requests.get(health_url, timeout=5)
        
        if response.status_code == 200:
            health = response.json()
            print("Backend Health Check OK:")
            print(f"   Status: {health.get('status')}")
            print(f"   MongoDB: {health.get('mongodb')}")
            print(f"   Data Count: {health.get('data_count')}")
            print(f"   History Count: {health.get('history_count')}")
            print(f"   Mode: {health.get('mode')}")
            print()
            return True
        else:
            print(f"Health check failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Health check error: {e}")
        return False

def main():
    print("=" * 60)
    print("ESP32 SIMULATOR - Nutricomm")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Kebun ID: {KEBUN_ID}")
    print(f"Interval: {INTERVAL} detik")
    print("=" * 60)
    print()
    
    # Test backend health dulu
    print("Testing backend connection...")
    if not test_health():
        print()
        print("WARNING: Backend tidak bisa diakses!")
        print("Pastikan:")
        print("1. Flask backend sudah running")
        print("2. MongoDB sudah running")
        print("3. URL benar: http://10.218.18.170:5000")
        print()
        return
    
    print("Backend OK! Starting data transmission...")
    print("Press Ctrl+C to stop")
    print()
    
    # Main loop
    success_count = 0
    error_count = 0
    
    try:
        while True:
            data = generate_sensor_data()
            if send_data(data):
                success_count += 1
            else:
                error_count += 1
            
            time.sleep(INTERVAL)
            
    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print("Stopped by user")
        print(f"Statistics:")
        print(f"   Success: {success_count}")
        print(f"   Errors: {error_count}")
        print(f"   Total: {success_count + error_count}")
        print("=" * 60)

if __name__ == "__main__":
    main()

