# app/models/absensi_model.py
from datetime import datetime, date
from bson.objectid import ObjectId

class AbsensiModel:
    def __init__(self, database):
        self.db = database
        self.absensi_collection = self.db.get_collection('absensi')
    
    def create_absensi(self, absensi_data):
        """Create new absensi (check-in)"""
        try:
            user_id = absensi_data.get('user_id')
            kebun_id = absensi_data.get('kebun_id')
            
            if not user_id or not kebun_id:
                return {"error": "user_id and kebun_id are required"}
            
            # Check if kebun already has absensi today (sistem rotasi - 1 kebun 1 absensi per hari)
            today = date.today().isoformat()
            existing = self.absensi_collection.find_one({
                "kebun_id": kebun_id,
                "tanggal": today
            })
            
            if existing:
                return {
                    "error": f"Kebun sudah diabsen hari ini oleh {existing.get('nama_user', 'anggota lain')}",
                    "existing_absensi": {
                        "nama_user": existing.get('nama_user'),
                        "waktu_masuk": existing.get('waktu_masuk')
                    }
                }
            
            absensi_doc = {
                "user_id": user_id,
                "kebun_id": kebun_id,
                "nama_user": absensi_data.get('nama_user', ''),
                "tanggal": today,
                "waktu_masuk": datetime.now().isoformat(),
                "waktu_keluar": None,
                "status": "hadir",
                "catatan": absensi_data.get('catatan', ''),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = self.absensi_collection.insert_one(absensi_doc)
            absensi_doc['_id'] = str(result.inserted_id)
            
            return {"success": True, "absensi": absensi_doc}
            
        except Exception as e:
            return {"error": f"Failed to create absensi: {str(e)}"}
    
    def checkout_absensi(self, user_id, kebun_id):
        """Checkout (update waktu keluar)"""
        try:
            today = date.today().isoformat()
            
            # Find today's absensi for this kebun (tidak harus user yang sama)
            absensi = self.absensi_collection.find_one({
                "kebun_id": kebun_id,
                "tanggal": today
            })
            
            if not absensi:
                return {"error": "Belum ada yang check-in di kebun ini hari ini"}
            
            if absensi.get('waktu_keluar'):
                return {"error": f"Sudah check-out oleh {absensi.get('nama_user', 'anggota lain')}"}
            
            # Update waktu keluar
            result = self.absensi_collection.update_one(
                {"_id": absensi['_id']},
                {
                    "$set": {
                        "waktu_keluar": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                updated_absensi = self.absensi_collection.find_one({"_id": absensi['_id']})
                updated_absensi['_id'] = str(updated_absensi['_id'])
                return {"success": True, "absensi": updated_absensi}
            else:
                return {"error": "Failed to checkout"}
                
        except Exception as e:
            return {"error": f"Failed to checkout: {str(e)}"}
    
    def get_absensi_by_user(self, user_id, limit=30):
        """Get absensi history by user"""
        try:
            # Sort by tanggal DESC (terbaru di atas), lalu waktu_masuk DESC
            absensi_list = list(self.absensi_collection.find(
                {"user_id": user_id}
            ).sort([
                ("tanggal", -1),
                ("waktu_masuk", -1)
            ]).limit(limit))
            
            for absensi in absensi_list:
                absensi['_id'] = str(absensi['_id'])
            
            return {"success": True, "absensi": absensi_list}
            
        except Exception as e:
            return {"error": f"Failed to get absensi: {str(e)}"}
    
    def get_absensi_by_kebun(self, kebun_id, tanggal=None, limit=100):
        """Get absensi by kebun (optional: specific date)"""
        try:
            query = {"kebun_id": kebun_id}
            if tanggal:
                query["tanggal"] = tanggal
            
            # Sort by tanggal DESC (terbaru di atas), lalu waktu_masuk DESC
            absensi_list = list(self.absensi_collection.find(query).sort([
                ("tanggal", -1),
                ("waktu_masuk", -1)
            ]).limit(limit))
            
            for absensi in absensi_list:
                absensi['_id'] = str(absensi['_id'])
            
            return {"success": True, "absensi": absensi_list}
            
        except Exception as e:
            return {"error": f"Failed to get absensi: {str(e)}"}
    
    def get_today_status(self, user_id, kebun_id):
        """Check if kebun has absensi today (sistem rotasi)"""
        try:
            today = date.today().isoformat()
            
            # Cek absensi untuk kebun ini hari ini (siapa pun yang absen)
            absensi = self.absensi_collection.find_one({
                "kebun_id": kebun_id,
                "tanggal": today
            })
            
            if absensi:
                absensi['_id'] = str(absensi['_id'])
                is_my_absensi = absensi.get('user_id') == user_id
                return {
                    "success": True,
                    "has_checked_in": True,
                    "has_checked_out": absensi.get('waktu_keluar') is not None,
                    "absensi": absensi,
                    "is_my_absensi": is_my_absensi,  # apakah saya yang absen
                    "petugas_nama": absensi.get('nama_user')
                }
            else:
                return {
                    "success": True,
                    "has_checked_in": False,
                    "has_checked_out": False,
                    "absensi": None,
                    "is_my_absensi": False,
                    "petugas_nama": None
                }
                
        except Exception as e:
            return {"error": f"Failed to check status: {str(e)}"}
    
    def get_statistics(self, user_id, kebun_id=None):
        """Get absensi statistics for user"""
        try:
            query = {"user_id": user_id}
            if kebun_id:
                query["kebun_id"] = kebun_id
            
            total_absensi = self.absensi_collection.count_documents(query)
            hadir = self.absensi_collection.count_documents({**query, "status": "hadir"})
            
            return {
                "success": True,
                "statistics": {
                    "total_absensi": total_absensi,
                    "hadir": hadir,
                    "persentase": round((hadir / total_absensi * 100) if total_absensi > 0 else 0, 2)
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to get statistics: {str(e)}"}

