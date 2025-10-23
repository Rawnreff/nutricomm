# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    
    # MQTT Configuration
    MQTT_BROKER_URL = os.getenv('MQTT_BROKER_URL', 'localhost')
    MQTT_BROKER_PORT = int(os.getenv('MQTT_BROKER_PORT', 1883))
    MQTT_TOPIC = os.getenv('MQTT_TOPIC', 'nutricomm/#')
    
    # 🔥 GLOBAL IP CONFIGURATION
    GLOBAL_IP = os.getenv('GLOBAL_IP', 'localhost')
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # WebSocket/SocketIO config
    SOCKETIO_ASYNC_MODE = 'threading'

# Export config instance
config = Config()

# Helper functions untuk mendapatkan IP
def get_global_ip():
    return config.GLOBAL_IP

def get_flask_host():
    return config.FLASK_HOST

def get_flask_port():
    return config.FLASK_PORT

def get_mqtt_broker_url():
    return config.MQTT_BROKER_URL

def get_mqtt_broker_port():
    return config.MQTT_BROKER_PORT