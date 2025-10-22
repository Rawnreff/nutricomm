from datetime import datetime

def format_sensor_data(data):
    return {
        "id_kebun": data.get("id_kebun"),
        "suhu": float(data.get("suhu", 0)),
        "kelembapan_udara": float(data.get("kelembapan_udara", 0)),
        "kelembapan_tanah": float(data.get("kelembapan_tanah", 0)),
        "cahaya": float(data.get("cahaya", 0)),
        "co2": float(data.get("co2", 0)),
        "timestamp": data.get("timestamp", datetime.utcnow().isoformat())
    }
