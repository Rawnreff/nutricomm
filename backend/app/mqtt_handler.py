# # app/mqtt_handler.py
# import paho.mqtt.client as mqtt
# import json

# sensor_data = {
#     "suhu": 0,
#     "kelembapan_udara": 0,
#     "kelembapan_tanah": 0,
#     "cahaya": 0,
#     "co2": 0,
#     "timestamp": ""
# }

# def init_mqtt(app, socketio):
#     client = mqtt.Client()

#     def on_connect(client, userdata, flags, rc):
#         print("[MQTT] Connected with result code", rc)
#         client.subscribe("nutricomm/#")

#     def on_message(client, userdata, msg):
#         topic = msg.topic
#         payload = msg.payload.decode()

#         print(f"[MQTT] Message received on {topic}: {payload}")

#         if topic == "nutricomm/sensors":
#             try:
#                 data = json.loads(payload)
#                 sensor_data.update(data)

#                 # Broadcast ke semua client WebSocket
#                 socketio.emit("sensor_update", sensor_data)
#             except Exception as e:
#                 print("[ERROR] Failed to parse MQTT message:", e)

#     client.on_connect = on_connect
#     client.on_message = on_message

#     def mqtt_loop():
#         client.connect("10.218.19.4", 1883, 60)
#         client.loop_forever()

#     import threading
#     thread = threading.Thread(target=mqtt_loop)
#     thread.daemon = True
#     thread.start()
#     print("[MQTT] loop started")

# app/mqtt_handler.py
import paho.mqtt.client as mqtt
import json
from datetime import datetime

sensor_data = {
    "id_kebun": "KBG001",
    "suhu": 0,
    "kelembapan_udara": 0,
    "kelembapan_tanah": 0,
    "cahaya": 0,
    "co2": 0,
    "timestamp": ""
}

def init_mqtt(app, socketio):
    # Import di dalam function untuk avoid circular imports
    from app import save_sensor_data

    client = mqtt.Client()
    
    print("🔌 MQTT Client created")
    print("📡 Subscribing to topic: nutricomm/sensor/#")

    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ MQTT Connected successfully to broker")
            client.subscribe("nutricomm/sensor/#")
            print("✅ Subscribed to nutricomm/sensor/#")
        else:
            print(f"❌ MQTT Connection failed with result code {rc}")

    def on_message(client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode()

        print(f"📨 MQTT Message received:")
        print(f"   Topic: {topic}")
        print(f"   Payload: {payload}")

        if topic.startswith("nutricomm/sensor"):
            try:
                data = json.loads(payload)
                print(f"   Parsed JSON: {data}")
                
                # Update sensor_data dengan data baru
                sensor_data.update(data)
                
                # Ensure id_kebun exists
                if 'id_kebun' not in sensor_data:
                    sensor_data['id_kebun'] = "KBG001"
                
                # Add timestamp if not provided
                if 'timestamp' not in sensor_data or not sensor_data['timestamp']:
                    sensor_data['timestamp'] = datetime.now().isoformat()
                else:
                    # Ensure timestamp format consistency
                    sensor_data['timestamp'] = sensor_data['timestamp'].replace(' ', 'T')
                
                print(f"💾 Attempting to save data to MongoDB...")
                
                # 💾 SIMPAN KE MONGODB (bisa INSERT atau UPDATE)
                result = save_sensor_data(sensor_data.copy())
                
                if result:
                    print("✅ Data successfully SAVED in MongoDB")
                    # 📢 Broadcast ke semua client WebSocket
                    broadcast_data = sensor_data.copy()
                    socketio.emit("sensor_update", broadcast_data)
                    print("📢 Data emitted via WebSocket")
                else:
                    print("❌ Failed to save data to MongoDB")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
            except Exception as e:
                print(f"❌ Error processing MQTT message: {e}")

    def on_subscribe(client, userdata, mid, granted_qos):
        print(f"✅ Successfully subscribed to topic (QOS: {granted_qos})")

    def on_disconnect(client, userdata, rc):
        print(f"❌ MQTT Disconnected with result code {rc}")

    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_disconnect = on_disconnect

    def mqtt_loop():
        try:
            print("🔗 Connecting to MQTT broker: localhost:1883")
            client.connect("localhost", 1883, 60)
            print("🔄 Starting MQTT loop...")
            client.loop_forever()
        except Exception as e:
            print(f"❌ MQTT Connection error: {e}")
            print("🔄 Retrying MQTT connection in 5 seconds...")
            import time
            time.sleep(5)
            mqtt_loop()  # Retry

    import threading
    thread = threading.Thread(target=mqtt_loop)
    thread.daemon = True
    thread.start()
    print("[MQTT] MQTT handler initialized and running in background thread")