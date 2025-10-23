# # run.py
# from flask import Flask
# from flask_sock import Sock
# import paho.mqtt.client as mqtt
# import json

# app = Flask(__name__)
# sock = Sock(app)

# # =============== MQTT CONFIG ===============
# MQTT_BROKER = "10.218.22.169"
# MQTT_PORT = 1883
# MQTT_TOPIC = "nutricomm/sensor"

# latest_data = {}

# # =============== MQTT CALLBACK ===============
# def on_connect(client, userdata, flags, rc):
#     print("[MQTT] Connected with result code", rc)
#     client.subscribe(MQTT_TOPIC)

# def on_message(client, userdata, msg):
#     global latest_data
#     data = json.loads(msg.payload.decode())
#     latest_data = data
#     print("[MQTT] Received:", latest_data)
#     # Kirim data ke semua client WebSocket
#     for ws in list(clients):
#         try:
#             ws.send(json.dumps(latest_data))
#         except:
#             clients.remove(ws)

# # =============== MQTT CLIENT ===============
# client = mqtt.Client()
# client.on_connect = on_connect
# client.on_message = on_message
# client.connect(MQTT_BROKER, MQTT_PORT, 60)
# client.loop_start()

# # =============== WEBSOCKET HANDLER ===============
# clients = []

# @sock.route('/ws/sensor')
# def sensor_socket(ws):
#     clients.append(ws)
#     print("[WebSocket] Client connected")
#     while True:
#         data = ws.receive()
#         if data is None:
#             break
#     clients.remove(ws)
#     print("[WebSocket] Client disconnected")

# # =============== HTTP TEST ROUTE ===============
# @app.route('/')
# def home():
#     return {"message": "Nutricomm backend is running!", "websocket": "/ws/sensor"}

# # =============== RUN SERVER ===============
# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000)




from app import create_app
from flask_socketio import SocketIO
import os
import time
import random
import string
import atexit
import signal
import sys
import json

# Generate unique client ID untuk hindari conflict
def generate_client_id():
    return f"nutricomm-backend-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"

# Buat app terlebih dahulu
app = create_app()

# Baru buat SocketIO instance
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Assign socketio ke app package
from app import socketio as app_socketio
app_socketio = socketio

# Import dan initialize MQTT handler SETELAH socketio dibuat
print("🔄 Initializing MQTT handler...")
from app.mqtt_handler import init_mqtt

# 🔥 PASS CLIENT ID YANG UNIK ke init_mqtt
client_id = generate_client_id()
mqtt_client = init_mqtt(app, socketio, client_id=client_id)

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print('✅ Client connected via WebSocket')
    from app import get_latest_sensor_data
    # Kirim data terbaru saat client connect
    latest_data = get_latest_sensor_data()
    if latest_data:
        # Convert ObjectId untuk serialization
        latest_data['_id'] = str(latest_data['_id'])
        socketio.emit('sensor_update', latest_data)
        print("📡 Sent latest data to new client")

@socketio.on('disconnect')
def handle_disconnect():
    print('❌ Client disconnected from WebSocket')

@socketio.on('sensor_data')
def handle_sensor_data(data):
    print('📡 Sensor data via WebSocket:', data)
    # Broadcast ke semua clients
    socketio.emit('sensor_update', data)

@app.route('/mqtt-status')
def mqtt_status():
    from app.mqtt_handler import mqtt_connected, sensor_data as mqtt_sensor_data
    from app import get_latest_sensor_data
    
    latest_db = get_latest_sensor_data()
    
    # Cek koneksi MQTT client
    mqtt_info = "Unknown"
    if mqtt_client:
        try:
            mqtt_info = f"Connected: {mqtt_client.is_connected()}"
        except:
            mqtt_info = "Client exists but status unknown"
    
    return {
        "mqtt_connected": mqtt_connected,
        "mqtt_client_info": mqtt_info,
        "last_mqtt_data": mqtt_sensor_data,
        "latest_db_data": latest_db,
        "message": "MQTT Status"
    }

@app.route('/test-mqtt-publish')
def test_mqtt_publish():
    """Test publishing a message to see if backend can send/receive"""
    try:
        from app.mqtt_handler import mqtt_client
        
        test_data = {
            "id_kebun": "KBG001",
            "suhu": 25.5,
            "kelembapan_udara": 60.0,
            "kelembapan_tanah": 45.0,
            "cahaya": 500,
            "co2": 400,
            "timestamp": "2025-01-23T10:00:00"
        }
        
        if mqtt_client and mqtt_client.is_connected():
            result = mqtt_client.publish("nutricomm/test/backend", json.dumps(test_data))
            return {"message": f"Test message published (mid: {result.mid})"}
        else:
            return {"error": "MQTT client not connected"}, 500
            
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/')
def index():
    return """
    <h1>Nutricomm Server with MongoDB</h1>
    <p>WebSocket endpoints:</p>
    <ul>
        <li><code>/socket.io/</code> - Socket.IO endpoint</li>
        <li>Events: <code>sensor_update</code></li>
    </ul>
    <p>REST API endpoints:</p>
    <ul>
        <li><code>/api/sensors/data</code> - Latest data</li>
        <li><code>/api/sensors/history</code> - Historical data</li>
        <li><code>/api/sensors/statistics</code> - Statistics</li>
        <li><code>/mqtt-status</code> - MQTT Status</li>
        <li><code>/test-mqtt-publish</code> - Test MQTT</li>
    </ul>
    """

def shutdown_handler():
    print("\n🛑 Shutting down Nutricomm Server...")
    if mqtt_client:
        print("🔌 Disconnecting MQTT client...")
        mqtt_client.disconnect()
    print("✅ Server shutdown complete")

# Register shutdown handlers
atexit.register(shutdown_handler)

def signal_handler(sig, frame):
    print(f"\n🛑 Received signal {sig}. Shutting down...")
    shutdown_handler()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == '__main__':
    print("🚀 Starting Nutricomm Server - REAL DATA MODE")
    print("📊 ONLY real ESP32 data - No dummy data")
    print("🔌 MQTT Broker: 10.218.22.169:1883")
    print("📡 ESP32 Topic: nutricomm/sensor")
    print("🌐 WebSocket Server running on:")
    print("   - http://localhost:5000")
    print("   - http://10.218.22.169:5000")
    print(f"🔑 MQTT Client ID: {client_id}")
    
    try:
        # 🔥 GUNAKAN debug=False untuk production atau testing stability
        socketio.run(app, host='0.0.0.0', port=5000, debug=False)  # debug=False untuk hindari auto-restart
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
    finally:
        shutdown_handler()