# app/models/aktivitas_model.py
from datetime import datetime, date
from bson.objectid import ObjectId

class AktivitasModel:
    def __init__(self, database):
        self.db = database
        self.aktivitas_collection = self.db.get_collection('aktivitas')
        self.absensi_collection = self.db.get_collection('absensi')
    
    def create_aktivitas(self, aktivitas_data):
        """Create new aktivitas (hanya jika sudah check-in)"""
        try:
            user_id = aktivitas_data.get('user_id')
            kebun_id = aktivitas_data.get('kebun_id')
            
            if not user_id or not kebun_id:
                return {"error": "user_id and kebun_id are required"}
            
            # Validasi: hanya yang sudah check-in hari ini yang bisa tambah aktivitas
            today = date.today().isoformat()
            absensi_today = self.absensi_collection.find_one({
                "kebun_id": kebun_id,
                "tanggal": today
            })
            
            if not absensi_today:
                return {"error": "Tidak ada yang check-in di kebun ini hari ini. Silakan check-in terlebih dahulu untuk menambah aktivitas."}
            
            # Cek apakah user yang request adalah yang check-in atau dari kebun yang sama
            if absensi_today.get('user_id') != user_id:
                # Boleh juga jika dari kebun yang sama (sistem rotasi)
                # Tapi kita bisa validasi lebih ketat: hanya yang check-in
                return {"error": f"Hanya {absensi_today.get('nama_user', 'petugas yang check-in')} yang bisa menambah aktivitas hari ini."}
            
            # Validasi aktivitas
            jenis_aktivitas = aktivitas_data.get('jenis_aktivitas')
            deskripsi = aktivitas_data.get('deskripsi', '')
            
            if not jenis_aktivitas:
                return {"error": "jenis_aktivitas is required"}
            
            aktivitas_doc = {
                "user_id": user_id,
                "kebun_id": kebun_id,
                "nama_user": aktivitas_data.get('nama_user', ''),
                "jenis_aktivitas": jenis_aktivitas,
                "deskripsi": deskripsi,
                "tanggal": today,
                "waktu": datetime.now().isoformat(),
                "foto": aktivitas_data.get('foto', []),  # array of photo URLs
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = self.aktivitas_collection.insert_one(aktivitas_doc)
            aktivitas_doc['_id'] = str(result.inserted_id)
            
            return {"success": True, "aktivitas": aktivitas_doc}
            
        except Exception as e:
            return {"error": f"Failed to create aktivitas: {str(e)}"}
    
    def get_aktivitas_by_kebun(self, kebun_id, tanggal=None, limit=100):
        """Get aktivitas by kebun (optional: specific date)"""
        try:
            query = {"kebun_id": kebun_id}
            if tanggal:
                query["tanggal"] = tanggal
            
            aktivitas_list = list(self.aktivitas_collection.find(query).sort("waktu", -1).limit(limit))
            
            for aktivitas in aktivitas_list:
                aktivitas['_id'] = str(aktivitas['_id'])
            
            return {"success": True, "aktivitas": aktivitas_list}
            
        except Exception as e:
            return {"error": f"Failed to get aktivitas: {str(e)}"}
    
    def get_aktivitas_today(self, kebun_id):
        """Get today's aktivitas for kebun"""
        try:
            today = date.today().isoformat()
            return self.get_aktivitas_by_kebun(kebun_id, tanggal=today)
            
        except Exception as e:
            return {"error": f"Failed to get today aktivitas: {str(e)}"}
    
    def get_aktivitas_by_user(self, user_id, limit=50):
        """Get aktivitas history by user"""
        try:
            aktivitas_list = list(self.aktivitas_collection.find(
                {"user_id": user_id}
            ).sort("waktu", -1).limit(limit))
            
            for aktivitas in aktivitas_list:
                aktivitas['_id'] = str(aktivitas['_id'])
            
            return {"success": True, "aktivitas": aktivitas_list}
            
        except Exception as e:
            return {"error": f"Failed to get aktivitas: {str(e)}"}
    
    def update_aktivitas(self, aktivitas_id, update_data, user_id):
        """Update aktivitas (hanya creator yang bisa update)"""
        try:
            # Cek ownership
            aktivitas = self.aktivitas_collection.find_one({"_id": ObjectId(aktivitas_id)})
            
            if not aktivitas:
                return {"error": "Aktivitas not found"}
            
            if aktivitas.get('user_id') != user_id:
                return {"error": "Anda tidak bisa mengubah aktivitas orang lain"}
            
            # Update fields
            allowed_fields = ['jenis_aktivitas', 'deskripsi', 'foto']
            update_doc = {}
            
            for field in allowed_fields:
                if field in update_data:
                    update_doc[field] = update_data[field]
            
            if not update_doc:
                return {"error": "No fields to update"}
            
            update_doc['updated_at'] = datetime.now().isoformat()
            
            result = self.aktivitas_collection.update_one(
                {"_id": ObjectId(aktivitas_id)},
                {"$set": update_doc}
            )
            
            if result.modified_count > 0:
                updated = self.aktivitas_collection.find_one({"_id": ObjectId(aktivitas_id)})
                updated['_id'] = str(updated['_id'])
                return {"success": True, "aktivitas": updated}
            else:
                return {"error": "Failed to update aktivitas"}
                
        except Exception as e:
            return {"error": f"Failed to update aktivitas: {str(e)}"}
    
    def delete_aktivitas(self, aktivitas_id, user_id):
        """Delete aktivitas (hanya creator yang bisa delete)"""
        try:
            # Cek ownership
            aktivitas = self.aktivitas_collection.find_one({"_id": ObjectId(aktivitas_id)})
            
            if not aktivitas:
                return {"error": "Aktivitas not found"}
            
            if aktivitas.get('user_id') != user_id:
                return {"error": "Anda tidak bisa menghapus aktivitas orang lain"}
            
            result = self.aktivitas_collection.delete_one({"_id": ObjectId(aktivitas_id)})
            
            if result.deleted_count > 0:
                return {"success": True, "message": "Aktivitas deleted"}
            else:
                return {"error": "Failed to delete aktivitas"}
                
        except Exception as e:
            return {"error": f"Failed to delete aktivitas: {str(e)}"}

