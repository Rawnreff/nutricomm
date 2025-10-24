#!/usr/bin/env python3
"""
Script untuk test login endpoint
Jalankan: python test_login.py
Pastikan server Flask sudah running!
"""

import requests
import json

# API Configuration
API_BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = f"{API_BASE_URL}/api/user/login"

def test_login(email, password):
    """Test login dengan email dan password"""
    print(f"\n🔐 Testing login for: {email}")
    print("-" * 60)
    
    try:
        # Prepare login data
        login_data = {
            "email": email,
            "password": password
        }
        
        # Send POST request
        response = requests.post(
            LOGIN_ENDPOINT,
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        # Parse response
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200 and "success" in result:
            print("✅ Login successful!")
            if "user" in result:
                user = result["user"]
                print(f"\n👤 User Info:")
                print(f"   ID: {user.get('_id', 'N/A')}")
                print(f"   Nama: {user.get('nama', 'N/A')}")
                print(f"   Email: {user.get('email', 'N/A')}")
                print(f"   Username: {user.get('username', 'N/A')}")
                print(f"   Role: {user.get('role', 'N/A')}")
                print(f"   Kebun ID: {user.get('kebun_id', 'N/A')}")
        else:
            print("❌ Login failed!")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error! Make sure the Flask server is running.")
        print(f"   Server should be at: {API_BASE_URL}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("-" * 60)

def main():
    print("=" * 60)
    print("🧪 LOGIN API TEST")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(API_BASE_URL, timeout=2)
        print(f"✅ Server is running at {API_BASE_URL}")
    except:
        print(f"❌ Server is NOT running at {API_BASE_URL}")
        print("   Please start the server first: python run.py")
        return
    
    # Test valid login
    test_login("budi@nutricomm.com", "password123")
    
    # Test admin login
    test_login("admin@nutricomm.com", "admin123")
    
    # Test invalid login
    print("\n🔴 Testing invalid credentials...")
    test_login("wrong@email.com", "wrongpassword")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()

