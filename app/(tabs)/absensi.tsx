import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Absensi } from '../types';

export default function AbsensiScreen() {
  const [absensiHariIni, setAbsensiHariIni] = useState<Absensi | null>(null);
  const [riwayatAbsensi, setRiwayatAbsensi] = useState<Absensi[]>([]);

  useEffect(() => {
    loadAbsensiData();
  }, []);

  const loadAbsensiData = async () => {
    // Simulasi data
    const mockRiwayat: Absensi[] = [
      {
        id_user: 'user1',
        id_kebun: 'KBG001',
        tanggal: '2025-10-19',
        status: 'hadir'
      },
      {
        id_user: 'user1',
        id_kebun: 'KBG001',
        tanggal: '2025-10-18',
        status: 'hadir'
      },
    ];
    setRiwayatAbsensi(mockRiwayat);
    
    // Cek absensi hari ini
    const today = new Date().toISOString().split('T')[0];
    const absensiToday = mockRiwayat.find(a => a.tanggal === today);
    setAbsensiHariIni(absensiToday || null);
  };

  const handleAbsen = async () => {
    try {
      // Simulasi API call
      const newAbsensi: Absensi = {
        id_user: 'user1',
        id_kebun: 'KBG001',
        tanggal: new Date().toISOString().split('T')[0],
        status: 'hadir'
      };
      
      setAbsensiHariIni(newAbsensi);
      setRiwayatAbsensi(prev => [newAbsensi, ...prev]);
      
      Alert.alert('Sukses', 'Absensi berhasil dicatat!');
    } catch (error) {
      Alert.alert('Error', 'Gagal mencatat absensi');
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Absensi Menyiram</Text>
        <Text style={styles.headerSubtitle}>Catat kehadiran menyiram tanaman</Text>
      </View>

      {/* Status Hari Ini */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status Hari Ini</Text>
        <View style={[
          styles.statusCard,
          absensiHariIni ? styles.statusHadir : styles.statusBelum
        ]}>
          <Ionicons 
            name={absensiHariIni ? "checkmark-circle" : "time"} 
            size={48} 
            color={absensiHariIni ? "#2E7D32" : "#757575"} 
          />
          <Text style={styles.statusText}>
            {absensiHariIni ? '✅ Sudah menyiram hari ini' : '❌ Belum menyiram'}
          </Text>
          <Text style={styles.statusDate}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {!absensiHariIni && (
          <TouchableOpacity style={styles.absenButton} onPress={handleAbsen}>
            <Ionicons name="water" size={24} color="#FFFFFF" />
            <Text style={styles.absenButtonText}>Absen Menyiram</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Riwayat Absensi */}
      <View style={styles.riwayatSection}>
        <Text style={styles.sectionTitle}>Riwayat 7 Hari Terakhir</Text>
        {riwayatAbsensi.map((absensi, index) => (
          <View key={index} style={styles.riwayatItem}>
            <View style={styles.riwayatInfo}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color="#2E7D32" 
              />
              <Text style={styles.riwayatText}>
                Menyiram tanaman - {formatTanggal(absensi.tanggal)}
              </Text>
            </View>
            <Text style={styles.riwayatStatus}>
              {absensi.status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
            </Text>
          </View>
        ))}
        
        {riwayatAbsensi.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={48} color="#BDBDBD" />
            <Text style={styles.emptyStateText}>Belum ada riwayat absensi</Text>
          </View>
        )}
      </View>

      {/* Statistik */}
      <View style={styles.statistikSection}>
        <Text style={styles.sectionTitle}>Statistik Minggu Ini</Text>
        <View style={styles.statistikGrid}>
          <View style={styles.statistikItem}>
            <Text style={styles.statistikNumber}>5</Text>
            <Text style={styles.statistikLabel}>Hari Hadir</Text>
          </View>
          <View style={styles.statistikItem}>
            <Text style={styles.statistikNumber}>2</Text>
            <Text style={styles.statistikLabel}>Hari Tidak Hadir</Text>
          </View>
          <View style={styles.statistikItem}>
            <Text style={styles.statistikNumber}>71%</Text>
            <Text style={styles.statistikLabel}>Kehadiran</Text>
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
  statusSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusHadir: {
    backgroundColor: '#E8F5E8',
    borderColor: '#2E7D32',
    borderWidth: 2,
  },
  statusBelum: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
    borderWidth: 2,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  statusDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  absenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  absenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  riwayatSection: {
    padding: 16,
  },
  riwayatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  riwayatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riwayatText: {
    marginLeft: 12,
    marginRight: 14,
    color: '#333',
    flex: 1,
  },
  riwayatStatus: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 16,
  },
  statistikSection: {
    padding: 16,
  },
  statistikGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statistikItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statistikNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statistikLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});