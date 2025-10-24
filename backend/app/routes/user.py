from flask import Blueprint, jsonify, request
from app.models.user_model import UserModel
from app import mongo_client

user_bp = Blueprint("user", __name__)

# Initialize UserModel
def get_user_model():
    if mongo_client:
        db = mongo_client["nutricomm"]
        return UserModel(db)
    return None

@user_bp.route("/login", methods=["POST"])
def login():
    """Login endpoint - authenticate user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        user_model = get_user_model()
        if not user_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = user_model.authenticate_user(email, password)
        
        if "error" in result:
            return jsonify(result), 401
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@user_bp.route("/register", methods=["POST"])
def register():
    """Register endpoint - create new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['nama', 'email', 'username', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400
        
        user_model = get_user_model()
        if not user_model:
            return jsonify({"error": "Database connection error"}), 500
        
        result = user_model.create_user(data)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@user_bp.route("/", methods=["GET"])
def get_users():
    """Get all users"""
    try:
        user_model = get_user_model()
        if not user_model:
            return jsonify({"error": "Database connection error"}), 500
        
        users = user_model.get_all_users()
        return jsonify({"users": users}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get users: {str(e)}"}), 500

@user_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get user by ID"""
    try:
        user_model = get_user_model()
        if not user_model:
            return jsonify({"error": "Database connection error"}), 500
        
        user = user_model.get_user_by_id(user_id)
        
        if user:
            return jsonify({"user": user}), 200
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Failed to get user: {str(e)}"}), 500
