
  // export const connectSocket = (onMessage: (data: any) => void) => {
  //   console.log("[WebSocket] Attempting to connect...");
    
  //   let pollingInterval: NodeJS.Timeout | null = null;
    
  //   const startPolling = () => {
  //     console.log("[Polling] Starting polling to REST API");
      
  //     // Load data immediately
  //     fetchLatestData();
      
  //     // Poll every 1 seconds untuk real-time update
  //     pollingInterval = setInterval(fetchLatestData, 1000);
  //   };
    
  //   const fetchLatestData = async () => {
  //     try {
  //       const response = await fetch('http://10.218.18.170:5000/api/sensors/data');
  //       if (response.ok) {
  //         const data = await response.json();
  //         console.log("[Polling] Data received from MongoDB:", data);
  //         onMessage(data);
  //       } else {
  //         console.warn("[Polling] API response not OK");
  //       }
  //     } catch (error) {
  //       console.error("[Polling] Error fetching data:", error);
  //     }
  //   };
    
  //   // Try WebSocket first, fallback to polling
  //   const tryWebSocket = () => {
  //     const endpoints = [
  //       "ws://10.218.18.170:5000",
  //       "ws://192.168.137.1:5000",
  //       "ws://localhost:5000"
  //     ];

  //     let currentEndpoint = 0;

  //     const tryConnect = () => {
  //       if (currentEndpoint >= endpoints.length) {
  //         console.log("[WebSocket] All WebSocket endpoints failed, falling back to polling");
  //         startPolling();
  //         return;
  //       }

  //       const endpoint = endpoints[currentEndpoint];
  //       console.log(`[WebSocket] Trying: ${endpoint}`);

  //       const ws = new WebSocket(endpoint);

  //       ws.onopen = () => {
  //         console.log(`[WebSocket] Connected to ${endpoint}`);
  //         // Clear polling if WebSocket works
  //         if (pollingInterval) {
  //           clearInterval(pollingInterval);
  //           pollingInterval = null;
  //         }
  //       };

  //       ws.onmessage = (event) => {
  //         try {
  //           // Try to parse as JSON
  //           const data = JSON.parse(event.data);
  //           console.log("[WebSocket] Real-time data received:", data);
  //           onMessage(data);
  //         } catch (err) {
  //           console.log("[WebSocket] Non-JSON message:", event.data);
  //         }
  //       };

  //       ws.onerror = (error) => {
  //         console.error(`[WebSocket] Error on ${endpoint}:`, error);
  //       };

  //       ws.onclose = (event) => {
  //         console.log(`[WebSocket] Closed ${endpoint}, code: ${event.code}`);
  //         currentEndpoint++;
  //         setTimeout(tryConnect, 2000);
  //       };
  //     };

  //     tryConnect();
  //   };

  //   // Start with WebSocket attempt
  //   tryWebSocket();

  //   // Return cleanup function
  //   return () => {
  //     if (pollingInterval) {
  //       clearInterval(pollingInterval);
  //     }
  //   };
  // };

  // // API Service untuk ambil data dari MongoDB
  // export const apiService = {
  //   async getLatestData() {
  //     try {
  //       const response = await fetch('http://10.218.18.170:5000/api/sensors/data');
  //       if (!response.ok) throw new Error('API response not ok');
  //       const data = await response.json();
  //       console.log('[API] Latest data from MongoDB:', data);
  //       return data;
  //     } catch (error) {
  //       console.error('[API] Error fetching latest data:', error);
  //       throw error;
  //     }
  //   },

  //   async getHistory(kebunId: string = 'KBG001', limit: number = 100) {
  //     try {
  //       const response = await fetch(`http://10.218.18.170:5000/api/sensors/history?kebun_id=${kebunId}&limit=${limit}`);
  //       if (!response.ok) throw new Error('API response not ok');
  //       return await response.json();
  //     } catch (error) {
  //       console.error('[API] Error fetching history:', error);
  //       throw error;
  //     }
  //   },

  //   async getStatistics(kebunId: string = 'KBG001') {
  //     try {
  //       const response = await fetch(`http://10.218.18.170:5000/api/sensors/statistics?kebun_id=${kebunId}`);
  //       if (!response.ok) throw new Error('API response not ok');
  //       return await response.json();
  //     } catch (error) {
  //       console.error('[API] Error fetching statistics:', error);
  //       throw error;
  //     }
  //   },

  //   async healthCheck() {
  //     try {
  //       const response = await fetch('http://10.218.18.170:5000/api/sensors/health');
  //       return await response.json();
  //     } catch (error) {
  //       console.error('[API] Health check failed:', error);
  //       throw error;
  //     }
  //   }
  // };

  // // HAPUS fungsi mock data karena tidak diperlukan lagi

  // frontend/app/services/socket.ts
import { appConfig } from './config';

export const connectSocket = (onMessage: (data: any) => void, customIP?: string) => {
  console.log("[WebSocket] Attempting to connect...");
  
  // Jika ada custom IP, update config
  if (customIP) {
    appConfig.setBackendIP(customIP);
  }
  
  let pollingInterval: NodeJS.Timeout | null = null;
  
  const startPolling = () => {
    console.log("[Polling] Starting polling to REST API");
    
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
        console.log("[Polling] Data received from MongoDB:", data);
        onMessage(data);
      } else {
        console.warn("[Polling] API response not OK");
      }
    } catch (error) {
      console.error("[Polling] Error fetching data:", error);
    }
  };
  
  // Try WebSocket first, fallback to polling
  const tryWebSocket = () => {
    const endpoints = appConfig.getAllPossibleWSEndpoints(customIP || 'localhost');
    
    console.log('[WebSocket] Available endpoints:', endpoints);

    let currentEndpoint = 0;

    const tryConnect = () => {
      if (currentEndpoint >= endpoints.length) {
        console.log("[WebSocket] All WebSocket endpoints failed, falling back to polling");
        startPolling();
        return;
      }

      const endpoint = endpoints[currentEndpoint];
      console.log(`[WebSocket] Trying: ${endpoint}`);

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
          console.log("[WebSocket] Non-JSON message:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error(`[WebSocket] Error on ${endpoint}:`, error);
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] Closed ${endpoint}, code: ${event.code}`);
        currentEndpoint++;
        setTimeout(tryConnect, 2000);
      };
    };

    tryConnect();
  };

  // Start with WebSocket attempt
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
      const response = await fetch(`http://${ip}:5000/api/sensors/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};