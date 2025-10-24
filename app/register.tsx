import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { RegisterData } from './types/auth';
import { appConfig } from './services/config';

interface Kebun {
  _id?: string;
  id_kebun: string;
  nama_kebun: string;
  lokasi: string;
  luas?: string;
  jenis_tanaman?: string[];
  deskripsi?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  keluarga_terdaftar?: number;
  kapasitas_kebun?: number;
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterData>({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    id_kebun: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingKebun, setLoadingKebun] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kebunModalVisible, setKebunModalVisible] = useState(false);
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [selectedKebun, setSelectedKebun] = useState<Kebun | null>(null);

  // Fetch kebun dari backend saat component mount
  useEffect(() => {
    fetchKebun();
  }, []);

  const fetchKebun = async () => {
    try {
      setLoadingKebun(true);
      const backendUrl = appConfig.getBackendUrl();
      console.log(`[Register] Fetching kebun from: ${backendUrl}/api/kebun`);
      
      const response = await fetch(`${backendUrl}/api/kebun`);
      const result = await response.json();
      
      if (response.ok && result.success && result.kebun) {
        setKebunList(result.kebun);
        if (result.kebun.length > 0) {
          setSelectedKebun(result.kebun[0]);
          setFormData(prev => ({ ...prev, id_kebun: result.kebun[0].id_kebun }));
        }
        console.log(`[Register] Loaded ${result.kebun.length} kebun`);
      } else {
        console.error('[Register] Failed to fetch kebun:', result);
        Alert.alert('Error', 'Gagal memuat data kebun. Pastikan server backend sudah berjalan.');
      }
    } catch (error) {
      console.error('[Register] Fetch kebun error:', error);
      Alert.alert('Error', 'Gagal terhubung ke server. Pastikan server backend sudah berjalan.');
    } finally {
      setLoadingKebun(false);
    }
  };

  const handleRegister = async () => {
    // Validasi form
    if (!formData.nama || !formData.email || !formData.password || !formData.confirmPassword || !formData.id_kebun) {
      Alert.alert('Error', 'Harap isi semua field');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak cocok');
      return;
    }

    if (!selectedKebun) {
      Alert.alert('Error', 'Harap pilih kebun');
      return;
    }

    setLoading(true);

    try {
      // Call backend API untuk register
      const backendUrl = appConfig.getBackendUrl();
      console.log(`[Register] Registering user to: ${backendUrl}/api/user/register`);
      
      // Generate username dari email
      const username = formData.email.split('@')[0];
      
      const response = await fetch(`${backendUrl}/api/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: formData.nama,
          email: formData.email,
          username: username,
          password: formData.password,
          role: 'user',
          kebun_id: formData.id_kebun,
        }),
      });

      const result = await response.json();
      console.log('[Register] Response:', result);

      if (response.ok && result.success) {
        Alert.alert(
          'Sukses', 
          'Registrasi berhasil! Silakan login dengan akun Anda.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('[Register] Error:', error);
      Alert.alert('Error', 'Gagal terhubung ke server. Pastikan server backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKebun = (kebun: Kebun) => {
    setSelectedKebun(kebun);
    setFormData(prev => ({ ...prev, id_kebun: kebun.id_kebun }));
    setKebunModalVisible(false);
  };

  const renderKebunItem = ({ item }: { item: Kebun }) => (
    <TouchableOpacity 
      style={[
        styles.kebunItem,
        selectedKebun?.id_kebun === item.id_kebun && styles.kebunItemSelected
      ]}
      onPress={() => handleSelectKebun(item)}
    >
      <View style={styles.kebunInfo}>
        <Text style={styles.kebunName}>{item.nama_kebun}</Text>
        <Text style={styles.kebunLocation}>{item.lokasi}</Text>
        <View style={styles.capacityRow}>
          <Text style={styles.kebunDetails}>
            {item.luas ? `Luas: ${item.luas}` : ''}
          </Text>
          {item.kapasitas_kebun !== undefined && item.keluarga_terdaftar !== undefined && (
            <View style={[
              styles.capacityBadge,
              item.keluarga_terdaftar >= item.kapasitas_kebun && styles.capacityBadgeFull
            ]}>
              <Text style={[
                styles.capacityText,
                item.keluarga_terdaftar >= item.kapasitas_kebun && styles.capacityTextFull
              ]}>
                {item.keluarga_terdaftar}/{item.kapasitas_kebun} keluarga
              </Text>
            </View>
          )}
        </View>
      </View>
      {selectedKebun?.id_kebun === item.id_kebun && (
        <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
      )}
      {item.kapasitas_kebun !== undefined && item.keluarga_terdaftar !== undefined && 
       item.keluarga_terdaftar >= item.kapasitas_kebun && (
        <View style={styles.fullBadge}>
          <Text style={styles.fullBadgeText}>PENUH</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Daftar Akun Baru</Text>
          <Text style={styles.subtitle}>Bergabung dengan kebun gizi keluarga</Text>
        </View>

        {/* Form Register */}
        <View style={styles.formContainer}>
          {/* Nama Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap Keluarga</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Keluarga Budi Santoso"
                value={formData.nama}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nama: text }))}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan email"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pilih Kebun */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pilih Kebun</Text>
            <TouchableOpacity 
              style={styles.kebunSelector}
              onPress={() => setKebunModalVisible(true)}
            >
              <View style={styles.kebunSelectorContent}>
                <Ionicons name="leaf-outline" size={20} color="#666" />
                <Text style={styles.kebunSelectorText}>
                  {selectedKebun ? selectedKebun.nama_kebun : 'Pilih kebun gizi...'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            
            {selectedKebun && (
              <View style={styles.selectedKebunInfo}>
                <Text style={styles.selectedKebunText}>
                  {selectedKebun.lokasi} {selectedKebun.luas && `• ${selectedKebun.luas}`}
                </Text>
                {selectedKebun.kapasitas_kebun !== undefined && selectedKebun.keluarga_terdaftar !== undefined && (
                  <Text style={[
                    styles.selectedKebunCapacity,
                    selectedKebun.keluarga_terdaftar >= selectedKebun.kapasitas_kebun && styles.selectedKebunCapacityFull
                  ]}>
                    Kapasitas: {selectedKebun.keluarga_terdaftar}/{selectedKebun.kapasitas_kebun} keluarga
                    {selectedKebun.keluarga_terdaftar >= selectedKebun.kapasitas_kebun && ' (Penuh!)'}
                  </Text>
                )}
                {selectedKebun.deskripsi && (
                  <Text style={styles.selectedKebunDescription}>
                    {selectedKebun.deskripsi}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerButton, (loading || loadingKebun || kebunList.length === 0) && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading || loadingKebun || kebunList.length === 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Daftar Sekarang</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Masuk di sini</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Modal Pilih Kebun */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={kebunModalVisible}
          onRequestClose={() => setKebunModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Kebun Gizi</Text>
                <TouchableOpacity onPress={() => setKebunModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {loadingKebun ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.loadingText}>Memuat data kebun...</Text>
                </View>
              ) : kebunList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="leaf-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>Tidak ada kebun tersedia</Text>
                  <Text style={styles.emptySubtext}>Hubungi admin untuk mendaftarkan kebun baru</Text>
                </View>
              ) : (
                <FlatList
                  data={kebunList}
                  renderItem={renderKebunItem}
                  keyExtractor={(item) => item.id_kebun}
                  contentContainerStyle={styles.kebunList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  formContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    padding: 12,
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  kebunSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    padding: 12,
  },
  kebunSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kebunSelectorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  selectedKebunInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  selectedKebunText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  selectedKebunCapacity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoAccounts: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  demoAccountsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  accountList: {
    gap: 8,
  },
  accountItem: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accountEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  accountPassword: {
    fontSize: 11,
    color: '#666',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  kebunList: {
    padding: 16,
  },
  kebunItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  kebunItemSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },
  kebunInfo: {
    flex: 1,
  },
  kebunName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  kebunLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  kebunDetails: {
    fontSize: 12,
    color: '#999',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  capacityBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  capacityBadgeFull: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E74C3C',
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  capacityTextFull: {
    color: '#E74C3C',
  },
  fullBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fullBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedKebunCapacityFull: {
    color: '#E74C3C',
    fontWeight: '600',
  },
  selectedKebunDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  eyeIcon: {
    padding: 12,
  },
});