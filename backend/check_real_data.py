# check_real_data.py
from pymongo import MongoClient
from datetime import datetime

def check_real_data():
    try:
        client = MongoClient("mongodb://localhost:27017/")
        db = client["nutricomm"]
        collection = db["sensor_data"]
        
        print("📊 Checking for REAL ESP32 data in MongoDB...")
        
        # Get latest 3 documents
        latest_data = list(collection.find().sort("timestamp", -1).limit(3))
        
        print("Latest documents:")
        for i, doc in enumerate(latest_data):
            print(f"\n{i+1}. {doc}")
            
            # Check if it's real data (not dummy)
            if doc.get('suhu') != 28.5 or doc.get('kelembapan_udara') != 65.0:
                print("   ✅ THIS IS REAL ESP32 DATA!")
            else:
                print("   ⚠️  This might be dummy data")
        
        # Count real vs dummy data
        total_count = collection.count_documents({})
        real_count = collection.count_documents({
            "$or": [
                {"suhu": {"$ne": 28.5}},
                {"kelembapan_udara": {"$ne": 65.0}},
                {"kelembapan_tanah": {"$ne": 45.0}}
            ]
        })
        
        print(f"\n📈 Statistics:")
        print(f"   Total documents: {total_count}")
        print(f"   Real ESP32 data: {real_count}")
        print(f"   Dummy data: {total_count - real_count}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB check failed: {e}")

if __name__ == "__main__":
    check_real_data()