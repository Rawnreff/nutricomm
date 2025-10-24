// frontend/app/services/config.ts

// Konfigurasi untuk development/production
class AppConfig {
  private readonly config: {
    backendUrl: string;
    socketUrl: string;
    wsUrl: string;
  };

  constructor() {
    // Default configuration - akan dioverride oleh environment
    this.config = {
      backendUrl: 'http://192.168.137.1:5000',
      socketUrl: 'http://192.168.137.1:5000',
      wsUrl: 'ws://192.168.137.1:5000'
    };
    
    this.loadConfig();
  }

  private loadConfig() {
    // Untuk React Native/Expo, kita bisa menggunakan constants
    // Atau kita bisa buat file .env untuk frontend
    try {
      // Coba baca dari environment variables (jika menggunakan Expo)
      const BACKEND_IP = '10.218.18.170';
      const BACKEND_PORT = '5000';
      
      const baseUrl = `http://${BACKEND_IP}:${BACKEND_PORT}`;
      const wsBaseUrl = `ws://${BACKEND_IP}:${BACKEND_PORT}`;
      
      this.config.backendUrl = baseUrl;
      this.config.socketUrl = baseUrl;
      this.config.wsUrl = wsBaseUrl;
      
      console.log(`[Config] Loaded configuration: ${baseUrl}`);
    } catch (error) {
      console.warn('[Config] Using default configuration');
    }
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
    const endpoints = [
      `http://192.168.137.1:5000`,
      `http://10.218.18.170:5000`
    ];
    
    // Remove duplicates
    return [...new Set(endpoints)];
  }

  public getAllPossibleWSEndpoints(ip: string): string[] {
    const endpoints = [
      `ws://192.168.137.1:5000`,
      `ws://10.218.18.170:5000`
    ];
    
    // Remove duplicates
    return [...new Set(endpoints)];
  }
}

// Export singleton instance
export const appConfig = new AppConfig();