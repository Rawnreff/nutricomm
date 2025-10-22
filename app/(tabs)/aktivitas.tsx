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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Aktivitas } from '../types';

export default function AktivitasScreen() {
  const [aktivitasList, setAktivitasList] = useState<Aktivitas[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    kegiatan: '',
    keterangan: '',
  });

  useEffect(() => {
    loadAktivitas();
  }, []);

  const loadAktivitas = async () => {
    // Simulasi data
    const mockAktivitas: Aktivitas[] = [
      {
        id_user: 'user1',
        id_kebun: 'KBG001',
        kegiatan: 'Menyiram tanaman',
        tanggal: '2025-10-20T08:30:00Z',
        keterangan: 'Menyiram semua tanaman pagi hari'
      },
      {
        id_user: 'user2',
        id_kebun: 'KBG001',
        kegiatan: 'Memberi pupuk organik',
        tanggal: '2025-10-19T15:20:00Z',
        keterangan: 'Pupuk kompos untuk tanaman sayuran'
      },
      {
        id_user: 'user1',
        id_kebun: 'KBG001',
        kegiatan: 'Membersihkan gulma',
        tanggal: '2025-10-18T10:15:00Z',
      },
    ];
    setAktivitasList(mockAktivitas);
  };

  const handleTambahAktivitas = async () => {
    if (!formData.kegiatan.trim()) {
      Alert.alert('Error', 'Harap isi jenis kegiatan');
      return;
    }

    try {
      const newAktivitas: Aktivitas = {
        id_user: 'user1',
        id_kebun: 'KBG001',
        kegiatan: formData.kegiatan,
        tanggal: new Date().toISOString(),
        keterangan: formData.keterangan,
      };

      setAktivitasList(prev => [newAktivitas, ...prev]);
      setFormData({ kegiatan: '', keterangan: '' });
      setModalVisible(false);
      
      Alert.alert('Sukses', 'Aktivitas berhasil ditambahkan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan aktivitas');
    }
  };

  const formatWaktu = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIconForKegiatan = (kegiatan: string) => {
    const lowerKegiatan = kegiatan.toLowerCase();
    if (lowerKegiatan.includes('siram')) return 'water';
    if (lowerKegiatan.includes('pupuk')) return 'nutrition';
    if (lowerKegiatan.includes('gulma') || lowerKegiatan.includes('bersih')) return 'cut';
    if (lowerKegiatan.includes('panen')) return 'leaf';
    return 'leaf';
  };

  const renderAktivitasItem = ({ item }: { item: Aktivitas }) => (
    <View style={styles.aktivitasItem}>
      <View style={styles.aktivitasIcon}>
        <Ionicons 
          name={getIconForKegiatan(item.kegiatan) as any} 
          size={24} 
          color="#2E7D32" 
        />
      </View>
      <View style={styles.aktivitasContent}>
        <Text style={styles.aktivitasKegiatan}>{item.kegiatan}</Text>
        {item.keterangan && (
          <Text style={styles.aktivitasKeterangan}>{item.keterangan}</Text>
        )}
        <Text style={styles.aktivitasTanggal}>
          {formatWaktu(item.tanggal)}
        </Text>
      </View>
      <View style={styles.aktivitasUser}>
        <Ionicons name="person" size={16} color="#757575" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aktivitas Kebun</Text>
        <Text style={styles.headerSubtitle}>Catatan kegiatan keluarga</Text>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Daftar Aktivitas */}
      <FlatList
        data={aktivitasList}
        renderItem={renderAktivitasItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="leaf" size={64} color="#BDBDBD" />
            <Text style={styles.emptyStateTitle}>Belum ada aktivitas</Text>
            <Text style={styles.emptyStateText}>
              Mulai catat kegiatan kebun keluarga Anda
            </Text>
          </View>
        }
      />

      {/* Modal Tambah Aktivitas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Aktivitas</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Kegiatan</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Menyiram, Memberi pupuk, Membersihkan gulma"
                value={formData.kegiatan}
                onChangeText={(text) => setFormData(prev => ({ ...prev, kegiatan: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Keterangan (Opsional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Tambahkan catatan detail kegiatan..."
                value={formData.keterangan}
                onChangeText={(text) => setFormData(prev => ({ ...prev, keterangan: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleTambahAktivitas}
            >
              <Text style={styles.submitButtonText}>Simpan Aktivitas</Text>
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
    marginBottom: 4,
  },
  aktivitasKeterangan: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    width: 220,
  },
  aktivitasTanggal: {
    fontSize: 12,
    color: '#999',
  },
  aktivitasUser: {
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});