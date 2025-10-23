


# from flask import Blueprint, jsonify, request
# from app import get_latest_sensor_data, save_sensor_data, collection

# sensors_bp = Blueprint("sensors", __name__)

# # Dummy data awal (hanya untuk fallback)
# sensor_data = {
#     "id_kebun": "KBG001",
#     "suhu": 28.5,
#     "kelembapan_udara": 65.0,
#     "kelembapan_tanah": 45.0,
#     "cahaya": 700,
#     "co2": 400,
#     "timestamp": "2025-10-20T12:00:00"  # ISO format
# }

# # Endpoint GET data sensor terbaru
# @sensors_bp.route("/data", methods=["GET"])
# def get_sensor_data():
#     # Coba ambil dari MongoDB dulu
#     latest_data = get_latest_sensor_data()
#     if latest_data:
#         # Convert ObjectId to string untuk JSON serialization
#         latest_data['_id'] = str(latest_data['_id'])
#         return jsonify(latest_data)
#     else:
#         # Fallback ke dummy data (hanya jika benar-benar tidak ada data di MongoDB)
#         return jsonify(sensor_data)

# # Endpoint untuk data historis
# @sensors_bp.route("/history", methods=["GET"])
# def get_sensor_history():
#     try:
#         kebun_id = request.args.get('kebun_id', 'KBG001')
#         limit = int(request.args.get('limit', 100))
        
#         if collection is None:
#             return jsonify({"error": "MongoDB not available"}), 500
            
#         # Ambil data historis dari MongoDB
#         history_data = list(collection.find(
#             {'id_kebun': kebun_id},
#             sort=[('timestamp', -1)]
#         ).limit(limit))
        
#         # Convert ObjectId ke string
#         for data in history_data:
#             data['_id'] = str(data['_id'])
            
#         return jsonify(history_data)
        
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# # Endpoint untuk statistics
# @sensors_bp.route("/statistics", methods=["GET"])
# def get_sensor_statistics():
#     try:
#         kebun_id = request.args.get('kebun_id', 'KBG001')
        
#         if collection is None:
#             return jsonify({"error": "MongoDB not available"}), 500
            
#         # Aggregation untuk statistics
#         pipeline = [
#             {'$match': {'id_kebun': kebun_id}},
#             {'$sort': {'timestamp': -1}},
#             {'$limit': 100},  # 100 data terakhir
#             {'$group': {
#                 '_id': '$id_kebun',
#                 'avg_suhu': {'$avg': '$suhu'},
#                 'avg_kelembapan_udara': {'$avg': '$kelembapan_udara'},
#                 'avg_kelembapan_tanah': {'$avg': '$kelembapan_tanah'},
#                 'avg_cahaya': {'$avg': '$cahaya'},
#                 'avg_co2': {'$avg': '$co2'},
#                 'max_suhu': {'$max': '$suhu'},
#                 'min_suhu': {'$min': '$suhu'},
#                 'data_count': {'$sum': 1},
#                 'last_update': {'$first': '$timestamp'}
#             }}
#         ]
        
#         result = list(collection.aggregate(pipeline))
        
#         if result:
#             return jsonify(result[0])
#         else:
#             return jsonify({"error": "No data found"}), 404
            
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# # Health check endpoint
# @sensors_bp.route("/health", methods=["GET"])
# def health_check():
#     from app import get_latest_sensor_data
#     latest_data = get_latest_sensor_data()
#     data_count = collection.count_documents({}) if collection else 0
    
#     mongodb_status = "connected" if collection else "disconnected"
#     return jsonify({
#         "status": "healthy",
#         "mongodb": mongodb_status,
#         "data_count": data_count,
#         "has_sensor_data": latest_data is not None,
#         "message": "Sensor API is running"
#     })

# # Endpoint untuk manual save data (testing)
# @sensors_bp.route("/save", methods=["POST"])
# def manual_save():
#     try:
#         data = request.get_json()
#         if not data:
#             return jsonify({"error": "No data provided"}), 400
            
#         # Ensure required fields
#         if 'id_kebun' not in data:
#             data['id_kebun'] = 'KBG001'
            
#         # Save data ke MongoDB
#         result = save_sensor_data(data)
        
#         if result:
#             return jsonify({
#                 "message": "Data saved successfully",
#                 "id": str(result),
#                 "action": "inserted" if isinstance(result, ObjectId) else "updated"
#             })
#         else:
#             return jsonify({"error": "Failed to save data"}), 500
            
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

from flask import Blueprint, jsonify, request
from app import get_latest_sensor_data, save_sensor_data, collection, history_collection, get_sensor_history, get_update_counter, reset_update_counter
from bson.objectid import ObjectId

sensors_bp = Blueprint("sensors", __name__)

# Endpoint GET data sensor terbaru - HANYA DATA REAL
@sensors_bp.route("/data", methods=["GET"])
def get_sensor_data():
    latest_data = get_latest_sensor_data()
    
    if latest_data:
        # Convert ObjectId to string untuk JSON serialization
        latest_data['_id'] = str(latest_data['_id'])
        return jsonify(latest_data)
    else:
        return jsonify({
            "error": "No sensor data available",
            "message": "Waiting for ESP32 to send data"
        }), 404

# Endpoint untuk data historis
@sensors_bp.route("/history", methods=["GET"])
def get_sensor_history_route():
    try:
        kebun_id = request.args.get('kebun_id', 'KBG001')
        limit = int(request.args.get('limit', 100))
        
        # Ambil data historis dari MongoDB
        history_data = get_sensor_history(kebun_id, limit)
        
        # Convert ObjectId ke string
        for data in history_data:
            data['_id'] = str(data['_id'])
            
        return jsonify({
            "history_data": history_data,
            "count": len(history_data),
            "kebun_id": kebun_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint untuk statistics
@sensors_bp.route("/statistics", methods=["GET"])
def get_sensor_statistics():
    try:
        kebun_id = request.args.get('kebun_id', 'KBG001')
        
        if history_collection is None:
            return jsonify({"error": "MongoDB not available"}), 500
            
        # Aggregation untuk statistics dari HISTORY data
        pipeline = [
            {'$match': {'id_kebun': kebun_id}},
            {'$sort': {'timestamp': -1}},
            {'$limit': 50},  # 50 data historis terakhir
            {'$group': {
                '_id': '$id_kebun',
                'avg_suhu': {'$avg': '$suhu'},
                'avg_kelembapan_udara': {'$avg': '$kelembapan_udara'},
                'avg_kelembapan_tanah': {'$avg': '$kelembapan_tanah'},
                'avg_cahaya': {'$avg': '$cahaya'},
                'avg_co2': {'$avg': '$co2'},
                'max_suhu': {'$max': '$suhu'},
                'min_suhu': {'$min': '$suhu'},
                'max_kelembapan_udara': {'$max': '$kelembapan_udara'},
                'min_kelembapan_udara': {'$min': '$kelembapan_udara'},
                'data_count': {'$sum': 1},
                'last_history_update': {'$first': '$history_timestamp'},
                'period_start': {'$min': '$timestamp'},
                'period_end': {'$max': '$timestamp'}
            }}
        ]
        
        result = list(history_collection.aggregate(pipeline))
        
        if result:
            return jsonify(result[0])
        else:
            return jsonify({"error": "No historical data found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@sensors_bp.route("/health", methods=["GET"])
def health_check():
    from app import get_latest_sensor_data, get_update_counter
    latest_data = get_latest_sensor_data()
    current_count = get_update_counter()
    data_count = collection.count_documents({}) if collection else 0
    history_count = history_collection.count_documents({}) if history_collection else 0
    
    mongodb_status = "connected" if collection else "disconnected"
    return jsonify({
        "status": "healthy",
        "mongodb": mongodb_status,
        "data_count": data_count,
        "history_count": history_count,
        "update_counter": current_count,
        "next_history_save": f"in {120 - current_count} updates",
        "has_sensor_data": latest_data is not None,
        "mode": "REAL_DATA_WITH_HISTORY",
        "message": "Sensor API is running with REAL data and 2-minute history saving"
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
            current_count = get_update_counter()
            return jsonify({
                "message": "Real data saved successfully",
                "id": str(result),
                "update_counter": current_count,
                "next_history_save": f"in {120 - current_count} updates",
                "action": "inserted" if isinstance(result, ObjectId) else "updated"
            })
        else:
            return jsonify({"error": "Failed to save data"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint untuk reset counter (testing)
@sensors_bp.route("/reset-counter", methods=["POST"])
def reset_counter():
    try:
        reset_update_counter()
        return jsonify({
            "message": "Update counter reset successfully",
            "update_counter": 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint untuk force save history (testing)
@sensors_bp.route("/force-history-save", methods=["POST"])
def force_history_save():
    try:
        from app import save_to_history, get_latest_sensor_data
        
        latest_data = get_latest_sensor_data()
        if latest_data:
            result = save_to_history(latest_data)
            reset_update_counter()
            return jsonify({
                "message": "History saved successfully",
                "history_id": str(result),
                "update_counter": 0
            })
        else:
            return jsonify({"error": "No data available to save as history"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint untuk hapus semua data (opsional, untuk testing)
@sensors_bp.route("/clear", methods=["DELETE"])
def clear_all_data():
    try:
        if collection is None or history_collection is None:
            return jsonify({"error": "MongoDB not available"}), 500
            
        result_current = collection.delete_many({})
        result_history = history_collection.delete_many({})
        reset_update_counter()
        
        return jsonify({
            "message": "All data cleared",
            "deleted_current": result_current.deleted_count,
            "deleted_history": result_history.deleted_count,
            "update_counter": 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500