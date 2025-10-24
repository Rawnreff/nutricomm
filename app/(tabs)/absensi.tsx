import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';

interface AbsensiData {
  _id: string;
  user_id: string;
  kebun_id: string;
  nama_user: string;
  tanggal: string;
  waktu_masuk: string;
  waktu_keluar: string | null;
  status: string;
  catatan?: string;
}

interface TodayStatus {
  has_checked_in: boolean;
  has_checked_out: boolean;
  absensi: AbsensiData | null;
  is_my_absensi?: boolean;
  petugas_nama?: string | null;
}

export default function AbsensiScreen() {
  const { user, kebun } = useAuth();
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    has_checked_in: false,
    has_checked_out: false,
    absensi: null
  });
  const [absensiHistory, setAbsensiHistory] = useState<AbsensiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAbsensiData();
    }
  }, [user]);

  const loadAbsensiData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayStatus(),
        fetchAbsensiHistory()
      ]);
    } catch (error) {
      console.error('[Absensi] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAbsensiData();
    setRefreshing(false);
  };

  const fetchTodayStatus = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/absensi/status?user_id=${user?.id_user}&kebun_id=${user?.id_kebun}`
      );
      const data = await response.json();
      
      if (data.success) {
        setTodayStatus({
          has_checked_in: data.has_checked_in,
          has_checked_out: data.has_checked_out,
          absensi: data.absensi,
          is_my_absensi: data.is_my_absensi,
          petugas_nama: data.petugas_nama
        });
      }
    } catch (error) {
      console.error('[Absensi] Error fetching today status:', error);
    }
  };

  const fetchAbsensiHistory = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      // Ambil history berdasarkan kebun_id (sistem rotasi)
      const response = await fetch(
        `${backendUrl}/api/absensi/kebun/${user?.id_kebun}?limit=30`
      );
      const data = await response.json();
      
      if (data.success) {
        // Filter hanya yang bukan hari ini untuk history
        const today = new Date().toISOString().split('T')[0];
        const historyOnly = data.absensi.filter((item: AbsensiData) => item.tanggal !== today);
        setAbsensiHistory(historyOnly);
      }
    } catch (error) {
      console.error('[Absensi] Error fetching history:', error);
    }
  };

  const handleCheckIn = async () => {
    if (todayStatus.has_checked_in) {
      const petugasText = todayStatus.is_my_absensi 
        ? 'Anda' 
        : todayStatus.petugas_nama || 'anggota kebun lain';
      Alert.alert(
        'Sudah Diabsen',
        `Kebun sudah diabsen hari ini oleh ${petugasText}. Sistem rotasi memastikan 1 kebun hanya perlu 1 absensi per hari.`
      );
      return;
    }

    try {
      setLoading(true);
      const backendUrl = appConfig.getBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/absensi/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id_user,
          kebun_id: user?.id_kebun,
          nama_user: user?.nama,
          catatan: 'Check-in via mobile app'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Sukses! ✅',
          'Check-in berhasil! Terima kasih telah hadir di kebun.',
          [{ text: 'OK', onPress: () => loadAbsensiData() }]
        );
      } else {
        Alert.alert('Informasi', data.error || 'Gagal check-in');
      }
    } catch (error) {
      console.error('[Absensi] Check-in error:', error);
      Alert.alert('Error', 'Gagal melakukan check-in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayStatus.has_checked_in) {
      Alert.alert('Info', 'Belum ada yang check-in di kebun ini hari ini');
      return;
    }

    if (todayStatus.has_checked_out) {
      Alert.alert('Info', 'Kebun sudah check-out hari ini');
      return;
    }

    try {
      setLoading(true);
      const backendUrl = appConfig.getBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/absensi/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id_user,
          kebun_id: user?.id_kebun
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          'Sukses! 👋',
          'Check-out berhasil! Terima kasih atas kontribusi Anda hari ini.',
          [{ text: 'OK', onPress: () => loadAbsensiData() }]
        );
      } else {
        Alert.alert('Error', data.error || 'Gagal check-out');
      }
    } catch (error) {
      console.error('[Absensi] Check-out error:', error);
      Alert.alert('Error', 'Gagal melakukan check-out');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selesai': return '#4CAF50';
      case 'hari_ini': return '#FF9800';
      case 'akan_datang': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selesai': return 'Selesai';
      case 'hari_ini': return 'Hari Ini';
      case 'akan_datang': return 'Akan Datang';
      default: return '';
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatWaktu = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHari = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Absensi Kebun</Text>
          <Text style={styles.headerSubtitle}>Check-in & Check-out</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Memuat data absensi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Absensi Kebun</Text>
          <Text style={styles.headerSubtitle}>{kebun?.nama_kebun || 'Kebun Gizi'}</Text>
        </View>

        {/* Status Hari Ini */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Hari Ini</Text>
          
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Ionicons 
                name={todayStatus.has_checked_in ? "checkmark-circle" : "time"} 
                size={32} 
                color={todayStatus.has_checked_in ? "#4CAF50" : "#FF9800"} 
              />
              <View style={styles.todayInfo}>
                <Text style={styles.todayTitle}>
                  {todayStatus.has_checked_in ? 'Sudah Check-in' : 'Belum Check-in'}
                </Text>
                <Text style={styles.todayDate}>
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </Text>
              </View>
            </View>

            {/* Info Petugas */}
            {todayStatus.has_checked_in && todayStatus.petugas_nama && (
              <View style={styles.petugasInfo}>
                <Ionicons name="person" size={18} color="#2E7D32" />
                <Text style={styles.petugasLabel}>Petugas Hari Ini:</Text>
                <Text style={styles.petugasName}>
                  {todayStatus.is_my_absensi ? 'Anda' : todayStatus.petugas_nama}
                </Text>
              </View>
            )}

            {todayStatus.absensi && (
              <View style={styles.timeInfo}>
                <View style={styles.timeRow}>
                  <Ionicons name="log-in" size={18} color="#2E7D32" />
                  <Text style={styles.timeLabel}>Check-in:</Text>
                  <Text style={styles.timeValue}>
                    {formatWaktu(todayStatus.absensi.waktu_masuk)}
                  </Text>
                </View>
                {todayStatus.absensi.waktu_keluar && (
                  <View style={styles.timeRow}>
                    <Ionicons name="log-out" size={18} color="#E74C3C" />
                    <Text style={styles.timeLabel}>Check-out:</Text>
                    <Text style={styles.timeValue}>
                      {formatWaktu(todayStatus.absensi.waktu_keluar)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tombol Check-in/Check-out */}
            <View style={styles.actionButtons}>
              {!todayStatus.has_checked_in ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.checkInButton]} 
                  onPress={handleCheckIn}
                  disabled={loading}
                >
                  <Ionicons name="log-in" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Check-in</Text>
                </TouchableOpacity>
              ) : !todayStatus.has_checked_out ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.checkOutButton]} 
                  onPress={handleCheckOut}
                  disabled={loading}
                >
                  <Ionicons name="log-out" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Check-out</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.completeBadge}>
                  <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
                  <Text style={styles.completeText}>Absensi hari ini selesai</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* History Absensi */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>History Absensi Kebun</Text>
          
          {absensiHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Belum ada history absensi</Text>
              <Text style={styles.emptySubtext}>History akan muncul setelah ada absensi kemarin</Text>
            </View>
          ) : (
            absensiHistory.slice(0, 10).map((absensi, index) => (
              <View key={absensi._id || index} style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDay}>{getHari(absensi.tanggal)}</Text>
                  <Text style={styles.historyDateText}>{formatTanggal(absensi.tanggal)}</Text>
                </View>
                
                <View style={styles.historyContent}>
                  <View style={styles.historyPetugas}>
                    <Ionicons name="person-outline" size={12} color="#666" />
                    <Text style={styles.historyPetugasText}>{absensi.nama_user}</Text>
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeRow}>
                      <Ionicons name="log-in" size={12} color="#2E7D32" />
                      <Text style={styles.historyTime}>{formatWaktu(absensi.waktu_masuk)}</Text>
                    </View>
                    {absensi.waktu_keluar && (
                      <>
                        <Text style={styles.historyTimeSeparator}>→</Text>
                        <View style={styles.historyTimeRow}>
                          <Ionicons name="log-out" size={12} color="#E74C3C" />
                          <Text style={styles.historyTime}>{formatWaktu(absensi.waktu_keluar)}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                
                <View style={[
                  styles.historyStatus,
                  { backgroundColor: absensi.waktu_keluar ? '#E8F5E8' : '#FFF3E0' }
                ]}>
                  <Text style={[
                    styles.historyStatusText,
                    { color: absensi.waktu_keluar ? '#2E7D32' : '#FF9800' }
                  ]}>
                    {absensi.waktu_keluar ? '✓' : '...'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Sistem Rotasi Absensi</Text>
              <Text style={styles.infoText}>
                • 1 kebun hanya perlu 1 absensi per hari{'\n'}
                • Jika sudah ada yang absen, anggota lain tidak perlu absen lagi{'\n'}
                • Check-in saat tiba, check-out saat selesai{'\n'}
                • Siapa saja dari kebun yang sama bisa check-out
              </Text>
            </View>
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayInfo: {
    marginLeft: 12,
    flex: 1,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  todayDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  petugasInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  petugasLabel: {
    fontSize: 14,
    color: '#666',
  },
  petugasName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  timeInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: '#2E7D32',
  },
  checkOutButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    gap: 8,
  },
  completeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  historySection: {
    padding: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#BBB',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  historyDate: {
    minWidth: 70,
  },
  historyDay: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  historyDateText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
  },
  historyPetugas: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  historyPetugasText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  historyTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  historyTime: {
    fontSize: 11,
    color: '#333',
  },
  historyTimeSeparator: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 2,
  },
  historyStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
});