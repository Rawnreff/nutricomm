# test_mqtt.py
import paho.mqtt.publish as publish
import json
import time

def test_mqtt_publish():
    data = {
        "id_kebun": "KBG001",
        "suhu": 28.5,
        "kelembapan_udara": 65.0,
        "kelembapan_tanah": 45.0,
        "cahaya": 700,
        "co2": 400,
        "timestamp": "2025-01-20T12:00:00"
    }
    
    try:
        publish.single("nutricomm/sensor/KBG001", json.dumps(data), hostname="localhost")
        print("✅ Test message sent to MQTT")
    except Exception as e:
        print(f"❌ Failed to send test message: {e}")

if __name__ == "__main__":
    test_mqtt_publish()