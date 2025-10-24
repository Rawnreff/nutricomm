// frontend/app/services/config.ts

// ==================================================================================
// 🔧 KONFIGURASI IP BACKEND - UBAH HANYA DI SINI!
// ==================================================================================
// Ketika IP laptop berubah, cukup ubah nilai BACKEND_IP di bawah ini:

const BACKEND_IP = '192.168.1.5';  // ← UBAH IP DI SINI SAJA
const BACKEND_PORT = '5000';

// Daftar IP yang sering digunakan (untuk quick select di UI)
const COMMON_IPS = [
  '192.168.1.5',   // IP saat ini
  '192.168.137.1',   // IP hotspot mobile
  'localhost'        // Development lokal
];

// ==================================================================================

// Konfigurasi untuk development/production
class AppConfig {
  private readonly config: {
    backendUrl: string;
    socketUrl: string;
    wsUrl: string;
  };

  constructor() {
    // Default configuration - menggunakan IP dari konstanta di atas
    const baseUrl = `http://${BACKEND_IP}:${BACKEND_PORT}`;
    const wsBaseUrl = `ws://${BACKEND_IP}:${BACKEND_PORT}`;
    
    this.config = {
      backendUrl: baseUrl,
      socketUrl: baseUrl,
      wsUrl: wsBaseUrl
    };
    
    console.log(`[Config] Loaded configuration: ${baseUrl}`);
  }

  private loadConfig() {
    // Method ini tidak lagi diperlukan karena konfigurasi langsung di constructor
    // Tetap ada untuk backward compatibility
  }

  // Method untuk set IP secara manual (akan dipanggil dari App)
  public setBackendIP(ip: string, port: string = '5000') {
    const baseUrl = `http://${ip}:${port}`;
    const wsBaseUrl = `ws://${ip}:${port}`;
    
    this.config.backendUrl = baseUrl;
    this.config.socketUrl = baseUrl;
    this.config.wsUrl = wsBaseUrl;
    
    console.log(`[Config] Manual configuration set: ${baseUrl}`);
  }

  public getBackendUrl(): string {
    return this.config.backendUrl;
  }

  public getSocketUrl(): string {
    return this.config.socketUrl;
  }

  public getWebSocketUrl(): string {
    return this.config.wsUrl;
  }

  // Method untuk mendapatkan semua endpoint yang mungkin
  public getAllPossibleEndpoints(ip: string): string[] {
    const endpoints = COMMON_IPS.map(ip => `http://${ip}:${BACKEND_PORT}`);
    
    // Tambahkan custom IP jika berbeda
    if (ip && !COMMON_IPS.includes(ip)) {
      endpoints.push(`http://${ip}:${BACKEND_PORT}`);
    }
    
    // Remove duplicates
    return [...new Set(endpoints)];
  }

  public getAllPossibleWSEndpoints(ip: string): string[] {
    const endpoints = COMMON_IPS.map(ip => `ws://${ip}:${BACKEND_PORT}`);
    
    // Tambahkan custom IP jika berbeda
    if (ip && !COMMON_IPS.includes(ip)) {
      endpoints.push(`ws://${ip}:${BACKEND_PORT}`);
    }
    
    // Remove duplicates
    return [...new Set(endpoints)];
  }

  // Method untuk mendapatkan daftar IP yang sering digunakan
  public getCommonIPs(): string[] {
    return [...COMMON_IPS];
  }

  // Method untuk mendapatkan IP dan port default
  public getDefaultIP(): string {
    return BACKEND_IP;
  }

  public getDefaultPort(): string {
    return BACKEND_PORT;
  }
}

// Export singleton instance
export const appConfig = new AppConfig();