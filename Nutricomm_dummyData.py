# esp32_mqtt_template_fixed.py
import network
import time
import json
from umqtt.simple import MQTTClient
import machine
import random

# =========================
# KONFIGURASI WIFI
# =========================
SSID = "987x"
PASSWORD = "yuripurinuri"

# =========================
# KONFIGURASI MQTT
# =========================
MQTT_BROKER = "10.218.22.169"
MQTT_PORT = 1883
MQTT_TOPIC = b"nutricomm/sensor"
CLIENT_ID = "mpy-esp32"

# =========================
# FUNGSI: KONEK KE WIFI
# =========================
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Menghubungkan ke Wi-Fi...")
        wlan.connect(SSID, PASSWORD)
        while not wlan.isconnected():
            time.sleep(1)
    print("Terhubung ke Wi-Fi:", wlan.ifconfig())

# =========================
# FUNGSI: KONEK KE MQTT
# =========================
def connect_mqtt():
    client = MQTTClient(CLIENT_ID, MQTT_BROKER, port=MQTT_PORT)
    client.connect()
    print("[MQTT] Connected to broker")
    return client

# =========================
# FUNGSI: WAKTU FORMAT
# =========================
def get_timestamp():
    t = time.localtime()
    # Format manual YYYY-MM-DD HH:MM:SS
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

# =========================
# FUNGSI: DUMMY SENSOR DATA
# =========================
def get_sensor_data():
    data = {
        "id_kebun": "KBG001",
        "suhu": round(random.uniform(25, 32), 1),
        "kelembapan_udara": round(random.uniform(50, 80), 1),
        "kelembapan_tanah": round(random.uniform(30, 70), 1),
        "cahaya": round(random.uniform(100, 900), 1),
        "co2": round(random.uniform(300, 800), 1),
        "timestamp": get_timestamp()
    }
    return data

# =========================
# MAIN LOOP
# =========================
def main():
    connect_wifi()
    client = connect_mqtt()

    while True:
        try:
            sensor_data = get_sensor_data()
            payload = json.dumps(sensor_data)
            client.publish(MQTT_TOPIC, payload)
            print("Data terkirim:", payload)
            time.sleep(5)
        except Exception as e:
            print("Error:", e)
            time.sleep(5)

# =========================
# RUN
# =========================
if __name__ == "__main__":
    main()