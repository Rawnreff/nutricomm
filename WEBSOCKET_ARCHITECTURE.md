# 🔌 WebSocket Architecture - Nutricomm Frontend

## 📁 File Structure

```
frontend/app/
├── services/
│   ├── config.ts          # Configuration manager (IP, ports, endpoints)
│   ├── socket.ts          # Native WebSocket + REST API Polling (ACTIVE)
│   ├── socketIO.ts        # Socket.IO implementation (UNUSED)
│   └── absensiService.ts  # Absensi API service
├── (tabs)/
│   └── dashboard.tsx      # Main dashboard using socket.ts
└── types/
    └── index.ts           # TypeScript types
```

---

## 🏗️ Current Architecture

### **1. config.ts - Configuration Manager**

**Purpose:** Centralized configuration for backend IP and endpoints

**Key Features:**
- Default IP: `10.218.18.170:5000`
- Fallback IP: `192.168.137.1:5000`
- Dynamic IP configuration via `setBackendIP()`
- Returns all possible HTTP and WebSocket endpoints

**Methods:**
```typescript
appConfig.setBackendIP(ip: string, port: string = '5000')
appConfig.getBackendUrl(): string
appConfig.getSocketUrl(): string
appConfig.getWebSocketUrl(): string
appConfig.getAllPossibleEndpoints(ip: string): string[]
appConfig.getAllPossibleWSEndpoints(ip: string): string[]
```

**Current Configuration:**
```typescript
BACKEND_IP = '10.218.18.170'
BACKEND_PORT = '5000'
```

---

### **2. socket.ts - WebSocket + REST API Polling (ACTIVE)**

**Purpose:** Hybrid connection system with WebSocket fallback to REST API polling

**Status:** ✅ **CURRENTLY USED** in `dashboard.tsx`

#### **Connection Flow:**

```
START
  ↓
Try WebSocket Connections (in order):
  1. ws://192.168.137.1:5000
  2. ws://10.218.18.170:5000
  ↓
All WebSocket Failed?
  ↓ YES
Fallback to REST API Polling
  - Interval: 1000ms (1 second)
  - Endpoint: GET /api/sensors/data
  ↓
Real-time Data Updates
```

#### **Key Functions:**

##### `connectSocket(onMessage, customIP?)`
Establishes connection with automatic fallback

**Parameters:**
- `onMessage`: Callback function untuk handle data baru
- `customIP` (optional): Override default backend IP

**Returns:** Cleanup function untuk disconnect

**Example:**
```typescript
const cleanup = connectSocket((data) => {
  console.log('New sensor data:', data);
  setSensorData(data);
});

// Cleanup on unmount
return () => cleanup();
```

##### `apiService` Object

**Methods:**

1. **`getLatestData(customIP?)`**
   - Fetch latest sensor data from MongoDB
   - Endpoint: `GET /api/sensors/data`
   - Returns: SensorData object

2. **`getHistory(kebunId, limit, customIP?)`**
   - Fetch sensor history
   - Endpoint: `GET /api/sensors/history?kebun_id={kebunId}&limit={limit}`
   - Default: `kebunId='KBG001', limit=100`

3. **`getStatistics(kebunId, customIP?)`**
   - Fetch aggregated statistics
   - Endpoint: `GET /api/sensors/statistics?kebun_id={kebunId}`

4. **`healthCheck(customIP?)`**
   - Check backend health status
   - Endpoint: `GET /api/sensors/health`

5. **`testConnection(ip)`**
   - Test if backend is accessible
   - Returns: `Promise<boolean>`

---

### **3. socketIO.ts - Socket.IO Implementation (UNUSED)**

**Purpose:** Alternative implementation using Socket.IO library

**Status:** ❌ **NOT CURRENTLY USED** (all code commented out)

**Why Not Used:**
- Backend doesn't have Socket.IO server
- Native WebSocket with polling fallback is sufficient
- REST API polling provides reliable real-time updates

**If You Want to Use Socket.IO:**
1. Backend needs Socket.IO server setup
2. Uncomment code in `socketIO.ts`
3. Install Socket.IO on backend:
   ```bash
   pip install python-socketio flask-socketio
   ```
4. Update `dashboard.tsx` to import from `socketIO.ts`

---

## 🖥️ Dashboard Implementation

### **dashboard.tsx - Current Usage**

**Import:**
```typescript
import { connectSocket, apiService } from '../services/socket';
```

**State Management:**
```typescript
const [sensorData, setSensorData] = useState<SensorData | null>(null);
const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');
const [isConnected, setIsConnected] = useState(false);
const disconnectRef = useRef<(() => void) | null>(null);
```

**Initialization Flow:**

```typescript
useEffect(() => {
  initializeConnection();
  
  return () => {
    if (disconnectRef.current) {
      disconnectRef.current(); // Cleanup
    }
  };
}, []);
```

**Connection Logic:**

```typescript
const initializeConnection = () => {
  // 1. Load initial data from MongoDB
  loadLatestDataFromAPI();
  
  // 2. Try WebSocket connection
  const cleanupWebSocket = connectSocket((data) => {
    setConnectionType('websocket');
    setIsConnected(true);
    handleNewSensorData(data);
  });
  
  disconnectRef.current = cleanupWebSocket;
};
```

**Data Flow:**

```
Backend MongoDB
      ↓
REST API (/api/sensors/data)
      ↓
WebSocket (if available) OR Polling (fallback)
      ↓
connectSocket callback
      ↓
handleNewSensorData(data)
      ↓
setSensorData(data)
      ↓
UI Update
```

---

## 🔄 Real-Time Update Mechanism

### **Current System: REST API Polling**

**Why Polling Works:**
- ✅ Backend updates MongoDB every 1 second from ESP32
- ✅ Frontend polls every 1 second from MongoDB
- ✅ No WebSocket server needed on backend
- ✅ Simple, reliable, and effective for this use case
- ✅ Automatic retry on connection failure

**Performance:**
- **Latency:** ~1-2 seconds (acceptable for sensor monitoring)
- **Network Load:** Minimal (small JSON payloads)
- **Scalability:** Good for small-scale deployment (< 100 users)

**Data Update Interval:**
```
ESP32 → Backend: Every 1 second
Backend → MongoDB: Update existing record (upsert)
Frontend → MongoDB: Poll every 1 second
```

**Result:** Near real-time updates (1-2 second delay max)

---

## 🛠️ Configuration Guide

### **Change Backend IP**

#### **Option 1: Edit config.ts (Permanent)**

```typescript
// frontend/app/services/config.ts
private loadConfig() {
  const BACKEND_IP = '10.218.18.170';  // ← Change this
  const BACKEND_PORT = '5000';
  // ...
}
```

#### **Option 2: Runtime Override (Dynamic)**

```typescript
// In dashboard.tsx or any component
import { appConfig } from '../services/config';

// Set new IP
appConfig.setBackendIP('192.168.1.100', '5000');

// Use API
const data = await apiService.getLatestData();
```

#### **Option 3: Custom IP per API Call**

```typescript
// Pass custom IP to each API call
const data = await apiService.getLatestData('192.168.1.100');
const history = await apiService.getHistory('KBG001', 100, '192.168.1.100');
```

### **Add More Fallback Endpoints**

```typescript
// In config.ts
public getAllPossibleEndpoints(ip: string): string[] {
  const endpoints = [
    `http://192.168.137.1:5000`,
    `http://10.218.18.170:5000`,
    `http://192.168.1.100:5000`,  // Add more
    `http://localhost:5000`
  ];
  return [...new Set(endpoints)];
}
```

---

## 🐛 Troubleshooting

### **Problem: "No data" or "Connection Failed"**

**Diagnosis:**
```typescript
// Add to dashboard.tsx
console.log('[Debug] Backend URL:', appConfig.getBackendUrl());
console.log('[Debug] Connection type:', connectionType);
console.log('[Debug] Is connected:', isConnected);
```

**Solutions:**

1. **Check Backend is Running**
   ```bash
   curl http://10.218.18.170:5000/api/sensors/health
   ```

2. **Check IP Configuration**
   - Verify `BACKEND_IP` in `config.ts`
   - Check laptop IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Ensure phone/browser on same network

3. **Check Firewall**
   - Windows: Allow port 5000 in Windows Firewall
   - Run as admin: `netsh advfirewall firewall add rule name="Flask" dir=in action=allow protocol=TCP localport=5000`

4. **Test Connection**
   ```typescript
   const isReachable = await apiService.testConnection('10.218.18.170');
   console.log('Backend reachable:', isReachable);
   ```

### **Problem: WebSocket Keeps Failing**

**Expected Behavior:** WebSocket will fail if backend doesn't have WebSocket server, then automatically fallback to polling.

**This is NORMAL and INTENTIONAL!** Console will show:
```
[WebSocket] Trying: ws://192.168.137.1:5000
[WebSocket] Error on ws://192.168.137.1:5000
[WebSocket] All WebSocket endpoints failed, falling back to polling
[Polling] Starting polling to REST API
[Polling] Data received from MongoDB: {...}
```

**No action needed** - system is working as designed!

### **Problem: Data Updates Slow**

**Adjust Polling Interval:**
```typescript
// In socket.ts, line 169
pollingInterval = setInterval(fetchLatestData, 500); // 500ms = 0.5 second
```

**Trade-offs:**
- Faster interval = More network requests = Higher load
- Slower interval = Less responsive = Lower load
- **Recommended:** 1000ms (1 second) for sensor monitoring

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   ESP32     │ Send sensor data every 1s
└──────┬──────┘
       │ POST /api/sensors/save
       ↓
┌─────────────────────┐
│  Flask Backend      │ Upsert to MongoDB
│  10.218.18.170:5000 │
└──────┬──────────────┘
       │ Update
       ↓
┌─────────────────────┐
│   MongoDB           │ sensor_data collection
│   (1 document/kebun)│
└──────┬──────────────┘
       │ GET /api/sensors/data (every 1s)
       ↓
┌─────────────────────┐
│  Frontend           │
│  (socket.ts)        │
│                     │
│  Try WebSocket      │
│    ↓ (fail)         │
│  Fallback to Polling│ ← ACTIVE MODE
└──────┬──────────────┘
       │ onMessage callback
       ↓
┌─────────────────────┐
│  dashboard.tsx      │
│  handleNewSensorData│
│  setSensorData      │
└──────┬──────────────┘
       │ State update
       ↓
┌─────────────────────┐
│   UI Components     │ Render sensor cards
│   (SensorCard)      │ Show notifications
└─────────────────────┘
```

---

## 🔮 Future Enhancements

### **Option 1: Enable WebSocket (Real Real-Time)**

**Backend Changes:**
```python
# backend/app/__init__.py
from flask_socketio import SocketIO, emit

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

# In save_sensor_data()
socketio.emit('sensor_update', data)
```

**Frontend Changes:**
```typescript
// Uncomment socketIO.ts
// Update dashboard.tsx to use socketIO instead
import { connectSocketIO } from '../services/socketIO';
```

### **Option 2: Server-Sent Events (SSE)**

Alternative to WebSocket, simpler to implement:
```python
# Backend
@app.route('/api/sensors/stream')
def stream():
    def generate():
        while True:
            data = get_latest_sensor_data()
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(1)
    return Response(generate(), mimetype='text/event-stream')
```

```typescript
// Frontend
const eventSource = new EventSource(`${backendUrl}/api/sensors/stream`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  onMessage(data);
};
```

### **Option 3: MQTT (IoT Standard)**

For large-scale deployment:
- ESP32 publishes to MQTT broker
- Backend subscribes to MQTT topics
- Frontend connects via MQTT over WebSocket

---

## ✅ Summary

### **Current System:**
| Component | Status | Method |
|-----------|--------|--------|
| Backend | ✅ Running | Flask REST API |
| MongoDB | ✅ Connected | Data storage |
| ESP32 → Backend | ✅ Active | POST every 1s |
| Backend → MongoDB | ✅ Active | Upsert every 1s |
| Frontend → Backend | ✅ Active | **Polling every 1s** |
| WebSocket | ❌ Not Active | Falls back to polling |
| Socket.IO | ❌ Not Used | Code commented out |

### **Recommendation:**
**KEEP CURRENT SYSTEM!** 

REST API polling is:
- ✅ Simple and reliable
- ✅ Working perfectly
- ✅ Adequate for sensor monitoring
- ✅ No additional backend complexity

Only implement WebSocket if:
- You have > 50 concurrent users
- You need < 500ms latency
- You want to push alerts from backend

---

## 📞 Quick Reference

**Check Current Configuration:**
```typescript
console.log(appConfig.getBackendUrl());
```

**Manual IP Override:**
```typescript
appConfig.setBackendIP('192.168.1.100');
```

**Test Connection:**
```typescript
const ok = await apiService.testConnection('10.218.18.170');
```

**Get Latest Data:**
```typescript
const data = await apiService.getLatestData();
```

**Connect Real-Time:**
```typescript
const cleanup = connectSocket((data) => {
  console.log('New data:', data);
});
```

---

## 🎯 Conclusion

Your WebSocket architecture is **well-designed with automatic fallback** to REST API polling. The current system using **socket.ts with polling** is the **optimal solution** for your use case. No changes needed! 🎉


