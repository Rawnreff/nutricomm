p#!/usr/bin/env python3
"""
Script untuk test kebun API endpoints
Jalankan: python test_kebun_api.py
Pastikan server Flask sudah running!
"""

import requests
import json

# API Configuration
API_BASE_URL = "http://localhost:5000"
KEBUN_ENDPOINT = f"{API_BASE_URL}/api/kebun"

def test_create_kebun():
    """Test create kebun"""
    print(f"\n📝 Testing CREATE Kebun")
    print("-" * 60)
    
    try:
        # Test kebun data
        kebun_data = {
            "id_kebun": "KBG999",
            "nama_kebun": "Kebun Test API",
            "lokasi": "Jakarta Utara",
            "luas": "40 m²",
            "jenis_tanaman": ["Test Plant 1", "Test Plant 2"],
            "deskripsi": "Kebun untuk testing API"
        }
        
        response = requests.post(
            KEBUN_ENDPOINT,
            json=kebun_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 201 and "success" in result:
            print("✅ Kebun created successfully!")
        else:
            print("❌ Failed to create kebun!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("-" * 60)

def test_get_all_kebun():
    """Test get all kebun"""
    print(f"\n📋 Testing GET All Kebun")
    print("-" * 60)
    
    try:
        response = requests.get(KEBUN_ENDPOINT)
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ Found {result.get('count', 0)} kebun")
            if result.get('kebun'):
                for kebun in result['kebun']:
                    print(f"\n  - {kebun.get('id_kebun')}: {kebun.get('nama_kebun')}")
                    print(f"    Lokasi: {kebun.get('lokasi')}")
                    print(f"    Luas: {kebun.get('luas')}")
        else:
            print("❌ Failed to get kebun!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("-" * 60)

def test_get_kebun_by_id():
    """Test get kebun by ID"""
    print(f"\n🔍 Testing GET Kebun by ID (KBG001)")
    print("-" * 60)
    
    try:
        response = requests.get(f"{KEBUN_ENDPOINT}/by-id/KBG001")
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200 and "kebun" in result:
            print("✅ Kebun found!")
        else:
            print("❌ Kebun not found!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("-" * 60)

def main():
    print("=" * 60)
    print("🧪 KEBUN API TEST")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(API_BASE_URL, timeout=2)
        print(f"✅ Server is running at {API_BASE_URL}")
    except:
        print(f"❌ Server is NOT running at {API_BASE_URL}")
        print("   Please start the server first: python run.py")
        return
    
    # Run tests
    test_get_all_kebun()
    test_get_kebun_by_id()
    test_create_kebun()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)
    
    print("\n📝 Example Postman Request:")
    print("POST http://localhost:5000/api/kebun")
    print("Content-Type: application/json")
    print(json.dumps({
        "id_kebun": "KBG004",
        "nama_kebun": "Kebun Baru",
        "lokasi": "Jakarta",
        "luas": "50 m²",
        "jenis_tanaman": ["Bayam", "Kangkung"],
        "deskripsi": "Kebun untuk komunitas"
    }, indent=2))

if __name__ == "__main__":
    main()

