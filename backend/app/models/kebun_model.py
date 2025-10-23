# app/models/kebun_model.py
from datetime import datetime
from bson.objectid import ObjectId

class KebunModel:
    def __init__(self, database):
        self.db = database
        self.kebun_collection = self.db.get_collection('kebun')
    
    def create_kebun(self, kebun_data, created_by):
        """Create new kebun (only admin can do this)"""
        try:
            # Check if kebun ID already exists
            if self.kebun_collection.find_one({"id_kebun": kebun_data['id_kebun']}):
                return {"error": "Kebun ID already exists"}
            
            # Check if kebun name already exists
            if self.kebun_collection.find_one({"nama_kebun": kebun_data['nama_kebun']}):
                return {"error": "Kebun name already exists"}
            
            kebun_doc = {
                "id_kebun": kebun_data['id_kebun'],
                "nama_kebun": kebun_data['nama_kebun'],
                "lokasi": kebun_data['lokasi'],
                "luas": kebun_data.get('luas'),
                "jenis_tanaman": kebun_data.get('jenis_tanaman', []),
                "deskripsi": kebun_data.get('deskripsi', ''),
                "created_by": created_by,  # User ID who created this kebun
                "is_active": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = self.kebun_collection.insert_one(kebun_doc)
            kebun_doc['_id'] = str(result.inserted_id)
            
            return {"success": True, "kebun": kebun_doc}
            
        except Exception as e:
            return {"error": f"Failed to create kebun: {str(e)}"}
    
    def get_all_kebun(self, active_only=True):
        """Get all kebun"""
        try:
            query = {"is_active": True} if active_only else {}
            kebun_list = list(self.kebun_collection.find(query))
            
            for kebun in kebun_list:
                kebun['_id'] = str(kebun['_id'])
            
            return kebun_list
        except Exception as e:
            print(f"Error getting kebun: {e}")
            return []
    
    def get_kebun_by_id(self, kebun_id):
        """Get kebun by ID"""
        try:
            kebun = self.kebun_collection.find_one({"_id": ObjectId(kebun_id)})
            if kebun:
                kebun['_id'] = str(kebun['_id'])
                return kebun
            return None
        except:
            return None
    
    def get_kebun_by_kebun_id(self, id_kebun):
        """Get kebun by kebun ID (like KBG001)"""
        try:
            kebun = self.kebun_collection.find_one({"id_kebun": id_kebun, "is_active": True})
            if kebun:
                kebun['_id'] = str(kebun['_id'])
                return kebun
            return None
        except:
            return None
    
    def update_kebun(self, kebun_id, update_data):
        """Update kebun data"""
        try:
            update_data['updated_at'] = datetime.now().isoformat()
            
            result = self.kebun_collection.update_one(
                {"_id": ObjectId(kebun_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Kebun updated successfully"}
            else:
                return {"error": "Kebun not found or no changes made"}
                
        except Exception as e:
            return {"error": f"Failed to update kebun: {str(e)}"}
    
    def delete_kebun(self, kebun_id):
        """Soft delete kebun (set is_active to False)"""
        try:
            result = self.kebun_collection.update_one(
                {"_id": ObjectId(kebun_id)},
                {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Kebun deleted successfully"}
            else:
                return {"error": "Kebun not found"}
                
        except Exception as e:
            return {"error": f"Failed to delete kebun: {str(e)}"}