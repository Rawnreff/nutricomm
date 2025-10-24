from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# kita akan inisialisasi socketio di sini (disediakan oleh run.py)
socketio = None  # akan di-assign di run.py saat create_app dipanggil

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "nutricomm"
COLLECTION_NAME = "sensor_data"
HISTORY_COLLECTION_NAME = "sensor_history"

# Global MongoDB client
mongo_client = None
collection = None
history_collection = None

# Counter untuk history
update_counter = 0

def init_mongodb():
    global mongo_client, collection, history_collection
    try:
        mongo_client = MongoClient(MONGO_URI)
        db = mongo_client[DB_NAME]
        collection = db[COLLECTION_NAME]
        history_collection = db[HISTORY_COLLECTION_NAME]
        print("✅ Connected to MongoDB")
        
        # Create index untuk performa query
        collection.create_index([("id_kebun", 1), ("timestamp", -1)])
        history_collection.create_index([("id_kebun", 1), ("timestamp", -1)])
        
        # Create indexes untuk notifikasi collection
        notifikasi_collection = db['notifikasi']
        notifikasi_collection.create_index([("user_id", 1), ("created_at", -1)])
        notifikasi_collection.create_index([("kebun_id", 1), ("created_at", -1)])
        notifikasi_collection.create_index([("user_id", 1), ("is_read", 1)])
        # Index untuk duplikasi check (compound index)
        notifikasi_collection.create_index([
            ("user_id", 1), 
            ("kebun_id", 1), 
            ("kategori", 1), 
            ("tingkat", 1),
            ("created_at", -1)
        ])
        
        print("✅ MongoDB indexes created")
        
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")

def save_sensor_data(data):
    """Save sensor data to MongoDB - UPDATE data terakhir, dan simpan history setiap 2 menit"""
    global update_counter
    
    if collection is None or history_collection is None:
        print("❌ MongoDB not initialized")
        return None
    
    try:
        # Ensure proper timestamp format
        if 'timestamp' in data:
            # Convert to ISO format if needed
            if ' ' in data['timestamp']:  # Format: "2025-10-20 12:00:00"
                data['timestamp'] = data['timestamp'].replace(' ', 'T')
        
        kebun_id = data.get('id_kebun', 'KBG001')
        
        # Cek apakah sudah ada data untuk kebun ini
        existing_doc = collection.find_one({'id_kebun': kebun_id})
        
        if existing_doc:
            # ✅ UPDATE data existing
            result = collection.update_one(
                {'_id': existing_doc['_id']},
                {'$set': data}
            )
            print(f"🔄 Data UPDATED in MongoDB. Matched: {result.matched_count}, Modified: {result.modified_count}")
            
            # 🔥 INCREMENT COUNTER dan CEK APAKAH SUDAH 120 UPDATE
            update_counter += 1
            print(f"📊 Update counter: {update_counter}/120")
            
            # Jika sudah 120 update (2 menit), simpan ke history
            if update_counter >= 120:
                save_to_history(data)
                update_counter = 0  # Reset counter
            
            return existing_doc['_id']
        else:
            # ✅ INSERT data baru jika belum ada
            result = collection.insert_one(data)
            print(f"💾 New data INSERTED to MongoDB with id: {result.inserted_id}")
            
            # Simpan juga ke history untuk data pertama
            save_to_history(data)
            update_counter = 0  # Reset counter
            
            return result.inserted_id
            
    except Exception as e:
        print(f"❌ MongoDB save error: {e}")
        return None

def save_to_history(data):
    """Save data to history collection (setiap 2 menit)"""
    try:
        # Buat copy data untuk history
        history_data = data.copy()
        
        # Tambah field history_timestamp
        history_data['history_timestamp'] = datetime.now().isoformat()
        history_data['saved_as_history'] = True
        
        # Simpan ke history collection
        result = history_collection.insert_one(history_data)
        print(f"📚 Data saved to HISTORY collection (id: {result.inserted_id})")
        print(f"⏰ History saved at: {history_data['history_timestamp']}")
        
        return result.inserted_id
    except Exception as e:
        print(f"❌ Error saving to history: {e}")
        return None

def get_latest_sensor_data(kebun_id="KBG001"):
    """Get latest sensor data from MongoDB"""
    if collection is None:
        return None
    
    try:
        latest_data = collection.find_one(
            {'id_kebun': kebun_id},
            sort=[('timestamp', -1)]
        )
        return latest_data
    except Exception as e:
        print(f"❌ MongoDB query error: {e}")
        return None

def get_sensor_history(kebun_id="KBG001", limit=100):
    """Get sensor history data"""
    if history_collection is None:
        return []
    
    try:
        history_data = list(history_collection.find(
            {'id_kebun': kebun_id},
            sort=[('timestamp', -1)]
        ).limit(limit))
        
        return history_data
    except Exception as e:
        print(f"❌ MongoDB history query error: {e}")
        return []

def get_update_counter():
    """Get current update counter value"""
    global update_counter
    return update_counter

def reset_update_counter():
    """Reset update counter (for testing)"""
    global update_counter
    update_counter = 0
    print("🔄 Update counter reset to 0")

# Factory function untuk membuat app Flask
def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize MongoDB
    init_mongodb()

    # Import dan register blueprint
    from app.routes.sensors import sensors_bp
    from app.routes.absensi import absensi_bp
    from app.routes.aktivitas import aktivitas_bp
    from app.routes.user import user_bp
    from app.routes.kebun import kebun_bp
    from app.routes.notifikasi import notifikasi_bp

    app.register_blueprint(sensors_bp, url_prefix="/api/sensors")
    app.register_blueprint(absensi_bp, url_prefix="/api/absensi")
    app.register_blueprint(aktivitas_bp, url_prefix="/api/aktivitas")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(kebun_bp, url_prefix="/api/kebun")
    app.register_blueprint(notifikasi_bp)

    print("✅ Running in REAL DATA mode - No dummy data")
    print("⏰ History saving: EVERY 2 MINUTES (120 updates)")

    return app

# Export functions untuk diimport di file lain
__all__ = [
    'socketio', 
    'mongo_client', 
    'collection', 
    'history_collection',
    'init_mongodb', 
    'save_sensor_data', 
    'get_latest_sensor_data',
    'get_sensor_history',
    'get_update_counter',
    'reset_update_counter',
    'save_to_history'
]