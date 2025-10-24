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

@user_bp.route("/<user_id>/change-password", methods=["PUT"])
def change_password(user_id):
    """Change user password"""
    try:
        print(f"[Change Password] Request for user_id: {user_id}")
        data = request.get_json()
        print(f"[Change Password] Request data: {data}")
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            return jsonify({
                "success": False,
                "error": "Password lama dan password baru harus diisi"
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "error": "Password baru minimal 6 karakter"
            }), 400
        
        user_model = get_user_model()
        if not user_model:
            return jsonify({
                "success": False,
                "error": "Database connection error"
            }), 500
        
        # Verify old password - include password in response
        print(f"[Change Password] Getting user data...")
        user = user_model.get_user_by_id(user_id, include_password=True)
        if not user:
            print(f"[Change Password] User not found: {user_id}")
            return jsonify({
                "success": False,
                "error": "User tidak ditemukan"
            }), 404
        
        print(f"[Change Password] User found: {user.get('email')}")
        
        # Check old password
        import bcrypt
        if not user.get('password'):
            print(f"[Change Password] Password field missing in user data")
            return jsonify({
                "success": False,
                "error": "Password data tidak ditemukan"
            }), 500
        
        print(f"[Change Password] Verifying old password...")
        if not bcrypt.checkpw(old_password.encode('utf-8'), user['password'].encode('utf-8')):
            print(f"[Change Password] Old password incorrect")
            return jsonify({
                "success": False,
                "error": "Password lama tidak sesuai"
            }), 401
        
        print(f"[Change Password] Old password verified, hashing new password...")
        # Hash new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        print(f"[Change Password] Updating password in database...")
        # Update password in database
        result = user_model.update_user_password(user_id, hashed_password.decode('utf-8'))
        
        if result:
            print(f"[Change Password] Password updated successfully")
            return jsonify({
                "success": True,
                "message": "Password berhasil diubah"
            }), 200
        else:
            print(f"[Change Password] Failed to update password in database")
            return jsonify({
                "success": False,
                "error": "Gagal mengubah password"
            }), 500
            
    except Exception as e:
        import traceback
        print(f"[Change Password] Error: {e}")
        print(f"[Change Password] Traceback: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": f"Failed to change password: {str(e)}"
        }), 500