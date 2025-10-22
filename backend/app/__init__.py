# from flask import Flask
# from flask_cors import CORS
# from threading import Thread
# import time
# import random

# # kita akan inisialisasi socketio di sini (disediakan oleh run.py)
# socketio = None  # akan di-assign di run.py saat create_app dipanggil

# def start_dummy_thread(app):
#     def generate_data():
#         with app.app_context():
#             from app.routes.sensors import sensor_data
#             while True:
#                 # Update data sensor setiap 5 detik
#                 sensor_data['suhu'] = round(random.uniform(25, 32), 1)
#                 sensor_data['kelembapan_udara'] = round(random.uniform(50, 80), 1)
#                 sensor_data['kelembapan_tanah'] = round(random.uniform(30, 70), 1)
#                 sensor_data['cahaya'] = round(random.uniform(100, 900), 1)
#                 sensor_data['co2'] = round(random.uniform(300, 800), 1)
#                 sensor_data['timestamp'] = time.strftime("%Y-%m-%d %H:%M:%S")
#                 # If socketio available, emit update as well
#                 try:
#                     if socketio:
#                         socketio.emit("sensor_update", sensor_data, namespace="/")
#                 except Exception as e:
#                     print("Emit dummy error:", e)
#                 time.sleep(5)

#     thread = Thread(target=generate_data)
#     thread.daemon = True
#     thread.start()

# # Factory function untuk membuat app Flask
# def create_app():
#     app = Flask(__name__)
#     CORS(app)

#     # Import dan register blueprint
#     from app.routes.sensors import sensors_bp
#     from app.routes.absensi import absensi_bp
#     from app.routes.aktivitas import aktivitas_bp
#     from app.routes.user import user_bp

#     app.register_blueprint(sensors_bp, url_prefix="/api/sensors")
#     app.register_blueprint(absensi_bp, url_prefix="/api/absensi")
#     app.register_blueprint(aktivitas_bp, url_prefix="/api/aktivitas")
#     app.register_blueprint(user_bp, url_prefix="/api/user")

#     # Jalankan dummy thread setelah app dibuat
#     start_dummy_thread(app)

#     return app

from flask import Flask
from flask_cors import CORS
from threading import Thread
import time
import random
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# kita akan inisialisasi socketio di sini (disediakan oleh run.py)
socketio = None  # akan di-assign di run.py saat create_app dipanggil

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "nutricomm"
COLLECTION_NAME = "sensor_data"

# Global MongoDB client
mongo_client = None
collection = None

def init_mongodb():
    global mongo_client, collection
    try:
        mongo_client = MongoClient(MONGO_URI)
        db = mongo_client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print("✅ Connected to MongoDB")
        
        # Create index untuk performa query
        collection.create_index([("id_kebun", 1), ("timestamp", -1)])
        print("✅ MongoDB index created")
        
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")

def save_sensor_data(data):
    """Save sensor data to MongoDB - INSERT jika belum ada, UPDATE jika sudah ada"""
    if collection is None:
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
            return existing_doc['_id']
        else:
            # ✅ INSERT data baru jika belum ada
            result = collection.insert_one(data)
            print(f"💾 New data INSERTED to MongoDB with id: {result.inserted_id}")
            return result.inserted_id
            
    except Exception as e:
        print(f"❌ MongoDB save error: {e}")
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

def start_dummy_thread(app):
    def generate_data():
        with app.app_context():
            from app.routes.sensors import sensor_data
            while True:
                # Update data sensor setiap 5 detik
                sensor_data['suhu'] = round(random.uniform(25, 32), 1)
                sensor_data['kelembapan_udara'] = round(random.uniform(50, 80), 1)
                sensor_data['kelembapan_tanah'] = round(random.uniform(30, 70), 1)
                sensor_data['cahaya'] = round(random.uniform(100, 900), 1)
                sensor_data['co2'] = round(random.uniform(300, 800), 1)
                sensor_data['timestamp'] = datetime.now().isoformat()  # ISO format
                
                # SIMPAN ke MongoDB (bisa insert atau update)
                save_sensor_data(sensor_data.copy())
                
                # If socketio available, emit update as well
                try:
                    if socketio:
                        socketio.emit("sensor_update", sensor_data)
                        print("📢 Dummy data emitted via WebSocket")
                except Exception as e:
                    print("Emit dummy error:", e)
                time.sleep(5)

    thread = Thread(target=generate_data)
    thread.daemon = True
    thread.start()

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

    app.register_blueprint(sensors_bp, url_prefix="/api/sensors")
    app.register_blueprint(absensi_bp, url_prefix="/api/absensi")
    app.register_blueprint(aktivitas_bp, url_prefix="/api/aktivitas")
    app.register_blueprint(user_bp, url_prefix="/api/user")

    # Jalankan dummy thread setelah app dibuat
    start_dummy_thread(app)

    return app

# Export functions untuk diimport di file lain
__all__ = [
    'socketio', 
    'mongo_client', 
    'collection', 
    'init_mongodb', 
    'save_sensor_data', 
    'get_latest_sensor_data'
]