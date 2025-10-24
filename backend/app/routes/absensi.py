from flask import Blueprint, jsonify, request
from app import mongo_client
from app.models.absensi_model import AbsensiModel

absensi_bp = Blueprint("absensi", __name__)

# Initialize AbsensiModel
def get_absensi_model():
    if mongo_client:
        db = mongo_client["nutricomm"]
        return AbsensiModel(db)
    return None

# Check-in (create absensi)
@absensi_bp.route("/checkin", methods=["POST"])
def checkin():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['user_id', 'kebun_id']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field {field} is required"}), 400
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.create_absensi(data)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify({
            "success": True,
            "message": "Check-in berhasil!",
            "absensi": result["absensi"]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Check-out
@absensi_bp.route("/checkout", methods=["POST"])
def checkout():
    try:
        data = request.get_json()
        
        user_id = data.get('user_id')
        kebun_id = data.get('kebun_id')
        
        if not user_id or not kebun_id:
            return jsonify({"error": "user_id and kebun_id are required"}), 400
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.checkout_absensi(user_id, kebun_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify({
            "success": True,
            "message": "Check-out berhasil!",
            "absensi": result["absensi"]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get today's status
@absensi_bp.route("/status", methods=["GET"])
def get_status():
    try:
        user_id = request.args.get('user_id')
        kebun_id = request.args.get('kebun_id')
        
        if not user_id or not kebun_id:
            return jsonify({"error": "user_id and kebun_id are required"}), 400
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.get_today_status(user_id, kebun_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get absensi history by user
@absensi_bp.route("/user/<user_id>", methods=["GET"])
def get_user_absensi(user_id):
    try:
        limit = int(request.args.get('limit', 30))
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.get_absensi_by_user(user_id, limit)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get absensi by kebun
@absensi_bp.route("/kebun/<kebun_id>", methods=["GET"])
def get_kebun_absensi(kebun_id):
    try:
        tanggal = request.args.get('tanggal')  # optional: YYYY-MM-DD
        limit = int(request.args.get('limit', 100))
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.get_absensi_by_kebun(kebun_id, tanggal, limit)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get statistics
@absensi_bp.route("/statistics/<user_id>", methods=["GET"])
def get_statistics(user_id):
    try:
        kebun_id = request.args.get('kebun_id')  # optional
        
        absensi_model = get_absensi_model()
        if not absensi_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = absensi_model.get_statistics(user_id, kebun_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
