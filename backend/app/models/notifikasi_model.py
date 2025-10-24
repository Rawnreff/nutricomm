from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class NotifikasiModel(BaseModel):
    """Model untuk notifikasi sistem"""
    id_notifikasi: str = Field(..., description="ID unik notifikasi")
    user_id: str = Field(..., description="ID user penerima notifikasi")
    kebun_id: str = Field(..., description="ID kebun terkait")
    jenis: str = Field(..., description="Jenis notifikasi (sensor/sistem/aktivitas)")
    kategori: str = Field(..., description="Kategori notifikasi (suhu/kelembapan/cahaya/co2/info)")
    judul: str = Field(..., description="Judul notifikasi")
    pesan: str = Field(..., description="Isi pesan notifikasi")
    tingkat: str = Field(default="info", description="Tingkat notifikasi (info/warning/critical)")
    icon: str = Field(default="notifications", description="Icon untuk notifikasi")
    is_read: bool = Field(default=False, description="Status dibaca")
    sensor_data: Optional[dict] = Field(default=None, description="Data sensor terkait")
    created_at: datetime = Field(default_factory=datetime.now, description="Waktu dibuat")
    read_at: Optional[datetime] = Field(default=None, description="Waktu dibaca")

    class Config:
        json_schema_extra = {
            "example": {
                "id_notifikasi": "NOTIF001",
                "user_id": "USR001",
                "kebun_id": "KBG001",
                "jenis": "sensor",
                "kategori": "kelembapan",
                "judul": "Kelembapan Tanah Rendah",
                "pesan": "💧 Kelembapan tanah rendah (25%), waktunya menyiram",
                "tingkat": "warning",
                "icon": "water",
                "is_read": False,
                "sensor_data": {
                    "kelembapan_tanah": 25.5,
                    "timestamp": "2024-01-01T10:00:00"
                }
            }
        }

class NotifikasiCreate(BaseModel):
    """Model untuk membuat notifikasi baru"""
    user_id: str
    kebun_id: str
    jenis: str
    kategori: str
    judul: str
    pesan: str
    tingkat: str = "info"
    icon: str = "notifications"
    sensor_data: Optional[dict] = None

class NotifikasiUpdate(BaseModel):
    """Model untuk update notifikasi"""
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None



