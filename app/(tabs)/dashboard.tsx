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
import { apiService } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';

export default function Dashboard() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedNotificationsRef = useRef<Set<string>>(new Set());

  // Fungsi untuk memproses data sensor baru
  const handleNewSensorData = (data: any) => {
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

  const saveNotificationToDatabase = async (
    kategori: string,
    judul: string,
    pesan: string,
    tingkat: string,
    icon: string,
    sensorData: SensorData
  ) => {
    try {
      // Create unique key untuk notifikasi ini agar tidak duplikat
      // Group by hour (3600000ms = 1 jam) instead of minute
      const notifKey = `${kategori}_${tingkat}_${Math.floor(Date.now() / 3600000)}`; // Group by hour
      
      // Cek apakah notifikasi ini sudah disimpan dalam 1 jam terakhir
      if (savedNotificationsRef.current.has(notifKey)) {
        console.log('[Dashboard] ⏭️ Notifikasi sudah tersimpan dalam 1 jam terakhir, skip:', judul);
        return; // Skip jika sudah disimpan
      }

      // Jika user belum login, gunakan default
      const userId = user?.id_user || 'GUEST';
      const kebunId = user?.id_kebun || sensorData.id_kebun;
      
      console.log('[Dashboard] Menyimpan notifikasi:', {
        judul,
        kategori,
        tingkat,
        userId,
        kebunId
      });
      
      const backendUrl = appConfig.getBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/notifikasi/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          kebun_id: kebunId,
          jenis: 'sensor',
          kategori: kategori,
          judul: judul,
          pesan: pesan,
          tingkat: tingkat,
          icon: icon,
          sensor_data: {
            suhu: sensorData.suhu,
            kelembapan_udara: sensorData.kelembapan_udara,
            kelembapan_tanah: sensorData.kelembapan_tanah,
            cahaya: sensorData.cahaya,
            co2: sensorData.co2,
            timestamp: sensorData.timestamp
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Tandai notifikasi ini sudah disimpan
        savedNotificationsRef.current.add(notifKey);
        
        if (data.skipped) {
          console.log('⏭️ [Dashboard] Notifikasi sudah ada dalam 1 jam terakhir, skip:', judul);
        } else {
          console.log('✅ [Dashboard] Notifikasi berhasil tersimpan:', judul);
        }
      } else {
        console.error('❌ [Dashboard] Gagal menyimpan notifikasi:', data.error);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Error saving notification:', error);
    }
  };

  const checkNotifications = (data: SensorData) => {
    const newNotifications: string[] = [];
    
    console.log('[Dashboard] Checking notifications for sensor data:', {
      kelembapan_tanah: data.kelembapan_tanah,
      co2: data.co2,
      suhu: data.suhu,
      cahaya: data.cahaya
    });
    
    // Kelembapan Tanah
    if (data.kelembapan_tanah < 30) {
      const pesan = '💧 Kelembapan tanah rendah, waktunya menyiram';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Kelembapan tanah rendah');
      saveNotificationToDatabase(
        'kelembapan_tanah',
        'Kelembapan Tanah Rendah',
        pesan,
        'warning',
        'water',
        data
      );
    } else if (data.kelembapan_tanah > 80) {
      const pesan = '💦 Kelembapan tanah terlalu tinggi';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Kelembapan tanah tinggi');
      saveNotificationToDatabase(
        'kelembapan_tanah',
        'Kelembapan Tanah Tinggi',
        pesan,
        'warning',
        'water',
        data
      );
    }
    
    // CO2
    if (data.co2 > 1000) {
      const pesan = '🌬️ CO₂ terlalu tinggi, periksa sirkulasi udara';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: CO₂ tinggi');
      saveNotificationToDatabase(
        'co2',
        'CO₂ Terlalu Tinggi',
        pesan,
        'critical',
        'cloud',
        data
      );
    }
    
    // Suhu
    if (data.suhu > 35) {
      const pesan = '🌡️ Suhu terlalu tinggi, perhatikan tanaman';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Suhu tinggi');
      saveNotificationToDatabase(
        'suhu',
        'Suhu Terlalu Tinggi',
        pesan,
        'critical',
        'thermometer',
        data
      );
    } else if (data.suhu < 15) {
      const pesan = '❄️ Suhu terlalu rendah untuk tanaman';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Suhu rendah');
      saveNotificationToDatabase(
        'suhu',
        'Suhu Terlalu Rendah',
        pesan,
        'warning',
        'snow',
        data
      );
    }
    
    // Cahaya
    if (data.cahaya < 1000) {
      const pesan = '💡 Cahaya kurang, pertimbangkan pencahayaan tambahan';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Cahaya kurang');
      saveNotificationToDatabase(
        'cahaya',
        'Cahaya Kurang',
        pesan,
        'info',
        'bulb',
        data
      );
    } else if (data.cahaya > 12000) {
      const pesan = '☀️ Cahaya terlalu terang, mungkin perlu naungan';
      newNotifications.push(pesan);
      console.log('[Dashboard] 🔔 Trigger notifikasi: Cahaya terang');
      saveNotificationToDatabase(
        'cahaya',
        'Cahaya Terlalu Terang',
        pesan,
        'info',
        'sunny',
        data
      );
    }

    console.log('[Dashboard] Total notifikasi aktif:', newNotifications.length);
    setNotifications(newNotifications);
  };

  // Load data terbaru dari API (MongoDB)
  const loadLatestDataFromAPI = async () => {
    try {
      const data = await apiService.getLatestData();
      handleNewSensorData(data);
      console.log('[Dashboard] Initial data loaded successfully');
    } catch (error) {
      console.error('[Dashboard] Failed to load initial data:', error);
      Alert.alert(
        'Koneksi Gagal',
        'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
        [{ text: 'OK' }]
      );
    }
  };

  const initializeConnection = () => {
    console.log('[Dashboard] Initializing REST API connection...');
    
    // Clean up previous polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Load data awal dari API
    loadLatestDataFromAPI();
    setIsConnected(true);

    // Setup polling setiap 2 detik untuk mendapatkan data terbaru
    pollingIntervalRef.current = setInterval(() => {
      loadLatestDataFromAPI();
    }, 2000); // Poll setiap 2 detik
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Force reload dari API
    await loadLatestDataFromAPI();
    
    // Restart connection
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    initializeConnection();
    
    setRefreshing(false);
  };

  useEffect(() => {
    initializeConnection();

    // Cleanup savedNotifications setiap 1 jam untuk prevent memory leak
    const cleanupInterval = setInterval(() => {
      console.log('[Dashboard] 🧹 Cleanup old notification keys');
      savedNotificationsRef.current.clear();
    }, 3600000); // 1 jam

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearInterval(cleanupInterval);
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

  const connectionInfo = {
    color: '#4CAF50', 
    text: 'Real-time dari Database', 
    icon: 'wifi' as keyof typeof Ionicons.glyphMap,
    source: 'Nutricomm'
  };

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
                Real-time
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
    paddingTop: 60,
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
    marginBottom: 20,
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