from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
import app

notifikasi_bp = Blueprint('notifikasi', __name__)

def get_notifikasi_collection():
    """Get notifikasi collection from MongoDB"""
    if app.mongo_client is None:
        raise Exception("MongoDB not initialized")
    db = app.mongo_client[app.DB_NAME]
    return db['notifikasi']

@notifikasi_bp.route('/api/notifikasi/', methods=['POST'])
def create_notifikasi():
    """Membuat notifikasi baru"""
    try:
        data = request.get_json()
        
        # Cek duplikasi: apakah sudah ada notifikasi dengan kategori & tingkat yang sama dalam 1 jam terakhir?
        notifikasi_collection = get_notifikasi_collection()
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        existing_notif = notifikasi_collection.find_one({
            'user_id': data.get('user_id'),
            'kebun_id': data.get('kebun_id'),
            'kategori': data.get('kategori'),
            'tingkat': data.get('tingkat'),
            'created_at': {'$gte': one_hour_ago}
        })
        
        if existing_notif:
            print(f"[Notifikasi] ⏭️ Skip duplikasi: {data.get('judul')} (sudah ada dalam 1 jam terakhir)")
            return jsonify({
                'success': True,
                'message': 'Notifikasi sudah ada dalam 1 jam terakhir',
                'id_notifikasi': existing_notif.get('id_notifikasi'),
                'skipped': True
            }), 200
        
        # Generate ID notifikasi
        id_notifikasi = f"NOTIF{str(uuid.uuid4())[:8].upper()}"
        
        # Buat dokumen notifikasi
        notifikasi_doc = {
            'id_notifikasi': id_notifikasi,
            'user_id': data.get('user_id'),
            'kebun_id': data.get('kebun_id'),
            'jenis': data.get('jenis', 'sistem'),
            'kategori': data.get('kategori', 'info'),
            'judul': data.get('judul'),
            'pesan': data.get('pesan'),
            'tingkat': data.get('tingkat', 'info'),
            'icon': data.get('icon', 'notifications'),
            'is_read': False,
            'sensor_data': data.get('sensor_data'),
            'created_at': datetime.now(),
            'read_at': None
        }
        
        # Simpan ke database
        result = notifikasi_collection.insert_one(notifikasi_doc)
        
        if result.inserted_id:
            return jsonify({
                'success': True,
                'message': 'Notifikasi berhasil dibuat',
                'id_notifikasi': id_notifikasi
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Gagal membuat notifikasi'
            }), 500
            
    except Exception as e:
        print(f"[Notifikasi] Error creating notifikasi: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/user/<user_id>', methods=['GET'])
def get_user_notifikasi(user_id):
    """Get notifikasi by user_id dengan limit (default 5 terakhir)"""
    try:
        limit = int(request.args.get('limit', 5))
        
        notifikasi_collection = get_notifikasi_collection()
        notifikasi_list = list(
            notifikasi_collection
            .find({'user_id': user_id})
            .sort('created_at', -1)
            .limit(limit)
        )
        
        # Convert ObjectId to string
        for notif in notifikasi_list:
            notif['_id'] = str(notif['_id'])
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat()
            if notif.get('read_at'):
                notif['read_at'] = notif['read_at'].isoformat()
        
        # Hitung unread
        unread_count = notifikasi_collection.count_documents({
            'user_id': user_id,
            'is_read': False
        })
        
        return jsonify({
            'success': True,
            'notifikasi': notifikasi_list,
            'unread_count': unread_count,
            'total': len(notifikasi_list)
        })
        
    except Exception as e:
        print(f"[Notifikasi] Error getting user notifikasi: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/kebun/<kebun_id>', methods=['GET'])
def get_kebun_notifikasi(kebun_id):
    """Get semua notifikasi untuk kebun tertentu"""
    try:
        limit = int(request.args.get('limit', 20))
        
        notifikasi_collection = get_notifikasi_collection()
        notifikasi_list = list(
            notifikasi_collection
            .find({'kebun_id': kebun_id})
            .sort('created_at', -1)
            .limit(limit)
        )
        
        # Convert ObjectId to string
        for notif in notifikasi_list:
            notif['_id'] = str(notif['_id'])
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat()
            if notif.get('read_at'):
                notif['read_at'] = notif['read_at'].isoformat()
        
        return jsonify({
            'success': True,
            'notifikasi': notifikasi_list,
            'total': len(notifikasi_list)
        })
        
    except Exception as e:
        print(f"[Notifikasi] Error getting kebun notifikasi: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/<id_notifikasi>', methods=['GET'])
def get_notifikasi_by_id(id_notifikasi):
    """Get detail notifikasi by ID"""
    try:
        notifikasi_collection = get_notifikasi_collection()
        notifikasi = notifikasi_collection.find_one({'id_notifikasi': id_notifikasi})
        
        if not notifikasi:
            return jsonify({
                'success': False,
                'error': 'Notifikasi tidak ditemukan'
            }), 404
        
        # Convert ObjectId to string
        notifikasi['_id'] = str(notifikasi['_id'])
        if notifikasi.get('created_at'):
            notifikasi['created_at'] = notifikasi['created_at'].isoformat()
        if notifikasi.get('read_at'):
            notifikasi['read_at'] = notifikasi['read_at'].isoformat()
        
        return jsonify({
            'success': True,
            'notifikasi': notifikasi
        })
        
    except Exception as e:
        print(f"[Notifikasi] Error getting notifikasi: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/<id_notifikasi>/read', methods=['PUT'])
def mark_as_read(id_notifikasi):
    """Tandai notifikasi sebagai sudah dibaca"""
    try:
        notifikasi_collection = get_notifikasi_collection()
        result = notifikasi_collection.update_one(
            {'id_notifikasi': id_notifikasi},
            {
                '$set': {
                    'is_read': True,
                    'read_at': datetime.now()
                }
            }
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'Notifikasi ditandai sebagai dibaca'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Notifikasi tidak ditemukan atau sudah dibaca'
            }), 404
            
    except Exception as e:
        print(f"[Notifikasi] Error marking as read: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/user/<user_id>/read-all', methods=['PUT'])
def mark_all_read(user_id):
    """Tandai semua notifikasi user sebagai sudah dibaca"""
    try:
        notifikasi_collection = get_notifikasi_collection()
        result = notifikasi_collection.update_many(
            {
                'user_id': user_id,
                'is_read': False
            },
            {
                '$set': {
                    'is_read': True,
                    'read_at': datetime.now()
                }
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'{result.modified_count} notifikasi ditandai sebagai dibaca'
        })
        
    except Exception as e:
        print(f"[Notifikasi] Error marking all as read: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/<id_notifikasi>', methods=['DELETE'])
def delete_notifikasi(id_notifikasi):
    """Hapus notifikasi"""
    try:
        notifikasi_collection = get_notifikasi_collection()
        result = notifikasi_collection.delete_one({'id_notifikasi': id_notifikasi})
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': 'Notifikasi berhasil dihapus'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Notifikasi tidak ditemukan'
            }), 404
            
    except Exception as e:
        print(f"[Notifikasi] Error deleting notifikasi: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@notifikasi_bp.route('/api/notifikasi/user/<user_id>/unread-count', methods=['GET'])
def get_unread_count(user_id):
    """Get jumlah notifikasi yang belum dibaca"""
    try:
        notifikasi_collection = get_notifikasi_collection()
        count = notifikasi_collection.count_documents({
            'user_id': user_id,
            'is_read': False
        })
        
        return jsonify({
            'success': True,
            'unread_count': count
        })
        
    except Exception as e:
        print(f"[Notifikasi] Error getting unread count: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

