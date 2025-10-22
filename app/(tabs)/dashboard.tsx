import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native'; 
import { Ionicons, Entypo } from '@expo/vector-icons';
import { SensorData } from '../types';

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const fetchLatestData = async () => {
    try {
      // Simulasi API call
      const mockData: SensorData = {
        id_kebun: 'KBG001',
        suhu: 28.4,
        kelembapan_udara: 72.1,
        kelembapan_tanah: 40.3,
        cahaya: 560,
        co2: 420,
        timestamp: new Date().toISOString(),
      };
      setSensorData(mockData);
      checkNotifications(mockData);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data sensor');
    }
  };

  const checkNotifications = (data: SensorData) => {
    const newNotifications: string[] = [];
    
    if (data.kelembapan_tanah < 30) {
      newNotifications.push('Kelembapan tanah rendah, waktunya menyiram 🌱');
    }
    
    if (data.co2 > 1000) {
      newNotifications.push('CO₂ terlalu tinggi, periksa sirkulasi udara 🌿');
    }
    
    if (data.suhu > 35) {
      newNotifications.push('Suhu terlalu tinggi, perhatikan tanaman 🌡️');
    }
    
    if (data.cahaya < 200) {
      newNotifications.push('Cahaya kurang, pertimbangkan pencahayaan tambahan 💡');
    }

    setNotifications(newNotifications);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLatestData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLatestData();
  }, []);

  const SensorCard = ({ 
    title, 
    value, 
    unit, 
    icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <View style={[styles.sensorCard, { borderLeftColor: color }]}>
      <View style={styles.sensorHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.sensorTitle}>{title}</Text>
      </View>
      <Text style={styles.sensorValue}>
        {value} {unit}
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Kebun</Text>
        <Text style={styles.headerSubtitle}>Monitor kondisi kebun gizi</Text>
      </View>

      {/* Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationSection}>
          <Text style={styles.sectionTitle}>Pemberitahuan</Text>
          {notifications.map((notification, index) => (
            <View key={index} style={styles.notificationCard}>
              <Ionicons name="warning" size={20} color="#FF6B35" />
              <Text style={styles.notificationText}>{notification}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sensor Data Grid */}
      <View style={styles.sensorGrid}>
        <SensorCard
          title="Suhu"
          value={sensorData?.suhu || 0}
          unit="°C"
          icon="thermometer"
          color="#FF6B35"
        />
        <SensorCard
          title="Kelembapan Udara"
          value={sensorData?.kelembapan_udara || 0}
          unit="%"
          icon="water"
          color="#3498DB"
        />
        <SensorCard
          title="Kelembapan Tanah"
          value={sensorData?.kelembapan_tanah || 0}
          unit="%"
          icon="leaf"
          color="#2E7D32"
        />
        <SensorCard
          title="Cahaya"
          value={sensorData?.cahaya || 0}
          unit="lux"
          icon="sunny"
          color="#F39C12"
        />
        <SensorCard
          title="CO₂"
          value={sensorData?.co2 || 0}
          unit="ppm"
          icon="cloud"
          color="#7D3C98"
        />
      </View>

      {/* Status Kebun */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status Kebun</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Ionicons name="water" size={32} color="#2E7D32" />
            <Text style={styles.statusLabel}>Kelembapan Tanah</Text>
            <Text style={[
              styles.statusValue,
              { color: (sensorData?.kelembapan_tanah || 0) < 30 ? '#E74C3C' : '#2E7D32' }
            ]}>
              {(sensorData?.kelembapan_tanah || 0) < 30 ? 'Rendah' : 'Normal'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Entypo name="air" size={32} color="#3498DB" />
            <Text style={styles.statusLabel}>Kualitas Udara</Text>
            <Text style={[
              styles.statusValue,
              { color: (sensorData?.co2 || 0) > 1000 ? '#E74C3C' : '#2E7D32' }
            ]}>
              {(sensorData?.co2 || 0) > 1000 ? 'Perlu Ventilasi' : 'Baik'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    marginTop: 4,
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
  },
  notificationText: {
    marginLeft: 8,
    color: '#E65100',
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSection: {
    padding: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});