from flask import Blueprint, jsonify, request
from app import mongo_client
from app.models.aktivitas_model import AktivitasModel

aktivitas_bp = Blueprint("aktivitas", __name__)

# Initialize AktivitasModel
def get_aktivitas_model():
    if mongo_client:
        db = mongo_client["nutricomm"]
        return AktivitasModel(db)
    return None

# Create new aktivitas (hanya jika sudah check-in)
@aktivitas_bp.route("/", methods=["POST"])
def create_aktivitas():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['user_id', 'kebun_id', 'jenis_aktivitas']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Field {field} is required"}), 400
        
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.create_aktivitas(data)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify({
            "success": True,
            "message": "Aktivitas berhasil ditambahkan!",
            "aktivitas": result["aktivitas"]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get aktivitas by kebun
@aktivitas_bp.route("/kebun/<kebun_id>", methods=["GET"])
def get_kebun_aktivitas(kebun_id):
    try:
        tanggal = request.args.get('tanggal')  # optional: YYYY-MM-DD
        limit = int(request.args.get('limit', 100))
        
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.get_aktivitas_by_kebun(kebun_id, tanggal, limit)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get today's aktivitas for kebun
@aktivitas_bp.route("/kebun/<kebun_id>/today", methods=["GET"])
def get_today_aktivitas(kebun_id):
    try:
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.get_aktivitas_today(kebun_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get aktivitas by user
@aktivitas_bp.route("/user/<user_id>", methods=["GET"])
def get_user_aktivitas(user_id):
    try:
        limit = int(request.args.get('limit', 50))
        
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.get_aktivitas_by_user(user_id, limit)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update aktivitas
@aktivitas_bp.route("/<aktivitas_id>", methods=["PUT"])
def update_aktivitas(aktivitas_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.update_aktivitas(aktivitas_id, data, user_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify({
            "success": True,
            "message": "Aktivitas berhasil diupdate!",
            "aktivitas": result["aktivitas"]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete aktivitas
@aktivitas_bp.route("/<aktivitas_id>", methods=["DELETE"])
def delete_aktivitas(aktivitas_id):
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        aktivitas_model = get_aktivitas_model()
        if not aktivitas_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = aktivitas_model.delete_aktivitas(aktivitas_id, user_id)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify({
            "success": True,
            "message": "Aktivitas berhasil dihapus!"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
