# app/models/user_model.py
from datetime import datetime
from bson.objectid import ObjectId
import bcrypt
from app.models.kebun_model import KebunModel

class UserModel:
    def __init__(self, database):
        self.db = database
        self.users_collection = self.db.get_collection('users')
        self.kebun_model = KebunModel(database)
    
    def create_user(self, user_data):
        """Create new user with hashed password"""
        try:
            # Check if user already exists
            if self.users_collection.find_one({"email": user_data['email']}):
                return {"error": "Email already registered"}
            
            if self.users_collection.find_one({"username": user_data['username']}):
                return {"error": "Username already taken"}
            
            # Check kebun capacity if kebun_id is provided
            kebun_id = user_data.get('kebun_id')
            if kebun_id:
                capacity_check = self.kebun_model.check_capacity(kebun_id)
                if "error" in capacity_check:
                    return {"error": "Kebun not found"}
                
                if not capacity_check.get('has_capacity', False):
                    return {
                        "error": f"Kebun sudah penuh! Kapasitas: {capacity_check.get('kapasitas_kebun', 4)}/{capacity_check.get('kapasitas_kebun', 4)} keluarga. Silakan pilih kebun lain."
                    }
            
            # Hash password
            hashed_password = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
            
            user_doc = {
                "nama": user_data['nama'],
                "email": user_data['email'],
                "username": user_data['username'],
                "password": hashed_password.decode('utf-8'),
                "role": user_data.get('role', 'user'),  # 'admin' or 'user'
                "kebun_id": kebun_id,  # Reference to kebun
                "is_active": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = self.users_collection.insert_one(user_doc)
            user_doc['_id'] = str(result.inserted_id)
            
            # Increment keluarga_terdaftar in kebun
            if kebun_id:
                increment_result = self.kebun_model.increment_keluarga(kebun_id)
                if "error" in increment_result:
                    print(f"Warning: Failed to increment keluarga for kebun {kebun_id}")
            
            # Remove password from returned data
            user_doc.pop('password', None)
            
            return {"success": True, "user": user_doc}
            
        except Exception as e:
            return {"error": f"Failed to create user: {str(e)}"}
    
    def authenticate_user(self, email, password):
        """Authenticate user with email and password"""
        try:
            user = self.users_collection.find_one({"email": email, "is_active": True})
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                # Remove password from returned data
                user['_id'] = str(user['_id'])
                user.pop('password', None)
                return {"success": True, "user": user}
            else:
                return {"error": "Invalid email or password"}
                
        except Exception as e:
            return {"error": f"Authentication failed: {str(e)}"}
    
    def get_user_by_id(self, user_id, include_password=False):
        """Get user by ID"""
        try:
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                if not include_password:
                    user.pop('password', None)
                return user
            return None
        except:
            return None
    
    def get_all_users(self):
        """Get all users (without passwords)"""
        try:
            users = list(self.users_collection.find({}, {'password': 0}))
            for user in users:
                user['_id'] = str(user['_id'])
            return users
        except Exception as e:
            print(f"Error getting users: {e}")
            return []
    
    def update_user(self, user_id, update_data):
        """Update user data"""
        try:
            update_data['updated_at'] = datetime.now().isoformat()
            
            # If updating password, hash it
            if 'password' in update_data:
                hashed_password = bcrypt.hashpw(update_data['password'].encode('utf-8'), bcrypt.gensalt())
                update_data['password'] = hashed_password.decode('utf-8')
            
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "User updated successfully"}
            else:
                return {"error": "User not found or no changes made"}
                
        except Exception as e:
            return {"error": f"Failed to update user: {str(e)}"}
    
    def update_user_password(self, user_id, new_hashed_password):
        """Update user password"""
        try:
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password": new_hashed_password,
                    "updated_at": datetime.now().isoformat()
                }}
            )
            
            return result.modified_count > 0
                
        except Exception as e:
            print(f"Error updating password: {e}")
            return False
    
    def delete_user(self, user_id):
        """Soft delete user (set is_active to False)"""
        try:
            # Get user data first to get kebun_id
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"error": "User not found"}
            
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
            )
            
            if result.modified_count > 0:
                # Decrement keluarga_terdaftar in kebun
                kebun_id = user.get('kebun_id')
                if kebun_id:
                    decrement_result = self.kebun_model.decrement_keluarga(kebun_id)
                    if "error" in decrement_result:
                        print(f"Warning: Failed to decrement keluarga for kebun {kebun_id}")
                
                return {"success": True, "message": "User deleted successfully"}
            else:
                return {"error": "User not found"}
                
        except Exception as e:
            return {"error": f"Failed to delete user: {str(e)}"}