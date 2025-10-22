from flask import Blueprint, jsonify, request

aktivitas_bp = Blueprint("aktivitas", __name__)

# Dummy data aktivitas
aktivitas_data = [
    {"id_user": "USR001", "id_kebun": "KBG001", "kegiatan": "Menyiram tanaman", "tanggal": "2025-10-20", "keterangan": "Sudah disiram pagi hari"},
    {"id_user": "USR002", "id_kebun": "KBG001", "kegiatan": "Memberi pupuk organik", "tanggal": "2025-10-19", "keterangan": "Pupuk daun diberikan"},
]

@aktivitas_bp.route("/", methods=["GET"])
def get_aktivitas():
    return jsonify(aktivitas_data)

@aktivitas_bp.route("/", methods=["POST"])
def add_aktivitas():
    data = request.get_json()
    aktivitas_data.append(data)
    return jsonify({"message": "Aktivitas berhasil ditambahkan", "data": data}), 201
