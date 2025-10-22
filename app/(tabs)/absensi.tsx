import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  generateJadwalAbsensi, 
  isHariIniJadwalSaya, 
  getKeluargaBertugasHariIni,
  dummyAbsensi 
} from '../services/absensiService';

export default function AbsensiScreen() {
  const { user } = useAuth();
  const [jadwalAbsensi, setJadwalAbsensi] = useState<any[]>([]);
  const [keluargaBertugasHariIni, setKeluargaBertugasHariIni] = useState<any>(null);
  const [sudahAbsenHariIni, setSudahAbsenHariIni] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    loadAbsensiData();
  }, [user]);

  const loadAbsensiData = () => {
    const jadwal = generateJadwalAbsensi();
    setJadwalAbsensi(jadwal);
    
    const bertugasHariIni = getKeluargaBertugasHariIni();
    setKeluargaBertugasHariIni(bertugasHariIni);
    
    // Cek apakah user yang login bertugas hari ini
    const myTurn = isHariIniJadwalSaya(user?.id_user || '');
    setIsMyTurn(myTurn);
    
    // Cek apakah sudah absen hari ini
    const today = new Date().toISOString().split('T')[0];
    const absensiHariIni = dummyAbsensi.find(
      a => a.tanggal === today && a.id_user === user?.id_user
    );
    setSudahAbsenHariIni(!!absensiHariIni);
  };

  const handleAbsen = async () => {
    if (!isMyTurn) {
      Alert.alert(
        'Bukan Jadwal Anda',
        'Hari ini bukan jadwal keluarga Anda untuk menyiram. Silakan tunggu jadwal yang ditentukan.',
        [{ text: 'Mengerti' }]
      );
      return;
    }

    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSudahAbsenHariIni(true);
      Alert.alert('Sukses', 'Absensi berhasil dicatat! Terima kasih telah menyiram tanaman.');
    } catch (error) {
      Alert.alert('Error', 'Gagal mencatat absensi');
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

  const getHari = (tanggal: string) => {
    const date = new Date(tanggal);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Absensi Menyiram</Text>
          <Text style={styles.headerSubtitle}>Sistem rotasi 5 keluarga</Text>
        </View>

        {/* Status Hari Ini */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Hari Ini</Text>
          
          {keluargaBertugasHariIni && (
            <View style={styles.keluargaBertugasCard}>
              <View style={styles.bertugasHeader}>
                <Ionicons name="water" size={24} color="#2196F3" />
                <Text style={styles.bertugasTitle}>Keluarga Bertugas</Text>
              </View>
              
              <View style={styles.keluargaInfo}>
                <Text style={styles.keluargaNama}>
                  {keluargaBertugasHariIni.nama_keluarga}
                </Text>
                <Text style={styles.keluargaNomor}>
                  Keluarga #{keluargaBertugasHariIni.nomor_keluarga}
                </Text>
              </View>

              {/* Status untuk user yang login */}
              {user && (
                <View style={[
                  styles.statusIndicator,
                  { 
                    backgroundColor: isMyTurn 
                      ? sudahAbsenHariIni ? '#E8F5E8' : '#FFF3E0'
                      : '#F5F5F5' 
                  }
                ]}>
                  <Ionicons 
                    name={isMyTurn ? "person" : "people"} 
                    size={20} 
                    color={isMyTurn ? '#FF9800' : '#757575'} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: isMyTurn ? '#E65100' : '#666' }
                  ]}>
                    {isMyTurn 
                      ? (sudahAbsenHariIni 
                          ? '✅ Anda sudah absen hari ini' 
                          : '🎯 Giliran Anda hari ini!')
                      : '👥 Bukan giliran Anda hari ini'
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tombol Absen */}
          {isMyTurn && !sudahAbsenHariIni && (
            <TouchableOpacity style={styles.absenButton} onPress={handleAbsen}>
              <Ionicons name="water" size={24} color="#FFFFFF" />
              <Text style={styles.absenButtonText}>Absen Menyiram</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Jadwal 7 Hari Mendatang */}
        <View style={styles.jadwalSection}>
          <Text style={styles.sectionTitle}>Jadwal 7 Hari Mendatang</Text>
          
          {jadwalAbsensi.slice(0, 7).map((jadwal, index) => (
            <View key={index} style={styles.jadwalItem}>
              <View style={styles.jadwalDate}>
                <Text style={styles.jadwalHari}>{getHari(jadwal.tanggal)}</Text>
                <Text style={styles.jadwalTanggal}>
                  {formatTanggal(jadwal.tanggal)}
                </Text>
              </View>
              
              <View style={styles.jadwalKeluarga}>
                <Text style={styles.jadwalNama}>
                  {jadwal.nama_keluarga}
                </Text>
                <Text style={styles.jadwalDetail}>
                  Keluarga #{jadwal.nomor_keluarga}
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(jadwal.status) }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {getStatusText(jadwal.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sistem Rotasi */}
        <View style={styles.sistemSection}>
          <Text style={styles.sectionTitle}>Sistem Rotasi</Text>
          <View style={styles.sistemCard}>
            <View style={styles.sistemItem}>
              <Ionicons name="refresh" size={20} color="#2E7D32" />
              <Text style={styles.sistemText}>Rotasi harian antar 5 keluarga</Text>
            </View>
            <View style={styles.sistemItem}>
              <Ionicons name="calendar" size={20} color="#2E7D32" />
              <Text style={styles.sistemText}>Setiap keluarga bertugas 1 hari</Text>
            </View>
            <View style={styles.sistemItem}>
              <Ionicons name="water" size={20} color="#2E7D32" />
              <Text style={styles.sistemText}>Menyiram tanaman sesuai jadwal</Text>
            </View>
            <View style={styles.sistemItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
              <Text style={styles.sistemText}>Absensi wajib saat giliran</Text>
            </View>
          </View>
        </View>

        {/* Daftar 5 Keluarga */}
        <View style={styles.keluargaSection}>
          <Text style={styles.sectionTitle}>5 Keluarga Pengurus</Text>
          <View style={styles.keluargaList}>
            {jadwalAbsensi.slice(0, 5).map((jadwal, index) => (
              <View key={index} style={styles.keluargaItem}>
                <View style={styles.keluargaAvatar}>
                  <Text style={styles.keluargaNumber}>
                    {jadwal.nomor_keluarga}
                  </Text>
                </View>
                <View style={styles.keluargaDetail}>
                  <Text style={styles.keluargaName}>
                    {jadwal.nama_keluarga}
                  </Text>
                  <Text style={styles.keluargaRole}>
                    {jadwal.id_user === user?.id_user ? '(Anda)' : ''}
                  </Text>
                </View>
                {jadwal.id_user === user?.id_user && (
                  <Ionicons name="person" size={16} color="#2E7D32" />
                )}
              </View>
            ))}
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
  keluargaBertugasCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  bertugasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bertugasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  keluargaInfo: {
    marginBottom: 12,
  },
  keluargaNama: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  keluargaNomor: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  absenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  absenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  jadwalSection: {
    padding: 16,
  },
  jadwalItem: {
    flexDirection: 'row',
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
  jadwalDate: {
    flex: 1,
  },
  jadwalHari: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  jadwalTanggal: {
    fontSize: 12,
    color: '#666',
  },
  jadwalKeluarga: {
    flex: 2,
  },
  jadwalNama: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  jadwalDetail: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sistemSection: {
    padding: 16,
  },
  sistemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sistemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sistemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  keluargaSection: {
    padding: 16,
    paddingBottom: 32,
  },
  keluargaList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  keluargaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  keluargaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keluargaNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  keluargaDetail: {
    flex: 1,
  },
  keluargaName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  keluargaRole: {
    fontSize: 12,
    color: '#2E7D32',
  },
});