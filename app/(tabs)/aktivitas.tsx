import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';

interface AktivitasData {
  _id?: string;
  user_id: string;
  kebun_id: string;
  nama_user: string;
  jenis_aktivitas: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  foto?: string[];
}

const JENIS_AKTIVITAS_OPTIONS = [
  { value: 'Menyiram tanaman', icon: 'water' },
  { value: 'Memberi pupuk', icon: 'nutrition' },
  { value: 'Membersihkan gulma', icon: 'cut' },
  { value: 'Memanen', icon: 'leaf' },
  { value: 'Menanam', icon: 'flower' },
  { value: 'Menyiangi', icon: 'hand-left' },
  { value: 'Menggemburkan tanah', icon: 'egg' },
];

export default function AktivitasScreen() {
  const { user, kebun } = useAuth();
  const [aktivitasList, setAktivitasList] = useState<AktivitasData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [canAddAktivitas, setCanAddAktivitas] = useState(false);
  const [formData, setFormData] = useState({
    jenis_aktivitas: [] as string[],
    aktivitas_lainnya: '',
    deskripsi: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      checkAbsensiStatus(),
      loadAktivitas()
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const checkAbsensiStatus = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/absensi/status?user_id=${user?.id_user}&kebun_id=${user?.id_kebun}`
      );
      const data = await response.json();
      
      // Hanya yang check-in hari ini yang bisa tambah aktivitas
      if (data.success && data.has_checked_in && data.is_my_absensi) {
        setCanAddAktivitas(true);
      } else {
        setCanAddAktivitas(false);
      }
    } catch (error) {
      console.error('[Aktivitas] Error checking absensi:', error);
      setCanAddAktivitas(false);
    }
  };

  const loadAktivitas = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/aktivitas/kebun/${user?.id_kebun}/today`
      );
      const data = await response.json();
      
      if (data.success) {
        setAktivitasList(data.aktivitas);
      }
    } catch (error) {
      console.error('[Aktivitas] Error loading aktivitas:', error);
    }
  };

  const handleTambahAktivitas = async () => {
    if (formData.jenis_aktivitas.length === 0 && !formData.aktivitas_lainnya.trim()) {
      Alert.alert('Error', 'Harap pilih atau isi minimal satu jenis aktivitas');
      return;
    }

    try {
      setLoading(true);
      const backendUrl = appConfig.getBackendUrl();
      
      // Gabungkan aktivitas yang dipilih dengan "Lainnya"
      let allAktivitas = [...formData.jenis_aktivitas];
      if (formData.aktivitas_lainnya.trim()) {
        allAktivitas.push(formData.aktivitas_lainnya.trim());
      }
      
      const jenisAktivitasString = allAktivitas.join(', ');
      
      const response = await fetch(`${backendUrl}/api/aktivitas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id_user,
          kebun_id: user?.id_kebun,
          nama_user: user?.nama,
          jenis_aktivitas: jenisAktivitasString,
          deskripsi: formData.deskripsi
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Reset form dan tutup modal terlebih dahulu
        setFormData({ jenis_aktivitas: [], aktivitas_lainnya: '', deskripsi: '' });
        setModalVisible(false);
        
        // Reload data
        await loadAktivitas();
        
        // Show success message
        Alert.alert(
          'Sukses! ✅',
          'Aktivitas berhasil ditambahkan!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.error || 'Gagal menambahkan aktivitas');
      }
    } catch (error) {
      console.error('[Aktivitas] Error adding aktivitas:', error);
      Alert.alert('Error', 'Gagal menambahkan aktivitas');
    } finally {
      setLoading(false);
    }
  };

  const toggleAktivitas = (value: string) => {
    setFormData(prev => {
      const currentAktivitas = [...prev.jenis_aktivitas];
      const index = currentAktivitas.indexOf(value);
      
      if (index > -1) {
        // Remove if already selected
        currentAktivitas.splice(index, 1);
      } else {
        // Add if not selected
        currentAktivitas.push(value);
      }
      
      return { ...prev, jenis_aktivitas: currentAktivitas };
    });
  };

  const handleOpenModal = () => {
    if (!canAddAktivitas) {
      Alert.alert(
        'Tidak Bisa Menambah Aktivitas',
        'Hanya petugas yang check-in hari ini yang bisa menambahkan aktivitas. Silakan check-in terlebih dahulu di halaman Absensi.',
        [{ text: 'Mengerti' }]
      );
      return;
    }
    
    // Reset form sebelum buka modal
    setFormData({ jenis_aktivitas: [], aktivitas_lainnya: '', deskripsi: '' });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    // Reset form saat tutup modal
    setFormData({ jenis_aktivitas: [], aktivitas_lainnya: '', deskripsi: '' });
    setModalVisible(false);
  };

  const formatWaktu = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTanggal = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getIconForKegiatan = (jenis: string) => {
    // Jika multiple aktivitas, ambil yang pertama
    const firstActivity = jenis.split(',')[0].trim();
    const option = JENIS_AKTIVITAS_OPTIONS.find(opt => opt.value === firstActivity);
    return option ? option.icon as any : 'leaf';
  };

  const renderAktivitasItem = ({ item }: { item: AktivitasData }) => (
    <View style={styles.aktivitasItem}>
      <View style={styles.aktivitasIcon}>
        <Ionicons 
          name={getIconForKegiatan(item.jenis_aktivitas)} 
          size={24} 
          color="#2E7D32" 
        />
      </View>
      <View style={styles.aktivitasContent}>
        <Text style={styles.aktivitasKegiatan}>{item.jenis_aktivitas}</Text>
        <View style={styles.aktivitasMetaRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.aktivitasUser}>{item.nama_user}</Text>
          <Ionicons name="time-outline" size={14} color="#666" style={{ marginLeft: 12 }} />
          <Text style={styles.aktivitasWaktu}>{formatWaktu(item.waktu)}</Text>
        </View>
        {item.deskripsi && (
          <Text style={styles.aktivitasKeterangan}>{item.deskripsi}</Text>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Aktivitas Kebun</Text>
          <Text style={styles.headerSubtitle}>{kebun?.nama_kebun || 'Kebun Gizi'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aktivitas Hari Ini</Text>
        <Text style={styles.headerSubtitle}>{kebun?.nama_kebun || 'Kebun Gizi'}</Text>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[
          styles.fab,
          !canAddAktivitas && styles.fabDisabled
        ]}
        onPress={handleOpenModal}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Daftar Aktivitas */}
      <FlatList
        data={aktivitasList}
        renderItem={renderAktivitasItem}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyStateTitle}>Belum ada aktivitas hari ini</Text>
            <Text style={styles.emptyStateText}>
              {canAddAktivitas 
                ? 'Tekan tombol + untuk menambah aktivitas'
                : 'Check-in terlebih dahulu untuk menambah aktivitas'}
            </Text>
          </View>
        }
      />

      {/* Modal Tambah Aktivitas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Aktivitas</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Aktivitas * (Pilih satu atau lebih)</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.jenisAktivitasScroll}
              >
                {JENIS_AKTIVITAS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.jenisAktivitasOption,
                      formData.jenis_aktivitas.includes(option.value) && styles.jenisAktivitasOptionActive
                    ]}
                    onPress={() => toggleAktivitas(option.value)}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={formData.jenis_aktivitas.includes(option.value) ? '#FFFFFF' : '#2E7D32'} 
                    />
                    <Text style={[
                      styles.jenisAktivitasText,
                      formData.jenis_aktivitas.includes(option.value) && styles.jenisAktivitasTextActive
                    ]}>
                      {option.value}
                    </Text>
                    {formData.jenis_aktivitas.includes(option.value) && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color="#FFFFFF" 
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Show selected count */}
              {formData.jenis_aktivitas.length > 0 && (
                <Text style={styles.selectedCount}>
                  {formData.jenis_aktivitas.length} aktivitas dipilih
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Aktivitas Lainnya (Opsional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Memangkas tanaman, Membuat kompos..."
                value={formData.aktivitas_lainnya}
                onChangeText={(text) => setFormData(prev => ({ ...prev, aktivitas_lainnya: text }))}
              />
              <Text style={styles.helperText}>
                Isi jika ada aktivitas lain yang tidak ada di pilihan
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Deskripsi Detail (Opsional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tambahkan detail aktivitas yang dilakukan..."
                value={formData.deskripsi}
                onChangeText={(text) => setFormData(prev => ({ ...prev, deskripsi: text }))}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleTambahAktivitas}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Simpan Aktivitas</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  aktivitasItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aktivitasIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aktivitasContent: {
    flex: 1,
  },
  aktivitasKegiatan: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  aktivitasMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  aktivitasUser: {
    fontSize: 12,
    color: '#666',
  },
  aktivitasWaktu: {
    fontSize: 12,
    color: '#666',
  },
  aktivitasKeterangan: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  aktivitasTanggal: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  fabDisabled: {
    backgroundColor: '#B0B0B0',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  jenisAktivitasScroll: {
    marginVertical: 8,
  },
  jenisAktivitasOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  jenisAktivitasOptionActive: {
    backgroundColor: '#2E7D32',
  },
  jenisAktivitasText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  jenisAktivitasTextActive: {
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});