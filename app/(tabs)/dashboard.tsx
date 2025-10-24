import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native'; 
import { Ionicons, Entypo } from '@expo/vector-icons';
import { SensorData } from '../types';
import { connectSocket, apiService } from '../services/socket';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');
  const disconnectRef = useRef<(() => void) | null>(null);

  // Fungsi untuk memproses data sensor baru
  const handleNewSensorData = (data: any) => {
    console.log('[Dashboard] New data received:', data);
    
    const sensorData: SensorData = {
      id_kebun: data.id_kebun || 'KBG001',
      suhu: parseFloat(data.suhu) || 0,
      kelembapan_udara: parseFloat(data.kelembapan_udara) || 0,
      kelembapan_tanah: parseFloat(data.kelembapan_tanah) || 0,
      cahaya: parseFloat(data.cahaya) || 0,
      co2: parseFloat(data.co2) || 0,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    setSensorData(sensorData);
    checkNotifications(sensorData);
    setLastUpdate(new Date().toLocaleTimeString('id-ID'));
  };

  const checkNotifications = (data: SensorData) => {
    const newNotifications: string[] = [];
    
    if (data.kelembapan_tanah < 30) {
      newNotifications.push('💧 Kelembapan tanah rendah, waktunya menyiram');
    } else if (data.kelembapan_tanah > 80) {
      newNotifications.push('💦 Kelembapan tanah terlalu tinggi');
    }
    
    if (data.co2 > 1000) {
      newNotifications.push('🌬️ CO₂ terlalu tinggi, periksa sirkulasi udara');
    }
    
    if (data.suhu > 35) {
      newNotifications.push('🌡️ Suhu terlalu tinggi, perhatikan tanaman');
    } else if (data.suhu < 15) {
      newNotifications.push('❄️ Suhu terlalu rendah untuk tanaman');
    }
    
    if (data.cahaya < 1000) {
      newNotifications.push('💡 Cahaya kurang, pertimbangkan pencahayaan tambahan');
    } else if (data.cahaya > 12000) {
      newNotifications.push('☀️ Cahaya terlalu terang, mungkin perlu naungan');
    }

    setNotifications(newNotifications);
  };

  // Load data terbaru dari API (MongoDB)
  const loadLatestDataFromAPI = async () => {
    try {
      console.log('[API] Loading latest data from MongoDB...');
      const data = await apiService.getLatestData();
      handleNewSensorData(data);
      console.log('[API] Data loaded successfully from MongoDB');
    } catch (error) {
      console.error('[API] Failed to load data from MongoDB:', error);
      // TIDAK ADA FALLBACK KE MOCK DATA
      // Biarkan state sensorData tetap null atau data sebelumnya
      Alert.alert(
        'Koneksi Gagal',
        'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
        [{ text: 'OK' }]
      );
    }
  };

  const initializeConnection = () => {
    console.log('[Dashboard] Initializing real connection...');
    
    // Clean up previous connection
    if (disconnectRef.current) {
      disconnectRef.current();
    }

    // Load data awal dari API
    loadLatestDataFromAPI();

    // Try WebSocket untuk real-time updates
    setConnectionType('disconnected');
    setIsConnected(false);
    
    const cleanupWebSocket = connectSocket((data) => {
      console.log('[Dashboard] Real-time data received');
      setConnectionType('websocket');
      setIsConnected(true);
      handleNewSensorData(data);
    });

    disconnectRef.current = cleanupWebSocket;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Force reload dari API
    await loadLatestDataFromAPI();
    
    // Restart connection
    if (disconnectRef.current) {
      disconnectRef.current();
    }
    initializeConnection();
    
    setRefreshing(false);
  };

  useEffect(() => {
    initializeConnection();

    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, []);

  // Komponen Sensor Card
  const SensorCard = ({ 
    title, 
    value, 
    unit, 
    icon, 
    color,
    precision = 1
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    precision?: number;
  }) => (
    <View style={[styles.sensorCard, { borderLeftColor: color }]}>
      <View style={styles.sensorHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.sensorTitle}>{title}</Text>
      </View>
      <Text style={styles.sensorValue}>
        {value.toFixed(precision)}
      </Text>
      <Text style={styles.sensorUnit}>{unit}</Text>
    </View>
  );

  const getConnectionInfo = () => {
    switch (connectionType) {
      case 'websocket':
        return { 
          color: '#4CAF50', 
          text: 'Real-time dari Sensor', 
          icon: 'wifi',
          source: 'MongoDB + WebSocket'
        };
      case 'polling':
        return { 
          color: '#2196F3', 
          text: 'Polling dari Database', 
          icon: 'refresh',
          source: 'MongoDB API'
        };
      default:
        return { 
          color: '#F44336', 
          text: 'Menghubungkan...', 
          icon: 'wifi-outline',
          source: 'MongoDB'
        };
    }
  };

  const connectionInfo = getConnectionInfo();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.connectionStatus, { backgroundColor: `rgba(255,255,255,0.2)` }]}>
              <View style={[
                styles.connectionDot,
                { backgroundColor: connectionInfo.color }
              ]} />
              <Text style={styles.connectionText}>
                {connectionType === 'websocket' ? 'Real-time' : 
                 connectionType === 'polling' ? 'Polling' : 'Connecting'}
              </Text>
            </View>
            {lastUpdate && (
              <Text style={styles.lastUpdate}>
                Update: {lastUpdate}
              </Text>
            )}
          </View>
          <Text style={styles.headerTitle}>Dashboard Kebun</Text>
          <Text style={styles.headerSubtitle}>
            {connectionInfo.source}
          </Text>
        </View>

        {/* Connection Info */}
        <View style={[styles.connectionInfo, { backgroundColor: `${connectionInfo.color}20` }]}>
          <Ionicons name={connectionInfo.icon as any} size={16} color={connectionInfo.color} />
          <Text style={[styles.connectionInfoText, { color: connectionInfo.color }]}>
            {connectionInfo.text}
          </Text>
        </View>

        {/* Data Status */}
        {!sensorData ? (
          <View style={styles.noDataSection}>
            <Ionicons name="cloud-offline" size={48} color="#BDBDBD" />
            <Text style={styles.noDataTitle}>Menunggu Data Sensor</Text>
            <Text style={styles.noDataText}>
              Data akan muncul ketika sensor mengirim data ke sistem
            </Text>
          </View>
        ) : (
          <>
            {/* Notifications */}
            {notifications.length > 0 && (
              <View style={styles.notificationSection}>
                <Text style={styles.sectionTitle}>Pemberitahuan</Text>
                {notifications.map((notification, index) => (
                  <View key={index} style={styles.notificationCard}>
                    <Ionicons name="notifications" size={20} color="#FF6B35" />
                    <Text style={styles.notificationText}>{notification}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sensor Data Grid */}
            <View style={styles.sensorGrid}>
              <SensorCard
                title="Suhu"
                value={sensorData.suhu}
                unit="°C"
                icon="thermometer"
                color="#FF6B35"
                precision={1}
              />
              <SensorCard
                title="Kelembapan Udara"
                value={sensorData.kelembapan_udara}
                unit="%"
                icon="water"
                color="#3498DB"
                precision={1}
              />
              <SensorCard
                title="Kelembapan Tanah"
                value={sensorData.kelembapan_tanah}
                unit="%"
                icon="leaf"
                color="#2E7D32"
                precision={1}
              />
              <SensorCard
                title="Cahaya"
                value={sensorData.cahaya}
                unit="lux"
                icon="sunny"
                color="#F39C12"
                precision={0}
              />
              <SensorCard
                title="CO₂"
                value={sensorData.co2}
                unit="ppm"
                icon="cloud"
                color="#7D3C98"
                precision={0}
              />
            </View>

            {/* Data Source Info */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Sistem Data Real</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <Ionicons name="server" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    Data langsung dari sensor dan MongoDB
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="flash" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    Update real-time via WebSocket/polling
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="hardware-chip" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    Tidak ada data simulasi/mock
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E7D32',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  lastUpdate: {
    color: '#E8F5E8',
    fontSize: 11,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 4,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectionInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noDataSection: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  notificationText: {
    color: '#E65100',
    flex: 1,
    fontSize: 14,
  },
  sensorGrid: {
    padding: 16,
    gap: 12,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sensorValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sensorUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoSection: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});