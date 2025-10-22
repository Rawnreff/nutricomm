# from flask import Blueprint, jsonify

# sensors_bp = Blueprint("sensors", __name__)

# # Dummy data awal
# sensor_data = {
#     "id_kebun": "KBG001",
#     "suhu": 28.5,
#     "kelembapan_udara": 65.0,
#     "kelembapan_tanah": 45.0,
#     "cahaya": 700,
#     "co2": 400,
#     "timestamp": "2025-10-20 12:00:00"
# }

# # Endpoint GET data sensor
# @sensors_bp.route("/data", methods=["GET"])
# def get_sensor_data():
#     return jsonify(sensor_data)

from flask import Blueprint, jsonify, request
from app import get_latest_sensor_data, save_sensor_data, collection

sensors_bp = Blueprint("sensors", __name__)

# Dummy data awal (hanya untuk fallback)
sensor_data = {
    "id_kebun": "KBG001",
    "suhu": 28.5,
    "kelembapan_udara": 65.0,
    "kelembapan_tanah": 45.0,
    "cahaya": 700,
    "co2": 400,
    "timestamp": "2025-10-20T12:00:00"  # ISO format
}

# Endpoint GET data sensor terbaru
@sensors_bp.route("/data", methods=["GET"])
def get_sensor_data():
    # Coba ambil dari MongoDB dulu
    latest_data = get_latest_sensor_data()
    if latest_data:
        # Convert ObjectId to string untuk JSON serialization
        latest_data['_id'] = str(latest_data['_id'])
        return jsonify(latest_data)
    else:
        # Fallback ke dummy data (hanya jika benar-benar tidak ada data di MongoDB)
        return jsonify(sensor_data)

# Endpoint untuk data historis
@sensors_bp.route("/history", methods=["GET"])
def get_sensor_history():
    try:
        kebun_id = request.args.get('kebun_id', 'KBG001')
        limit = int(request.args.get('limit', 100))
        
        if collection is None:
            return jsonify({"error": "MongoDB not available"}), 500
            
        # Ambil data historis dari MongoDB
        history_data = list(collection.find(
            {'id_kebun': kebun_id},
            sort=[('timestamp', -1)]
        ).limit(limit))
        
        # Convert ObjectId ke string
        for data in history_data:
            data['_id'] = str(data['_id'])
            
        return jsonify(history_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint untuk statistics
@sensors_bp.route("/statistics", methods=["GET"])
def get_sensor_statistics():
    try:
        kebun_id = request.args.get('kebun_id', 'KBG001')
        
        if collection is None:
            return jsonify({"error": "MongoDB not available"}), 500
            
        # Aggregation untuk statistics
        pipeline = [
            {'$match': {'id_kebun': kebun_id}},
            {'$sort': {'timestamp': -1}},
            {'$limit': 100},  # 100 data terakhir
            {'$group': {
                '_id': '$id_kebun',
                'avg_suhu': {'$avg': '$suhu'},
                'avg_kelembapan_udara': {'$avg': '$kelembapan_udara'},
                'avg_kelembapan_tanah': {'$avg': '$kelembapan_tanah'},
                'avg_cahaya': {'$avg': '$cahaya'},
                'avg_co2': {'$avg': '$co2'},
                'max_suhu': {'$max': '$suhu'},
                'min_suhu': {'$min': '$suhu'},
                'data_count': {'$sum': 1},
                'last_update': {'$first': '$timestamp'}
            }}
        ]
        
        result = list(collection.aggregate(pipeline))
        
        if result:
            return jsonify(result[0])
        else:
            return jsonify({"error": "No data found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@sensors_bp.route("/health", methods=["GET"])
def health_check():
    from app import get_latest_sensor_data
    latest_data = get_latest_sensor_data()
    data_count = collection.count_documents({}) if collection else 0
    
    mongodb_status = "connected" if collection else "disconnected"
    return jsonify({
        "status": "healthy",
        "mongodb": mongodb_status,
        "data_count": data_count,
        "has_sensor_data": latest_data is not None,
        "message": "Sensor API is running"
    })

# Endpoint untuk manual save data (testing)
@sensors_bp.route("/save", methods=["POST"])
def manual_save():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Ensure required fields
        if 'id_kebun' not in data:
            data['id_kebun'] = 'KBG001'
            
        # Save data ke MongoDB
        result = save_sensor_data(data)
        
        if result:
            return jsonify({
                "message": "Data saved successfully",
                "id": str(result),
                "action": "inserted" if isinstance(result, ObjectId) else "updated"
            })
        else:
            return jsonify({"error": "Failed to save data"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500