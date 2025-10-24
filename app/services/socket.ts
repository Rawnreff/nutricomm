  // frontend/app/services/socket.ts
import { appConfig } from './config';

export const connectSocket = (onMessage: (data: any) => void, customIP?: string) => {
  console.log("[WebSocket] Attempting to connect...");
  
  // Jika ada custom IP, update config
  if (customIP) {
    appConfig.setBackendIP(customIP);
  }
  
  let pollingInterval: ReturnType<typeof setInterval> | null = null;
  
  const startPolling = () => {
    console.log("[Polling] Using REST API polling mode (1s interval)");
    
    // Load data immediately
    fetchLatestData();
    
    // Poll every 1 seconds untuk real-time update
    pollingInterval = setInterval(fetchLatestData, 1000);
  };
  
  const fetchLatestData = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sensors/data`);
      if (response.ok) {
        const data = await response.json();
        // Log hanya saat pertama kali berhasil mendapat data
        onMessage(data);
      }
    } catch (error) {
      // Silently fail - akan retry di interval berikutnya
    }
  };
  
  // Try WebSocket first, fallback to polling
  const tryWebSocket = () => {
    const endpoints = appConfig.getAllPossibleWSEndpoints(customIP || 'localhost');

    let currentEndpoint = 0;

    const tryConnect = () => {
      if (currentEndpoint >= endpoints.length) {
        // WebSocket tidak tersedia, langsung gunakan polling (ini normal)
        startPolling();
        return;
      }

      const endpoint = endpoints[currentEndpoint];

      const ws = new WebSocket(endpoint);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${endpoint}`);
        // Clear polling if WebSocket works
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          // Try to parse as JSON
          const data = JSON.parse(event.data);
          console.log("[WebSocket] Real-time data received:", data);
          onMessage(data);
        } catch (err) {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        // Silently fail - ini expected karena tidak ada WebSocket server
      };

      ws.onclose = () => {
        // Try next endpoint silently
        currentEndpoint++;
        setTimeout(tryConnect, 1000); // Cepat pindah ke endpoint berikutnya
      };
    };

    tryConnect();
  };

  // Start with WebSocket attempt (akan fallback ke polling jika gagal)
  tryWebSocket();

  // Return cleanup function
  return () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  };
};

// API Service untuk ambil data dari MongoDB
export const apiService = {
  async getLatestData(customIP?: string) {
    try {
      if (customIP) {
        appConfig.setBackendIP(customIP);
      }
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sensors/data`);
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      console.log('[API] Latest data from MongoDB:', data);
      return data;
    } catch (error) {
      console.error('[API] Error fetching latest data:', error);
      throw error;
    }
  },

  async getHistory(kebunId: string = 'KBG001', limit: number = 100, customIP?: string) {
    try {
      if (customIP) {
        appConfig.setBackendIP(customIP);
      }
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sensors/history?kebun_id=${kebunId}&limit=${limit}`);
      if (!response.ok) throw new Error('API response not ok');
      return await response.json();
    } catch (error) {
      console.error('[API] Error fetching history:', error);
      throw error;
    }
  },

  async getStatistics(kebunId: string = 'KBG001', customIP?: string) {
    try {
      if (customIP) {
        appConfig.setBackendIP(customIP);
      }
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sensors/statistics?kebun_id=${kebunId}`);
      if (!response.ok) throw new Error('API response not ok');
      return await response.json();
    } catch (error) {
      console.error('[API] Error fetching statistics:', error);
      throw error;
    }
  },

  async healthCheck(customIP?: string) {
    try {
      if (customIP) {
        appConfig.setBackendIP(customIP);
      }
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sensors/health`);
      return await response.json();
    } catch (error) {
      console.error('[API] Health check failed:', error);
      throw error;
    }
  },

  // Test koneksi ke backend
  async testConnection(ip: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${ip}:5000/api/sensors/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};