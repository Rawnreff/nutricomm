// -------------------------------------------------- TIDAK TERPAKAI --------------------------------------------------

// frontend/app/services/socketIO.ts
import io from 'socket.io-client';
import { appConfig } from './config';

export const connectSocketIO = (onMessage: (data: any) => void, customIP?: string) => {
  // Jika ada custom IP, update config
  if (customIP) {
    appConfig.setBackendIP(customIP);
  }

  const endpoints = appConfig.getAllPossibleEndpoints(customIP || 'localhost');
  
  console.log('[Socket.IO] Available endpoints:', endpoints);

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
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to ${endpoint}`);
      currentEndpoint = 0; // Reset untuk koneksi berikutnya
    });

    socket.on('sensor_update', (data: any) => {
      console.log("[Socket.IO] Sensor data:", data);
      onMessage(data);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error: any) => {
      console.error(`[Socket.IO] Connection error to ${endpoint}:`, error);
      currentEndpoint++;
      setTimeout(connect, 2000);
    });

    socket.on('error', (error: any) => {
      console.error(`[Socket.IO] Error on ${endpoint}:`, error);
    });
  };

  connect();

  // Return cleanup function
  return () => {
    if (socket) {
      socket.disconnect();
    }
  };
};

// Fungsi untuk test koneksi
export const testSocketConnection = async (ip: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const testSocket = io(`http://${ip}:5000`, {
      transports: ['websocket', 'polling'],
      timeout: 3000
    });

    const timeout = setTimeout(() => {
      testSocket.disconnect();
      resolve(false);
    }, 5000);

    testSocket.on('connect', () => {
      clearTimeout(timeout);
      testSocket.disconnect();
      resolve(true);
    });

    testSocket.on('connect_error', () => {
      clearTimeout(timeout);
      testSocket.disconnect();
      resolve(false);
    });
  });
};