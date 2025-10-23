# check_mongodb.py
from pymongo import MongoClient
from datetime import datetime

def check_mongodb_data():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["nutricomm"]
        collection = db["sensor_data"]
        
        print("📊 Checking MongoDB data...")
        
        # Count total documents
        count = collection.count_documents({})
        print(f"   Total documents: {count}")
        
        # Get latest 5 documents
        latest_data = list(collection.find().sort("timestamp", -1).limit(5))
        
        print("   Latest 5 documents:")
        for i, doc in enumerate(latest_data):
            print(f"   {i+1}. {doc}")
        
        # Check if we have real sensor data
        real_data_count = collection.count_documents({
            "suhu": {"$ne": 28.5},  # Bukan data dummy default
            "kelembapan_udara": {"$ne": 65.0}
        })
        
        print(f"   Real sensor data documents: {real_data_count}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB check failed: {e}")

if __name__ == "__main__":
    check_mongodb_data()