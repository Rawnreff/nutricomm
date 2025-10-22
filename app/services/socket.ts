// export const connectSocket = (onMessage: (data: any) => void) => {
//   // Coba beberapa endpoint yang mungkin
//   const endpoints = [
//     "ws://10.218.19.4:5000/ws/sensor",
//     "ws://10.218.19.4:5000/socket.io/?EIO=4&transport=websocket",
//     "ws://192.168.137.1:5000/ws/sensor",
//     "ws://192.168.137.1:5000/socket.io/?EIO=4&transport=websocket"
//   ];

//   let currentEndpointIndex = 0;
//   let socket: WebSocket | null = null;

//   const connect = () => {
//     if (currentEndpointIndex >= endpoints.length) {
//       console.error("[WebSocket] All endpoints failed, retrying...");
//       currentEndpointIndex = 0;
//       setTimeout(connect, 5000);
//       return;
//     }

//     const endpoint = endpoints[currentEndpointIndex];
//     console.log(`[WebSocket] Trying to connect to: ${endpoint}`);
    
//     try {
//       socket = new WebSocket(endpoint);

//       socket.onopen = () => {
//         console.log(`[WebSocket] Connected to ${endpoint}`);
//         currentEndpointIndex = 0; // Reset index on successful connection
//       };

//       socket.onmessage = (event) => {
//         try {
//           let data;
//           // Handle different message formats
//           if (event.data.startsWith('42')) {
//             // Socket.IO format: "42["event",{data}]"
//             const jsonStr = event.data.substring(2);
//             const parsed = JSON.parse(jsonStr);
//             data = parsed[1]; // Get the data object
//           } else {
//             // Regular JSON format
//             data = JSON.parse(event.data);
//           }
//           console.log("[WebSocket] Data received:", data);
//           onMessage(data);
//         } catch (err) {
//           console.error("[WebSocket] Parse error:", err, "Raw data:", event.data);
//         }
//       };

//       socket.onerror = (err) => {
//         console.error(`[WebSocket] Error on ${endpoint}:`, err);
//       };

//       socket.onclose = (event) => {
//         console.log(`[WebSocket] Disconnected from ${endpoint} (code: ${event.code})`);
//         socket = null;
        
//         // Try next endpoint
//         currentEndpointIndex++;
//         setTimeout(connect, 3000);
//       };

//     } catch (error) {
//       console.error(`[WebSocket] Connection error to ${endpoint}:`, error);
//       currentEndpointIndex++;
//       setTimeout(connect, 3000);
//     }
//   };

//   connect();

//   // Return disconnect function
//   return () => {
//     if (socket) {
//       socket.close();
//     }
//   };
// };

// // Fallback: Mock data generator untuk development
// export const startMockData = (onMessage: (data: any) => void) => {
//   console.log("[Mock] Starting mock data generator");
  
//   const generateMockData = () => {
//     const mockData = {
//       id_kebun: 'KBG001',
//       suhu: 25 + Math.random() * 10, // 25-35°C
//       kelembapan_udara: 60 + Math.random() * 30, // 60-90%
//       kelembapan_tanah: 40 + Math.random() * 40, // 40-80%
//       cahaya: 300 + Math.random() * 1000, // 300-1300 lux
//       co2: 400 + Math.random() * 600, // 400-1000 ppm
//       timestamp: new Date().toISOString(),
//     };
    
//     console.log("[Mock] Sending mock data:", mockData);
//     onMessage(mockData);
//   };

//   // Send initial data
//   generateMockData();
  
//   // Send data every 5 seconds
//   const interval = setInterval(generateMockData, 5000);
  
//   return () => clearInterval(interval);
// };

export const connectSocket = (onMessage: (data: any) => void) => {
  console.log("[WebSocket] Attempting to connect...");
  
  let pollingInterval: NodeJS.Timeout | null = null;
  
  const startPolling = () => {
    console.log("[Polling] Starting polling to REST API");
    
    // Load data immediately
    fetchLatestData();
    
    // Poll every 2 seconds untuk real-time update
    pollingInterval = setInterval(fetchLatestData, 2000);
  };
  
  const fetchLatestData = async () => {
    try {
      const response = await fetch('http://10.218.19.4:5000/api/sensors/data');
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
    const endpoints = [
      "ws://10.218.19.4:5000",
      "ws://192.168.137.1:5000",
      "ws://localhost:5000"
    ];

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
  async getLatestData() {
    try {
      const response = await fetch('http://10.218.19.4:5000/api/sensors/data');
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      console.log('[API] Latest data from MongoDB:', data);
      return data;
    } catch (error) {
      console.error('[API] Error fetching latest data:', error);
      throw error;
    }
  },

  async getHistory(kebunId: string = 'KBG001', limit: number = 100) {
    try {
      const response = await fetch(`http://10.218.19.4:5000/api/sensors/history?kebun_id=${kebunId}&limit=${limit}`);
      if (!response.ok) throw new Error('API response not ok');
      return await response.json();
    } catch (error) {
      console.error('[API] Error fetching history:', error);
      throw error;
    }
  },

  async getStatistics(kebunId: string = 'KBG001') {
    try {
      const response = await fetch(`http://10.218.19.4:5000/api/sensors/statistics?kebun_id=${kebunId}`);
      if (!response.ok) throw new Error('API response not ok');
      return await response.json();
    } catch (error) {
      console.error('[API] Error fetching statistics:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await fetch('http://10.218.19.4:5000/api/sensors/health');
      return await response.json();
    } catch (error) {
      console.error('[API] Health check failed:', error);
      throw error;
    }
  }
};

// HAPUS fungsi mock data karena tidak diperlukan lagi