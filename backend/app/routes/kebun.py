# app/routes/kebun.py
from flask import Blueprint, jsonify, request
from app.database import db
from app.models.kebun_model import KebunModel

kebun_bp = Blueprint("kebun", __name__)
kebun_model = KebunModel(db)

# Create new kebun (admin only)
@kebun_bp.route("/", methods=["POST"])
def create_kebun():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['id_kebun', 'nama_kebun', 'lokasi']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Field {field} is required"}), 400
        
        # In real implementation, check if user is admin
        # For now, we'll use a placeholder created_by
        created_by = data.get('created_by', 'admin')
        
        result = kebun_model.create_kebun(data, created_by)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "message": "Kebun created successfully",
            "kebun": result["kebun"]
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all kebun
@kebun_bp.route("/", methods=["GET"])
def get_all_kebun():
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        kebun_list = kebun_model.get_all_kebun(active_only)
        
        return jsonify({
            "success": True,
            "kebun": kebun_list,
            "count": len(kebun_list)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get kebun by ID
@kebun_bp.route("/<kebun_id>", methods=["GET"])
def get_kebun(kebun_id):
    try:
        kebun = kebun_model.get_kebun_by_id(kebun_id)
        if kebun:
            return jsonify({
                "success": True,
                "kebun": kebun
            })
        else:
            return jsonify({"error": "Kebun not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get kebun by kebun ID (like KBG001)
@kebun_bp.route("/by-id/<id_kebun>", methods=["GET"])
def get_kebun_by_kebun_id(id_kebun):
    try:
        kebun = kebun_model.get_kebun_by_kebun_id(id_kebun)
        if kebun:
            return jsonify({
                "success": True,
                "kebun": kebun
            })
        else:
            return jsonify({"error": "Kebun not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update kebun
@kebun_bp.route("/<kebun_id>", methods=["PUT"])
def update_kebun(kebun_id):
    try:
        data = request.get_json()
        
        # Remove fields that shouldn't be updated
        data.pop('_id', None)
        data.pop('id_kebun', None)  # ID kebun shouldn't be changed
        data.pop('created_at', None)
        data.pop('created_by', None)
        
        result = kebun_model.update_kebun(kebun_id, data)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "message": result["message"]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete kebun (soft delete)
@kebun_bp.route("/<kebun_id>", methods=["DELETE"])
def delete_kebun(kebun_id):
    try:
        result = kebun_model.delete_kebun(kebun_id)
        
        if "error" in result:
            return jsonify({"error": result["error"]}), 400
        
        return jsonify({
            "success": True,
            "message": result["message"]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500