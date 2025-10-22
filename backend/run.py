# # run.py
# from flask import Flask
# from flask_sock import Sock
# import paho.mqtt.client as mqtt
# import json

# app = Flask(__name__)
# sock = Sock(app)

# # =============== MQTT CONFIG ===============
# MQTT_BROKER = "10.218.19.4"
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

# Buat app terlebih dahulu
app = create_app()

# Baru buat SocketIO instance
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Sekarang assign socketio ke app package
from app import socketio as app_socketio
app_socketio = socketio

# Import dan initialize MQTT handler SETELAH socketio dibuat
from app.mqtt_handler import init_mqtt
print("🔄 Initializing MQTT handler...")
init_mqtt(app, socketio)

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
    from app.mqtt_handler import sensor_data as mqtt_sensor_data
    from app import get_latest_sensor_data
    
    latest_db = get_latest_sensor_data()
    return {
        "mqtt_data": mqtt_sensor_data,
        "latest_db_data": latest_db,
        "message": "Check MQTT status"
    }

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
    </ul>
    """

if __name__ == '__main__':
    print("🚀 Starting Nutricomm Server with MongoDB...")
    print("📊 Data will be UPDATED in MongoDB (not inserted)")
    print("🔌 MQTT Topic: nutricomm/sensor/#")
    print("🌐 WebSocket Server running on:")
    print("   - http://localhost:5000")
    print("   - http://10.218.19.4:5000") 
    print("   - http://192.168.137.1:5000")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)