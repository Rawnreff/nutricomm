# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# ==================================================================================
# 🔧 KONFIGURASI IP LAPTOP - UBAH HANYA DI SINI!
# ==================================================================================
# Ketika IP laptop berubah, cukup ubah nilai DEFAULT_LAPTOP_IP di bawah ini:

DEFAULT_LAPTOP_IP = '192.168.1.5'  # ← UBAH IP DI SINI SAJA
DEFAULT_PORT = 5000

# CATATAN: IP akan diambil LANGSUNG dari variabel di atas.
# Tidak akan terpengaruh oleh environment variable atau file .env
# Ini memastikan IP selalu sesuai dengan yang Anda set di file ini.

# ==================================================================================

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    
    # MQTT Configuration
    MQTT_BROKER_URL = os.getenv('MQTT_BROKER_URL', 'localhost')
    MQTT_BROKER_PORT = int(os.getenv('MQTT_BROKER_PORT', 1883))
    MQTT_TOPIC = os.getenv('MQTT_TOPIC', 'nutricomm/#')
    
    # 🔥 GLOBAL IP CONFIGURATION
    # LANGSUNG gunakan DEFAULT_LAPTOP_IP (tidak cek .env untuk IP)
    GLOBAL_IP = DEFAULT_LAPTOP_IP
    FLASK_HOST = '0.0.0.0'  # Listen on all interfaces
    FLASK_PORT = DEFAULT_PORT
    
    # WebSocket/SocketIO config
    SOCKETIO_ASYNC_MODE = 'threading'

# Export config instance
config = Config()

# Helper functions untuk mendapatkan IP dan URL
def get_global_ip():
    """Mendapatkan IP global laptop"""
    return config.GLOBAL_IP

def get_flask_host():
    """Mendapatkan host Flask server (default: 0.0.0.0 untuk listen semua interface)"""
    return config.FLASK_HOST

def get_flask_port():
    """Mendapatkan port Flask server"""
    return config.FLASK_PORT

def get_backend_url():
    """Mendapatkan URL lengkap backend untuk testing/client"""
    return f"http://{config.GLOBAL_IP}:{config.FLASK_PORT}"

def get_backend_base_url():
    """Alias untuk get_backend_url()"""
    return get_backend_url()

def get_mqtt_broker_url():
    """Mendapatkan URL MQTT broker"""
    return config.MQTT_BROKER_URL

def get_mqtt_broker_port():
    """Mendapatkan port MQTT broker"""
    return config.MQTT_BROKER_PORT