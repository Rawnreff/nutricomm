# esp32_nutricomm_all_in_one.py
import network
import time
import json
from umqtt.simple import MQTTClient
import machine
from machine import Pin, ADC, I2C
import dht

# =========================
# KONFIGURASI WIFI
# =========================
SSID = "987x"
PASSWORD = "yuripurinuri"

# =========================
# KONFIGURASI MQTT
# =========================
MQTT_BROKER = "10.218.18.170"
MQTT_PORT = 1883
MQTT_TOPIC = b"nutricomm/sensor"
CLIENT_ID = b"mpy-esp32"

# =========================
# KONFIGURASI PIN SENSOR
# =========================
# DHT22 (Suhu & Kelembapan Udara)
DHT_PIN = 4
dht_sensor = dht.DHT22(Pin(DHT_PIN))

# BH1750 (Sensor Cahaya) - I2C
I2C_SDA_PIN = 21
I2C_SCL_PIN = 22
i2c = I2C(0, scl=Pin(I2C_SCL_PIN), sda=Pin(I2C_SDA_PIN), freq=100000)

# Soil Moisture Sensor (Kelembapan Tanah) - Analog
SOIL_MOISTURE_PIN = 34
soil_moisture = ADC(Pin(SOIL_MOISTURE_PIN))
soil_moisture.atten(ADC.ATTN_11DB)

# MQ-135 (Sensor CO2) - Analog
MQ135_PIN = 35
mq135_sensor = ADC(Pin(MQ135_PIN))
mq135_sensor.atten(ADC.ATTN_11DB)

# =========================
# KALIBRASI SENSOR
# =========================
SOIL_DRY_VALUE = 4095
SOIL_WET_VALUE = 1500
MQ135_RZERO = 76.63  # Resistance in clean air

# =========================
# FUNGSI BH1750 (EMBEDDED)
# =========================
class BH1750:
    POWER_DOWN = 0x00
    POWER_ON = 0x01
    RESET = 0x07
    ONCE_HIRES_1 = 0x20

    def __init__(self, i2c, addr=0x23):
        self.i2c = i2c
        self.addr = addr

    def read_light(self):
        try:
            # Power on
            self.i2c.writeto(self.addr, bytes([self.POWER_ON]))
            time.sleep_ms(10)
            
            # Set measurement mode
            self.i2c.writeto(self.addr, bytes([self.ONCE_HIRES_1]))
            time.sleep_ms(180)  # Wait for measurement
            
            # Read result
            data = self.i2c.readfrom(self.addr, 2)
            lux = (data[0] << 8 | data[1]) / 1.2
            return lux
        except Exception as e:
            print("BH1750 error:", e)
            return None

# =========================
# FUNGSI MQ135 (EMBEDDED)
# =========================
def read_mq135_simple():
    try:
        # Baca nilai analog
        sensor_value = mq135_sensor.read()
        if sensor_value == 0:
            return None
            
        # Konversi ke voltage
        voltage = (sensor_value / 4095.0) * 3.3
        
        # Hitung resistance sensor
        rs = (3.3 - voltage) / voltage * 10.0  # RLOAD = 10kΩ
        
        # Hitung rasio Rs/R0
        ratio = rs / MQ135_RZERO
        
        # Estimasi CO2 dalam ppm
        if ratio > 0:
            co2_ppm = 116.602068 * (ratio ** -2.769034857)
            return max(300, min(5000, co2_ppm))
        else:
            return None
    except Exception as e:
        print("MQ135 error:", e)
        return None

# =========================
# FUNGSI BACA SENSOR
# =========================
def read_dht22():
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        return temperature, humidity
    except Exception as e:
        print("DHT22 error:", e)
        return None, None

def read_soil_moisture():
    try:
        raw_value = soil_moisture.read()
        
        if raw_value >= SOIL_DRY_VALUE:
            moisture_percent = 0
        elif raw_value <= SOIL_WET_VALUE:
            moisture_percent = 100
        else:
            moisture_percent = 100 - ((raw_value - SOIL_WET_VALUE) / (SOIL_DRY_VALUE - SOIL_WET_VALUE)) * 100
        
        return max(0, min(100, moisture_percent))
    except Exception as e:
        print("Soil moisture error:", e)
        return None

def read_bh1750_light():
    try:
        bh1750 = BH1750(i2c)
        return bh1750.read_light()
    except Exception as e:
        print("BH1750 light error:", e)
        return None

# =========================
# FUNGSI UTILITAS
# =========================
def get_timestamp():
    t = time.localtime()
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Menghubungkan ke Wi-Fi...")
        wlan.connect(SSID, PASSWORD)
        
        timeout = 0
        while not wlan.isconnected():
            time.sleep(1)
            timeout += 1
            if timeout > 20:
                print("Timeout koneksi WiFi!")
                return False
                
    print("✅ Terhubung ke Wi-Fi:", wlan.ifconfig())
    return True

def connect_mqtt():
    try:
        client = MQTTClient(CLIENT_ID, MQTT_BROKER, port=MQTT_PORT, keepalive=60)
        client.connect()
        print("✅ [MQTT] Connected to broker:", MQTT_BROKER)
        return client
    except Exception as e:
        print("❌ [MQTT] Connection failed:", e)
        return None

def init_sensors():
    print("🔧 Initializing sensors...")
    
    # Test I2C
    try:
        devices = i2c.scan()
        print("📡 I2C devices found:", [hex(device) for device in devices])
    except Exception as e:
        print("❌ I2C scan failed:", e)
    
    # Test sensors
    try:
        temp, hum = read_dht22()
        print(f"✅ DHT22 - Temp: {temp}°C, Hum: {hum}%")
    except:
        print("❌ DHT22 test failed")
    
    try:
        soil = read_soil_moisture()
        print(f"✅ Soil Moisture: {soil}%")
    except:
        print("❌ Soil moisture test failed")
    
    try:
        light = read_bh1750_light()
        print(f"✅ BH1750 Light: {light} lux")
    except:
        print("❌ BH1750 test failed")
    
    try:
        co2 = read_mq135_simple()
        print(f"✅ MQ-135 CO2: {co2} ppm")
    except:
        print("❌ MQ-135 test failed")

# =========================
# MAIN LOOP - DIUBAH MENJADI 1 DETIK
# =========================
def main():
    print("🚀 Starting ESP32 Nutricomm Sensor Node...")
    print("⏰ Update interval: 1 second")
    
    # Inisialisasi sensor
    init_sensors()
    
    # Koneksi WiFi
    if not connect_wifi():
        return
    
    # Koneksi MQTT
    client = connect_mqtt()
    if not client:
        return

    print("📊 Starting sensor reading loop (1 second interval)...")
    
    # Counter untuk menghitung berapa banyak data yang dikirim
    data_count = 0
    
    while True:
        try:
            # Baca semua sensor
            sensor_data = {
                "id_kebun": "KBG001",
                "timestamp": get_timestamp()
            }
            
            # Baca DHT22
            temperature, humidity = read_dht22()
            if temperature is not None:
                sensor_data["suhu"] = round(temperature, 1)
            if humidity is not None:
                sensor_data["kelembapan_udara"] = round(humidity, 1)
            
            # Baca Soil Moisture
            soil_moist = read_soil_moisture()
            if soil_moist is not None:
                sensor_data["kelembapan_tanah"] = round(soil_moist, 1)
            
            # Baca BH1750
            light = read_bh1750_light()
            if light is not None:
                sensor_data["cahaya"] = round(light, 0)
            
            # Baca MQ-135
            co2 = read_mq135_simple()
            if co2 is not None:
                sensor_data["co2"] = round(co2, 0)
            
            # Kirim data jika ada yang valid
            if len(sensor_data) > 2:  # Lebih dari id_kebun dan timestamp
                payload = json.dumps(sensor_data)
                client.publish(MQTT_TOPIC, payload)
                data_count += 1
                print(f"✅ [{data_count}] Data terkirim: {payload}")
            else:
                print("⚠️ No valid sensor data")
            
            # ⏰ DIUBAH: Tunggu 1 detik sebelum membaca lagi
            time.sleep(1)
            
        except Exception as e:
            print("❌ Main loop error:", e)
            time.sleep(1)  # Tetap 1 detik meskipun error

if __name__ == "__main__":
    main()
