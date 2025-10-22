from flask import Blueprint, jsonify, request

absensi_bp = Blueprint("absensi", __name__)

# Dummy data absensi
absensi_data = [
    {"id_user": "USR001", "id_kebun": "KBG001", "tanggal": "2025-10-20", "status": "hadir"},
    {"id_user": "USR002", "id_kebun": "KBG001", "tanggal": "2025-10-20", "status": "tidak hadir"},
]

@absensi_bp.route("/", methods=["GET"])
def get_absensi():
    return jsonify(absensi_data)

@absensi_bp.route("/", methods=["POST"])
def add_absensi():
    data = request.get_json()
    absensi_data.append(data)
    return jsonify({"message": "Absensi berhasil ditambahkan", "data": data}), 201
