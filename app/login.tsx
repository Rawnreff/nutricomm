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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { LoginData, DUMMY_USERS } from './types/auth';
import { useAuth } from './contexts/AuthContext';

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Harap isi semua field');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Format email tidak valid');
      return;
    }

    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        const user = DUMMY_USERS.find(u => u.email === formData.email);
        Alert.alert('Sukses', `Login berhasil! Selamat datang ${user?.nama}`);
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Error', 'Email atau password salah');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk login cepat dengan akun dummy
  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.title}>Nutricomm</Text>
          <Text style={styles.subtitle}>Kebun Gizi Keluarga</Text>
        </View>

        {/* Quick Login Section */}
        <View style={styles.quickLoginSection}>
          <Text style={styles.quickLoginTitle}>Login Cepat</Text>
          <View style={styles.quickLoginButtons}>
            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => quickLogin('budi@nutricomm.com', 'password123')}
            >
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.quickLoginText}>1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => quickLogin('sari@nutricomm.com', 'password123')}
            >
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.quickLoginText}>2</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => quickLogin('ahmad@nutricomm.com', 'password123')}
            >
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.quickLoginText}>3</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => quickLogin('maya@nutricomm.com', 'password123')}
            >
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.quickLoginText}>4</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => quickLogin('rina@nutricomm.com', 'password123')}
            >
              <Ionicons name="person" size={16} color="#2E7D32" />
              <Text style={styles.quickLoginText}>5</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ATAU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Login */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Masuk Manual</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan email Anda"
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
                placeholder="Masukkan password Anda"
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

          {/* Info Akun Demo */}
          <View style={styles.demoInfo}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.demoInfoText}>
              Gunakan salah satu akun demo di atas atau isi form manual
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Memproses...</Text>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Masuk</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Belum punya akun? </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Daftar di sini</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  quickLoginSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLoginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 6,
  },
  quickLoginText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
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
  inputIcon: {
    padding: 12,
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  demoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  demoInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
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
});