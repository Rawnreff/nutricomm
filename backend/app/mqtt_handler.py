

# # app/mqtt_handler.py
# import paho.mqtt.client as mqtt
# import json
# from datetime import datetime

# sensor_data = {
#     "id_kebun": "KBG001",
#     "suhu": 0,
#     "kelembapan_udara": 0,
#     "kelembapan_tanah": 0,
#     "cahaya": 0,
#     "co2": 0,
#     "timestamp": ""
# }

# def init_mqtt(app, socketio):
#     # Import di dalam function untuk avoid circular imports
#     from app import save_sensor_data

#     client = mqtt.Client()
    
#     print("🔌 MQTT Client created")
#     print("📡 Subscribing to topic: nutricomm/sensor/#")

#     def on_connect(client, userdata, flags, rc):
#         if rc == 0:
#             print("✅ MQTT Connected successfully to broker")
#             client.subscribe("nutricomm/sensor/#")
#             print("✅ Subscribed to nutricomm/sensor/#")
#         else:
#             print(f"❌ MQTT Connection failed with result code {rc}")

#     def on_message(client, userdata, msg):
#         topic = msg.topic
#         payload = msg.payload.decode()

#         print(f"📨 MQTT Message received:")
#         print(f"   Topic: {topic}")
#         print(f"   Payload: {payload}")

#         if topic.startswith("nutricomm/sensor"):
#             try:
#                 data = json.loads(payload)
#                 print(f"   Parsed JSON: {data}")
                
#                 # Update sensor_data dengan data baru
#                 sensor_data.update(data)
                
#                 # Ensure id_kebun exists
#                 if 'id_kebun' not in sensor_data:
#                     sensor_data['id_kebun'] = "KBG001"
                
#                 # Add timestamp if not provided
#                 if 'timestamp' not in sensor_data or not sensor_data['timestamp']:
#                     sensor_data['timestamp'] = datetime.now().isoformat()
#                 else:
#                     # Ensure timestamp format consistency
#                     sensor_data['timestamp'] = sensor_data['timestamp'].replace(' ', 'T')
                
#                 print(f"💾 Attempting to save data to MongoDB...")
                
#                 # 💾 SIMPAN KE MONGODB (bisa INSERT atau UPDATE)
#                 result = save_sensor_data(sensor_data.copy())
                
#                 if result:
#                     print("✅ Data successfully SAVED in MongoDB")
#                     # 📢 Broadcast ke semua client WebSocket
#                     broadcast_data = sensor_data.copy()
#                     socketio.emit("sensor_update", broadcast_data)
#                     print("📢 Data emitted via WebSocket")
#                 else:
#                     print("❌ Failed to save data to MongoDB")
                
#             except json.JSONDecodeError as e:
#                 print(f"❌ JSON decode error: {e}")
#             except Exception as e:
#                 print(f"❌ Error processing MQTT message: {e}")

#     def on_subscribe(client, userdata, mid, granted_qos):
#         print(f"✅ Successfully subscribed to topic (QOS: {granted_qos})")

#     def on_disconnect(client, userdata, rc):
#         print(f"❌ MQTT Disconnected with result code {rc}")

#     client.on_connect = on_connect
#     client.on_message = on_message
#     client.on_subscribe = on_subscribe
#     client.on_disconnect = on_disconnect

#     def mqtt_loop():
#         try:
#             print("🔗 Connecting to MQTT broker: localhost:1883")
#             client.connect("localhost", 1883, 60)
#             print("🔄 Starting MQTT loop...")
#             client.loop_forever()
#         except Exception as e:
#             print(f"❌ MQTT Connection error: {e}")
#             print("🔄 Retrying MQTT connection in 5 seconds...")
#             import time
#             time.sleep(5)
#             mqtt_loop()  # Retry

#     import threading
#     thread = threading.Thread(target=mqtt_loop)
#     thread.daemon = True
#     thread.start()
#     print("[MQTT] MQTT handler initialized and running in background thread")


# app/mqtt_handler.py
import paho.mqtt.client as mqtt
import json
from datetime import datetime
import threading
import time
import random
import string

# Global variable to track MQTT status
mqtt_connected = False
mqtt_client = None

sensor_data = {
    "id_kebun": "KBG001",
    "suhu": 0,
    "kelembapan_udara": 0,
    "kelembapan_tanah": 0,
    "cahaya": 0,
    "co2": 0,
    "timestamp": ""
}

def init_mqtt(app, socketio, client_id=None):
    global mqtt_client
    
    # 🔥 GENERATE CLIENT ID JIKA TIDAK DISEDIAKAN
    if client_id is None:
        client_id = f"nutricomm-backend-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
    
    # Import di dalam function untuk avoid circular imports
    from app import save_sensor_data

    # 🔥 GUNAKAN CLIENT ID YANG UNIK
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
    
    print(f"🔌 MQTT Client created for backend (ID: {client_id})")
    print("📡 Will subscribe to ALL nutricomm topics")

    def on_connect(client, userdata, flags, rc, properties):
        global mqtt_connected
        if rc == 0:
            mqtt_connected = True
            print("✅ MQTT Connected successfully to broker!")
            print(f"🔑 Connected with Client ID: {client_id}")
            
            # Subscribe topics
            topics = [
                "nutricomm/sensor",           # ESP32 actual topic
                "nutricomm/sensor/#",         # Wildcard for any sub-topics  
                "nutricomm/#",                # Wildcard for all nutricomm messages
                "#"                           # Wildcard for ALL messages (debug)
            ]
            
            for topic in topics:
                result = client.subscribe(topic)
                print(f"   ✅ Subscribed to: '{topic}' (result: {result})")
                
        else:
            mqtt_connected = False
            print(f"❌ MQTT Connection failed with result code {rc}")

    def on_message(client, userdata, msg):
        global mqtt_connected
        print(f"\n" + "="*60)
        print(f"📨 BACKEND MQTT - MESSAGE RECEIVED!")
        print(f"   Topic: '{msg.topic}'")
        print(f"   QoS: {msg.qos}")
        print("="*60)

        if "nutricomm" in msg.topic or msg.topic == "#":
            try:
                payload_str = msg.payload.decode('utf-8')
                print(f"   Raw payload: {payload_str}")
                
                data = json.loads(payload_str)
                print(f"   ✅ JSON Parsed Successfully!")
                
                # Validasi data
                if 'id_kebun' not in data:
                    print("   ⚠️  No id_kebun in data, using default: KBG001")
                    data['id_kebun'] = "KBG001"
                
                # Update sensor_data dengan data REAL dari ESP32
                sensor_data.update(data)
                
                # Ensure timestamp format
                if 'timestamp' in sensor_data:
                    sensor_data['timestamp'] = sensor_data['timestamp'].replace(' ', 'T')
                else:
                    sensor_data['timestamp'] = datetime.now().isoformat()
                
                print(f"💾 Data to save: {sensor_data}")
                
                # Save to MongoDB
                result = save_sensor_data(sensor_data.copy())
                
                if result:
                    print("✅ REAL Data from ESP32 saved to MongoDB!")
                    
                    # Broadcast via WebSocket
                    broadcast_data = sensor_data.copy()
                    socketio.emit("sensor_update", broadcast_data)
                    print("📢 Real data broadcast via WebSocket")
                    
                    print("✅ REAL Data from ESP32 processed successfully")
                    print(f"   Real: {sensor_data}")
                else:
                    print("❌ Failed to save real data to MongoDB")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON Decode Error: {e}")
                print(f"   Raw payload: {msg.payload.decode('utf-8', errors='ignore')}")
            except Exception as e:
                print(f"❌ Error processing message: {e}")
                import traceback
                traceback.print_exc()
        else:
            print(f"⚠️  Ignoring non-nutricomm topic: {msg.topic}")

    def on_subscribe(client, userdata, mid, granted_qos, properties):
        print(f"✅ Subscribe successful (mid: {mid}, QOS: {granted_qos})")

    def on_disconnect(client, userdata, disconnect_flags, reason_code, properties):
        global mqtt_connected
        mqtt_connected = False
        print(f"❌ MQTT Disconnected. Reason: {reason_code}")
        
        # 🔥 AUTO-RECONNECT LOGIC - hanya untuk unexpected disconnect
        if reason_code != 0:  # 0 berarti normal disconnect
            print("🔄 Attempting to reconnect in 5 seconds...")
            time.sleep(5)
            try:
                client.reconnect()
                print("✅ Reconnected to MQTT broker")
            except Exception as e:
                print(f"❌ Reconnect failed: {e}")

    # Set callbacks
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.on_subscribe = on_subscribe
    mqtt_client.on_disconnect = on_disconnect

    def mqtt_loop():
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"\n🔄 MQTT Connection attempt {retry_count + 1}/{max_retries}")
                
                broker_ip = "10.218.22.169"
                broker_port = 1883
                
                print(f"🔗 Connecting to {broker_ip}:{broker_port}...")
                
                # 🔥 SET CONNECTION TIMEOUT dan options
                mqtt_client.connect(broker_ip, broker_port, keepalive=60)
                
                print("🔄 Starting MQTT loop...")
                mqtt_client.loop_forever()
                break
                
            except Exception as e:
                print(f"❌ MQTT Connection error: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    wait_time = 3
                    print(f"🔄 Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    print("❌ Max retries reached. MQTT connection failed.")
                    break

    # Start in background thread
    thread = threading.Thread(target=mqtt_loop)
    thread.daemon = True
    thread.start()
    
    print("[MQTT] Handler started in background thread")
    print("[MQTT] Waiting for ESP32 messages on topic 'nutricomm/sensor'...")

    return mqtt_client

# Export functions untuk diimport di file lain
def get_mqtt_status():
    """Return MQTT connection status"""
    global mqtt_connected, mqtt_client
    status = {
        "connected": mqtt_connected,
        "client_id": mqtt_client._client_id if mqtt_client else None,
        "is_connected": mqtt_client.is_connected() if mqtt_client else False
    }
    return status

def disconnect_mqtt():
    """Properly disconnect MQTT client"""
    global mqtt_client, mqtt_connected
    if mqtt_client:
        print("🔌 Disconnecting MQTT client...")
        mqtt_client.disconnect()
        mqtt_connected = False
        print("✅ MQTT client disconnected")