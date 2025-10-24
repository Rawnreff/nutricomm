"""
Backend Endpoint Tester
Test apakah backend siap menerima data dari ESP32
"""

import requests
from datetime import datetime

# GANTI dengan IP laptop Anda
BACKEND_IP = "10.218.18.170"
BACKEND_PORT = 5000
BASE_URL = f"http://{BACKEND_IP}:{BACKEND_PORT}"

def test_health():
    """Test /api/sensors/health"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    url = f"{BASE_URL}/api/sensors/health"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n[PASS] HEALTH CHECK PASSED")
            print(f"MongoDB Status: {data.get('mongodb')}")
            print(f"Data Count: {data.get('data_count')}")
            print(f"History Count: {data.get('history_count')}")
            print(f"Update Counter: {data.get('update_counter')}")
            print(f"Mode: {data.get('mode')}")
            return True
        else:
            print(f"\n[FAIL] HEALTH CHECK FAILED")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] CONNECTION ERROR")
        print(f"Backend tidak bisa diakses di {url}")
        print("Pastikan Flask backend sudah running!")
        return False
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        return False

def test_get_data():
    """Test /api/sensors/data"""
    print("\n" + "="*60)
    print("TEST 2: Get Latest Sensor Data")
    print("="*60)
    
    url = f"{BASE_URL}/api/sensors/data"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n[PASS] GET DATA PASSED")
            print(f"Kebun ID: {data.get('id_kebun')}")
            print(f"Suhu: {data.get('suhu')}°C")
            print(f"Kelembapan Udara: {data.get('kelembapan_udara')}%")
            print(f"Kelembapan Tanah: {data.get('kelembapan_tanah')}%")
            print(f"Cahaya: {data.get('cahaya')} lux")
            print(f"CO2: {data.get('co2')} ppm")
            print(f"Timestamp: {data.get('timestamp')}")
            return True
        elif response.status_code == 404:
            print("\n[INFO] NO DATA YET")
            print("Belum ada data sensor di database")
            print("Ini normal jika ESP32 belum mengirim data")
            return True  # Still OK, just no data yet
        else:
            print(f"\n[FAIL] GET DATA FAILED")
            return False
            
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        return False

def test_post_data():
    """Test /api/sensors/save"""
    print("\n" + "="*60)
    print("TEST 3: Post Sensor Data (Simulasi ESP32)")
    print("="*60)
    
    url = f"{BASE_URL}/api/sensors/save"
    print(f"URL: {url}")
    
    # Test data
    test_data = {
        "id_kebun": "KBG001",
        "suhu": 28.5,
        "kelembapan_udara": 65.0,
        "kelembapan_tanah": 45.0,
        "cahaya": 700,
        "co2": 400,
        "timestamp": datetime.now().isoformat()
    }
    
    print(f"\nSending test data:")
    for key, value in test_data.items():
        print(f"  {key}: {value}")
    
    try:
        response = requests.post(url, json=test_data, timeout=5)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n[PASS] POST DATA PASSED")
            print(f"Message: {data.get('message')}")
            print(f"Document ID: {data.get('id')}")
            print(f"Update Counter: {data.get('update_counter')}")
            print(f"Next History Save: {data.get('next_history_save')}")
            print(f"Action: {data.get('action')}")
            return True
        else:
            print(f"\n[FAIL] POST DATA FAILED")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        return False

def test_history():
    """Test /api/sensors/history"""
    print("\n" + "="*60)
    print("TEST 4: Get Sensor History")
    print("="*60)
    
    url = f"{BASE_URL}/api/sensors/history?kebun_id=KBG001&limit=5"
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            history_data = data.get('history_data', [])
            print(f"\n[PASS] GET HISTORY PASSED")
            print(f"Total Records: {data.get('count')}")
            
            if len(history_data) > 0:
                print(f"\nLatest 5 records:")
                for i, record in enumerate(history_data[:5], 1):
                    print(f"\n  {i}. Timestamp: {record.get('timestamp')}")
                    print(f"     Suhu: {record.get('suhu')}°C")
                    print(f"     Kelembapan Udara: {record.get('kelembapan_udara')}%")
            else:
                print("\nNo history data yet (normal jika baru setup)")
            
            return True
        else:
            print(f"\n[FAIL] GET HISTORY FAILED")
            return False
            
    except Exception as e:
        print(f"\n[ERROR]: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("BACKEND ENDPOINT TESTER - Nutricomm")
    print("="*60)
    print(f"Backend: {BASE_URL}")
    print(f"Testing semua endpoint untuk ESP32 integration")
    print("="*60)
    
    results = []
    
    # Run all tests
    results.append(("Health Check", test_health()))
    results.append(("Get Latest Data", test_get_data()))
    results.append(("Post Data (ESP32 Simulation)", test_post_data()))
    results.append(("Get History", test_history()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = 0
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{test_name:<35} {status}")
        if result:
            passed += 1
    
    print("="*60)
    print(f"Total: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\nALL TESTS PASSED!")
        print("\nBackend siap menerima data dari ESP32!")
        print("\nNext steps:")
        print("1. Upload code ke ESP32 (lihat ESP32_INTEGRATION.md)")
        print("2. Atau test dengan: python test_esp32_send.py")
    else:
        print("\nSOME TESTS FAILED")
        print("\nTroubleshooting:")
        print("1. Pastikan Flask backend sudah running")
        print("2. Pastikan MongoDB sudah running")
        print("3. Cek IP address: http://10.218.18.170:5000")
        print("4. Cek firewall Windows")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    main()

