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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';

interface KebunData {
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
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [kebunData, setKebunData] = useState<KebunData | null>(null);
  const [loadingKebun, setLoadingKebun] = useState(false);

  // Fetch kebun data from backend
  useEffect(() => {
    if (user?.id_kebun) {
      fetchKebunData(user.id_kebun);
    }
  }, [user]);

  const fetchKebunData = async (kebunId: string) => {
    try {
      setLoadingKebun(true);
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/kebun/by-id/${kebunId}`);
      const result = await response.json();
      
      if (response.ok && result.success && result.kebun) {
        setKebunData(result.kebun);
        console.log('[Profile] Kebun data loaded:', result.kebun);
      } else {
        console.error('[Profile] Failed to load kebun:', result);
      }
    } catch (error) {
      console.error('[Profile] Error loading kebun:', error);
    } finally {
      setLoadingKebun(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      [
        { 
          text: 'Batal', 
          style: 'cancel' 
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('[Profile] Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const ProfileItem = ({ 
    icon, 
    label, 
    value 
  }: { 
    icon: string; 
    label: string; 
    value: string 
  }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon as any} size={20} color="#666" />
        <Text style={styles.profileLabel}>{label}</Text>
      </View>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );

  // Jika tidak ada user, tampilkan loading
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="leaf" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{user.nama}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Info Kebun */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Kebun</Text>
          {loadingKebun ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.loadingText}>Memuat data kebun...</Text>
            </View>
          ) : (
            <View style={styles.sectionContent}>
              <ProfileItem 
                icon="business" 
                label="Nama Kebun" 
                value={kebunData?.nama_kebun || 'Tidak tersedia'} 
              />
              <ProfileItem 
                icon="location" 
                label="Lokasi" 
                value={kebunData?.lokasi || 'Tidak tersedia'} 
              />
              <ProfileItem 
                icon="resize" 
                label="Luas" 
                value={kebunData?.luas || 'Tidak tersedia'} 
              />
              <ProfileItem 
                icon="key" 
                label="ID Kebun" 
                value={user.id_kebun} 
              />
              {kebunData?.jenis_tanaman && kebunData.jenis_tanaman.length > 0 && (
                <ProfileItem 
                  icon="leaf" 
                  label="Jenis Tanaman" 
                  value={`${kebunData.jenis_tanaman.length} jenis`} 
                />
              )}
              {kebunData?.deskripsi && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Deskripsi:</Text>
                  <Text style={styles.descriptionText}>{kebunData.deskripsi}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <View style={styles.sectionContent}>
            <ProfileItem 
              icon="person" 
              label="Nama Keluarga" 
              value={user.nama} 
            />
          </View>
        </View>

        {/* Menu Lainnya */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="notifications" size={20} color="#666" />
                <Text style={styles.menuText}>Notifikasi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="lock-closed" size={20} color="#666" />
                <Text style={styles.menuText}>Ubah Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="help-circle" size={20} color="#666" />
                <Text style={styles.menuText}>Bantuan & Panduan</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="information-circle" size={20} color="#666" />
                <Text style={styles.menuText}>Tentang Aplikasi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Nutricomm v1.0.0</Text>
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
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    paddingTop: 70,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadingSection: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  descriptionLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    color: '#999',
    fontSize: 14,
  },
});