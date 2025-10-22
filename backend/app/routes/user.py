from flask import Blueprint, jsonify, request

user_bp = Blueprint("user", __name__)

# Dummy data user
user_data = [
    {"id_user": "USR001", "nama": "Rina", "email": "rina@example.com", "id_kebun": "KBG001"},
    {"id_user": "USR002", "nama": "Dewi", "email": "dewi@example.com", "id_kebun": "KBG001"},
]

@user_bp.route("/", methods=["GET"])
def get_users():
    return jsonify(user_data)

@user_bp.route("/", methods=["POST"])
def add_user():
    data = request.get_json()
    user_data.append(data)
    return jsonify({"message": "User berhasil ditambahkan", "data": data}), 201
