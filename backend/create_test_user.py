#!/usr/bin/env python3
"""
Script untuk membuat test user di database MongoDB
Jalankan: python create_test_user.py
"""

from pymongo import MongoClient
from app.models.user_model import UserModel

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "nutricomm"

def create_test_users():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Initialize UserModel
        user_model = UserModel(db)
        
        # Test users data - sesuai dengan DUMMY_USERS di frontend
        test_users = [
            {
                "nama": "Keluarga Budi Santoso",
                "email": "budi@nutricomm.com",
                "username": "budi",
                "password": "password123",
                "role": "user",
                "kebun_id": "KBG001"
            },
            {
                "nama": "Keluarga Sari Indah",
                "email": "sari@nutricomm.com",
                "username": "sari",
                "password": "password123",
                "role": "user",
                "kebun_id": "KBG001"
            },
            {
                "nama": "Keluarga Ahmad Wijaya",
                "email": "ahmad@nutricomm.com",
                "username": "ahmad",
                "password": "password123",
                "role": "user",
                "kebun_id": "KBG001"
            },
            {
                "nama": "Keluarga Maya Sari",
                "email": "maya@nutricomm.com",
                "username": "maya",
                "password": "password123",
                "role": "user",
                "kebun_id": "KBG001"
            },
            {
                "nama": "Keluarga Rina Permata",
                "email": "rina@nutricomm.com",
                "username": "rina",
                "password": "password123",
                "role": "user",
                "kebun_id": "KBG001"
            },
            {
                "nama": "Admin User",
                "email": "admin@nutricomm.com",
                "username": "admin",
                "password": "admin123",
                "role": "admin",
                "kebun_id": "KBG001"
            }
        ]
        
        print("🔄 Creating test users...")
        print("-" * 60)
        
        for user_data in test_users:
            result = user_model.create_user(user_data)
            
            if "success" in result:
                print(f"✅ User created: {user_data['email']}")
                print(f"   Name: {user_data['nama']}")
                print(f"   Username: {user_data['username']}")
                print(f"   Password: {user_data['password']}")
            elif "already registered" in result.get("error", "").lower() or "already taken" in result.get("error", "").lower():
                print(f"ℹ️  User already exists: {user_data['email']}")
            else:
                print(f"❌ Failed to create user: {user_data['email']}")
                print(f"   Error: {result.get('error', 'Unknown error')}")
            
            print("-" * 60)
        
        print("\n✅ Test users setup complete!")
        print("\n📝 You can now login with:")
        print("   Email: budi@nutricomm.com | Password: password123")
        print("   Email: admin@nutricomm.com | Password: admin123")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_users()

