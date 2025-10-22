import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/nutricomm")
    MQTT_BROKER_URL = os.getenv("MQTT_BROKER_URL", "localhost")
    MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
    MQTT_TOPIC = os.getenv("MQTT_TOPIC", "nutricomm/#")
