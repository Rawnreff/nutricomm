"""
Script untuk mengecek IP yang sedang digunakan oleh backend
Jalankan: python test_check_ip.py
"""

from config import get_global_ip, get_backend_url, get_flask_port, config

print("=" * 70)
print("KONFIGURASI IP BACKEND - NUTRICOMM")
print("=" * 70)
print()

print("IP Configuration:")
print(f"   DEFAULT_LAPTOP_IP (dari config.py): {config.GLOBAL_IP}")
print(f"   Backend URL: {get_backend_url()}")
print(f"   Flask Host: {config.FLASK_HOST}")
print(f"   Flask Port: {get_flask_port()}")
print()

print("Fungsi Helper:")
print(f"   get_global_ip(): {get_global_ip()}")
print(f"   get_backend_url(): {get_backend_url()}")
print()

print("=" * 70)
print("IP yang akan digunakan saat backend running:")
print(f"   http://{get_global_ip()}:{get_flask_port()}")
print("=" * 70)
print()

# Cek apakah ada environment variable GLOBAL_IP (seharusnya tidak berpengaruh)
import os
env_ip = os.getenv('GLOBAL_IP')
if env_ip:
    print("[WARNING] Ada environment variable GLOBAL_IP =", env_ip)
    print("          Tapi ini TIDAK akan digunakan karena config sudah diupdate!")
    print("          IP yang digunakan tetap:", get_global_ip())
else:
    print("[OK] Tidak ada environment variable GLOBAL_IP (ini bagus)")
    print("     IP diambil langsung dari config.py")

print()

