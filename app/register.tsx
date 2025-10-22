import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { RegisterData, DUMMY_KEBUN } from './types/auth';

export default function RegisterScreen() {
  const [formData, setFormData] = useState<RegisterData>({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    id_kebun: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [kebunModalVisible, setKebunModalVisible] = useState(false);
  const [selectedKebun, setSelectedKebun] = useState(DUMMY_KEBUN[0]); // Default pilih kebun pertama

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

    // Cek kapasitas kebun
    if (selectedKebun.keluarga_terdaftar >= selectedKebun.kapasitas_keluarga) {
      Alert.alert('Error', 'Kebun yang dipilih sudah penuh. Silakan pilih kebun lain.');
      return;
    }

    setLoading(true);

    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Untuk demo, kita batasi registrasi hanya untuk kebun yang ada
      Alert.alert(
        'Info Demo', 
        'Fitur registrasi dinonaktifkan dalam mode demo. Gunakan akun demo yang tersedia:\n\nbudi@nutricomm.com / password123\nsari@nutricomm.com / password123'
      );
    } catch (error) {
      Alert.alert('Error', 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKebun = (kebun: typeof DUMMY_KEBUN[0]) => {
    setSelectedKebun(kebun);
    setFormData(prev => ({ ...prev, id_kebun: kebun.id_kebun }));
    setKebunModalVisible(false);
  };

  const renderKebunItem = ({ item }: { item: typeof DUMMY_KEBUN[0] }) => (
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
        <Text style={styles.kebunDetails}>
          Luas: {item.luas} • Kapasitas: {item.keluarga_terdaftar}/{item.kapasitas_keluarga} keluarga
        </Text>
      </View>
      {selectedKebun?.id_kebun === item.id_kebun && (
        <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
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

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={20} color="#E65100" />
          <Text style={styles.demoNoticeText}>
            Mode Demo: Registrasi dinonaktifkan. Gunakan akun demo yang tersedia.
          </Text>
        </View>

        {/* Form Register (Disabled dalam demo) */}
        <View style={styles.formContainer}>
          {/* Nama Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.disabledText]}
                placeholder="Fitur dinonaktifkan dalam demo"
                value={formData.nama}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nama: text }))}
                autoCapitalize="words"
                editable={false}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.disabledText]}
                placeholder="Fitur dinonaktifkan dalam demo"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.disabledText]}
                placeholder="Fitur dinonaktifkan dalam demo"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={false}
              />
            </View>
          </View>

          {/* Pilih Kebun (Masih aktif untuk demo pilihan kebun) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pilih Kebun (Demo)</Text>
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
                  {selectedKebun.lokasi} • {selectedKebun.luas}
                </Text>
                <Text style={styles.selectedKebunCapacity}>
                  Kapasitas: {selectedKebun.keluarga_terdaftar}/{selectedKebun.kapasitas_keluarga} keluarga
                </Text>
              </View>
            )}
          </View>

          {/* Register Button (Disabled) */}
          <TouchableOpacity 
            style={[styles.registerButton, styles.disabledButton]}
            onPress={handleRegister}
            disabled={true}
          >
            <Text style={styles.registerButtonText}>Registrasi Dinonaktifkan (Demo)</Text>
          </TouchableOpacity>

          {/* Info Akun Demo */}
          <View style={styles.demoAccounts}>
            <Text style={styles.demoAccountsTitle}>Gunakan Akun Demo:</Text>
            <View style={styles.accountList}>
              <View style={styles.accountItem}>
                <Text style={styles.accountEmail}>budi@nutricomm.com</Text>
                <Text style={styles.accountPassword}>Password: password123</Text>
              </View>
              <View style={styles.accountItem}>
                <Text style={styles.accountEmail}>sari@nutricomm.com</Text>
                <Text style={styles.accountPassword}>Password: password123</Text>
              </View>
            </View>
          </View>

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
                <Text style={styles.modalTitle}>Pilih Kebun Gizi (Demo)</Text>
                <TouchableOpacity onPress={() => setKebunModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={DUMMY_KEBUN}
                renderItem={renderKebunItem}
                keyExtractor={(item) => item.id_kebun}
                contentContainerStyle={styles.kebunList}
                showsVerticalScrollIndicator={false}
              />
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
    paddingTop: 60,
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
});