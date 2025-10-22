import io from 'socket.io-client';

export const connectSocketIO = (onMessage: (data: any) => void) => {
  const endpoints = [
    "http://10.218.19.4:5000",
    "http://192.168.137.1:5000", 
    "http://localhost:5000"
  ];

  let currentEndpoint = 0;
  let socket: any = null;

  const connect = () => {
    if (currentEndpoint >= endpoints.length) {
      console.error("[Socket.IO] All endpoints failed");
      return;
    }

    const endpoint = endpoints[currentEndpoint];
    console.log(`[Socket.IO] Connecting to: ${endpoint}`);

    socket = io(endpoint, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to ${endpoint}`);
      currentEndpoint = 0;
    });

    socket.on('sensor_update', (data: any) => {
      console.log("[Socket.IO] Sensor data:", data);
      onMessage(data);
    });

    socket.on('disconnect', () => {
      console.log("[Socket.IO] Disconnected");
    });

    socket.on('connect_error', (error: any) => {
      console.error(`[Socket.IO] Connection error to ${endpoint}:`, error);
      currentEndpoint++;
      setTimeout(connect, 3000);
    });
  };

  connect();

  return () => {
    if (socket) {
      socket.disconnect();
    }
  };
};