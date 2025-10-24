#!/usr/bin/env python3
"""
Script untuk membuat test kebun di database MongoDB
Jalankan: python create_test_kebun.py
"""

from pymongo import MongoClient
from app.models.kebun_model import KebunModel

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "nutricomm"

def create_test_kebun():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Initialize KebunModel
        kebun_model = KebunModel(db)
        
        # Test kebun data
        test_kebun_list = [
            {
                "id_kebun": "KBG001",
                "nama_kebun": "Kebun Gizi Sehat",
                "lokasi": "Jakarta Selatan",
                "luas": "50 m²",
                "jenis_tanaman": ["Bayam", "Kangkung", "Tomat", "Cabai"],
                "deskripsi": "Kebun gizi untuk 4 keluarga di Jakarta Selatan",
                "kapasitas_kebun": 4,
                "keluarga_terdaftar": 0
            },
            {
                "id_kebun": "KBG002",
                "nama_kebun": "Kebun Organik Keluarga",
                "lokasi": "Jakarta Timur",
                "luas": "75 m²",
                "jenis_tanaman": ["Sawi", "Selada", "Terong", "Brokoli"],
                "deskripsi": "Kebun organik untuk komunitas di Jakarta Timur",
                "kapasitas_kebun": 4,
                "keluarga_terdaftar": 0
            },
            {
                "id_kebun": "KBG003",
                "nama_kebun": "Kebun Hijau Bersama",
                "lokasi": "Jakarta Barat",
                "luas": "60 m²",
                "jenis_tanaman": ["Bayam", "Sawi", "Kangkung", "Pakcoy"],
                "deskripsi": "Kebun komunitas di area Jakarta Barat",
                "kapasitas_kebun": 4,
                "keluarga_terdaftar": 0
            },
            {
                "id_kebun": "KBG004",
                "nama_kebun": "Kebun Mandiri Sejahtera",
                "lokasi": "Jakarta Utara",
                "luas": "65 m²",
                "jenis_tanaman": ["Tomat", "Cabai", "Terong", "Mentimun"],
                "deskripsi": "Kebun untuk keluarga mandiri di Jakarta Utara",
                "kapasitas_kebun": 4,
                "keluarga_terdaftar": 0
            },
            {
                "id_kebun": "KBG005",
                "nama_kebun": "Kebun Keluarga Harmoni",
                "lokasi": "Jakarta Pusat",
                "luas": "55 m²",
                "jenis_tanaman": ["Sawi", "Bayam", "Kangkung", "Selada"],
                "deskripsi": "Kebun komunitas harmoni di Jakarta Pusat",
                "kapasitas_kebun": 4,
                "keluarga_terdaftar": 0
            }
        ]
        
        print("🔄 Creating test kebun...")
        print("-" * 60)
        
        for kebun_data in test_kebun_list:
            result = kebun_model.create_kebun(kebun_data)
            
            if "success" in result:
                print(f"✅ Kebun created: {kebun_data['id_kebun']}")
                print(f"   Nama: {kebun_data['nama_kebun']}")
                print(f"   Lokasi: {kebun_data['lokasi']}")
                print(f"   Luas: {kebun_data['luas']}")
                print(f"   Kapasitas: {kebun_data['kapasitas_kebun']} keluarga")
            elif "already exists" in result.get("error", "").lower():
                print(f"ℹ️  Kebun already exists: {kebun_data['id_kebun']}")
            else:
                print(f"❌ Failed to create kebun: {kebun_data['id_kebun']}")
                print(f"   Error: {result.get('error', 'Unknown error')}")
            
            print("-" * 60)
        
        print("\n✅ Test kebun setup complete!")
        print("\n📝 Kebun yang tersedia:")
        print("   - KBG001: Kebun Gizi Sehat (Jakarta Selatan) - Kapasitas: 4 keluarga")
        print("   - KBG002: Kebun Organik Keluarga (Jakarta Timur) - Kapasitas: 4 keluarga")
        print("   - KBG003: Kebun Hijau Bersama (Jakarta Barat) - Kapasitas: 4 keluarga")
        print("   - KBG004: Kebun Mandiri Sejahtera (Jakarta Utara) - Kapasitas: 4 keluarga")
        print("   - KBG005: Kebun Keluarga Harmoni (Jakarta Pusat) - Kapasitas: 4 keluarga")
        print("\n🔗 API Endpoints:")
        print("   GET  http://localhost:5000/api/kebun")
        print("   GET  http://localhost:5000/api/kebun/by-id/KBG001")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_test_kebun()

