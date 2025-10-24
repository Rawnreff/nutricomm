"""
Test script untuk API Notifikasi
Pastikan backend sedang berjalan di http://localhost:5000
"""

import requests
import json
from datetime import datetime

# Backend URL
BACKEND_URL = "http://localhost:5000"

def test_create_notifikasi():
    """Test membuat notifikasi baru"""
    print("\n🧪 TEST 1: Create Notifikasi")
    print("-" * 50)
    
    url = f"{BACKEND_URL}/api/notifikasi/"
    
    data = {
        "user_id": "USR001",
        "kebun_id": "KBG001",
        "jenis": "sensor",
        "kategori": "kelembapan_tanah",
        "judul": "Test: Kelembapan Tanah Rendah",
        "pesan": "💧 Ini adalah test notifikasi - Kelembapan tanah rendah (25%)",
        "tingkat": "warning",
        "icon": "water",
        "sensor_data": {
            "kelembapan_tanah": 25.5,
            "suhu": 28.3,
            "kelembapan_udara": 65.2,
            "cahaya": 5000,
            "co2": 450,
            "timestamp": datetime.now().isoformat()
        }
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        if result.get('success'):
            print("✅ SUCCESS: Notifikasi berhasil dibuat!")
            print(f"   ID: {result.get('id_notifikasi')}")
            return result.get('id_notifikasi')
        else:
            print(f"❌ FAILED: {result.get('error')}")
            return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def test_get_user_notifikasi(user_id="USR001"):
    """Test mendapatkan notifikasi user"""
    print("\n🧪 TEST 2: Get User Notifikasi")
    print("-" * 50)
    
    url = f"{BACKEND_URL}/api/notifikasi/user/{user_id}?limit=5"
    
    try:
        response = requests.get(url)
        result = response.json()
        
        if result.get('success'):
            print(f"✅ SUCCESS: Ditemukan {len(result.get('notifikasi', []))} notifikasi")
            print(f"   Unread count: {result.get('unread_count')}")
            
            # Tampilkan 3 notifikasi terakhir
            for idx, notif in enumerate(result.get('notifikasi', [])[:3], 1):
                print(f"\n   Notifikasi {idx}:")
                print(f"   - Judul: {notif.get('judul')}")
                print(f"   - Pesan: {notif.get('pesan')}")
                print(f"   - Tingkat: {notif.get('tingkat')}")
                print(f"   - Dibaca: {'Ya' if notif.get('is_read') else 'Tidak'}")
        else:
            print(f"❌ FAILED: {result.get('error')}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_mark_as_read(id_notifikasi):
    """Test mark notifikasi as read"""
    print("\n🧪 TEST 3: Mark As Read")
    print("-" * 50)
    
    if not id_notifikasi:
        print("⚠️  SKIPPED: Tidak ada ID notifikasi")
        return
    
    url = f"{BACKEND_URL}/api/notifikasi/{id_notifikasi}/read"
    
    try:
        response = requests.put(url)
        result = response.json()
        
        if result.get('success'):
            print(f"✅ SUCCESS: {result.get('message')}")
        else:
            print(f"❌ FAILED: {result.get('error')}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_get_unread_count(user_id="USR001"):
    """Test mendapatkan unread count"""
    print("\n🧪 TEST 4: Get Unread Count")
    print("-" * 50)
    
    url = f"{BACKEND_URL}/api/notifikasi/user/{user_id}/unread-count"
    
    try:
        response = requests.get(url)
        result = response.json()
        
        if result.get('success'):
            print(f"✅ SUCCESS: Unread count = {result.get('unread_count')}")
        else:
            print(f"❌ FAILED: {result.get('error')}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_create_multiple_notifikasi():
    """Test membuat beberapa notifikasi dengan kategori berbeda"""
    print("\n🧪 TEST 5: Create Multiple Notifikasi")
    print("-" * 50)
    
    notifikasi_list = [
        {
            "kategori": "co2",
            "judul": "Test: CO₂ Tinggi",
            "pesan": "🌬️ Test - CO₂ terlalu tinggi (1200 ppm)",
            "tingkat": "critical",
            "icon": "cloud"
        },
        {
            "kategori": "suhu",
            "judul": "Test: Suhu Tinggi",
            "pesan": "🌡️ Test - Suhu terlalu tinggi (38°C)",
            "tingkat": "critical",
            "icon": "thermometer"
        },
        {
            "kategori": "cahaya",
            "judul": "Test: Cahaya Kurang",
            "pesan": "💡 Test - Cahaya kurang (800 lux)",
            "tingkat": "info",
            "icon": "bulb"
        }
    ]
    
    success_count = 0
    
    for notif_data in notifikasi_list:
        url = f"{BACKEND_URL}/api/notifikasi/"
        
        data = {
            "user_id": "USR001",
            "kebun_id": "KBG001",
            "jenis": "sensor",
            **notif_data,
            "sensor_data": {
                "kelembapan_tanah": 45.0,
                "suhu": 38.0,
                "kelembapan_udara": 70.0,
                "cahaya": 800,
                "co2": 1200,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        try:
            response = requests.post(url, json=data)
            result = response.json()
            
            if result.get('success'):
                success_count += 1
                print(f"✅ {notif_data['judul']}")
            else:
                print(f"❌ {notif_data['judul']}: {result.get('error')}")
        except Exception as e:
            print(f"❌ {notif_data['judul']}: {e}")
    
    print(f"\n📊 Berhasil membuat {success_count}/{len(notifikasi_list)} notifikasi")

def main():
    print("=" * 50)
    print("🧪 TEST SUITE: API NOTIFIKASI")
    print("=" * 50)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Waktu Test: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Create notifikasi
    id_notifikasi = test_create_notifikasi()
    
    # Test 2: Get user notifikasi
    test_get_user_notifikasi()
    
    # Test 3: Mark as read
    test_mark_as_read(id_notifikasi)
    
    # Test 4: Get unread count
    test_get_unread_count()
    
    # Test 5: Create multiple notifikasi
    test_create_multiple_notifikasi()
    
    # Final: Get user notifikasi lagi
    print("\n🧪 FINAL CHECK: Get User Notifikasi")
    print("-" * 50)
    test_get_user_notifikasi()
    
    print("\n" + "=" * 50)
    print("✅ TEST SUITE SELESAI")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test dibatalkan oleh user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")





