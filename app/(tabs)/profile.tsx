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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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

interface NotifikasiData {
  _id: string;
  id_notifikasi: string;
  judul: string;
  pesan: string;
  tingkat: string;
  icon: string;
  is_read: boolean;
  created_at: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [kebunData, setKebunData] = useState<KebunData | null>(null);
  const [loadingKebun, setLoadingKebun] = useState(false);
  const [notifikasi, setNotifikasi] = useState<NotifikasiData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);

  // Fetch kebun data saat pertama kali load
  useEffect(() => {
    if (user?.id_kebun) {
      fetchKebunData(user.id_kebun);
    }
  }, [user]);

  // Refresh notifikasi setiap kali screen menjadi fokus
  // Ini memastikan notifikasi yang sudah dibaca akan ter-update
  useFocusEffect(
    useCallback(() => {
      if (user?.id_user) {
        fetchNotifikasi(user.id_user);
        console.log('[Profile] Screen focused - refreshing notifikasi');
      }
    }, [user?.id_user])
  );

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

  const fetchNotifikasi = async (userId: string) => {
    try {
      setLoadingNotif(true);
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/notifikasi/user/${userId}?limit=5`);
      const result = await response.json();
      
      if (result.success) {
        setNotifikasi(result.notifikasi);
        setUnreadCount(result.unread_count);
        console.log('[Profile] Notifikasi loaded:', result.notifikasi.length);
      } else {
        console.error('[Profile] Failed to load notifikasi:', result);
      }
    } catch (error) {
      console.error('[Profile] Error loading notifikasi:', error);
    } finally {
      setLoadingNotif(false);
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

  const handleHubungiTim = async () => {
    try {
      const phoneNumber = '6281336437117'; // Format internasional tanpa +
      const message = `Halo Tim Nutricomm! 👋

Saya membutuhkan bantuan terkait aplikasi Nutricomm.

*Nama:* ${user?.nama || 'User'}
*Email:* ${user?.email || '-'}
*Kebun:* ${kebunData?.nama_kebun || '-'}

Mohon bantuannya: <<pesan saya>>`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
      const whatsappWebUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      // Coba buka WhatsApp app dulu
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Jika WhatsApp app tidak tersedia, buka WhatsApp Web
        await Linking.openURL(whatsappWebUrl);
      }
    } catch (error) {
      console.error('[Profile] Error opening WhatsApp:', error);
      Alert.alert(
        'Error',
        'Tidak dapat membuka WhatsApp. Pastikan WhatsApp sudah terinstall.',
        [
          {
            text: 'OK'
          }
        ]
      );
    }
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

        {/* Notifikasi Terbaru */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text style={styles.sectionTitle}>Notifikasi Terbaru</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notifikasi')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          {loadingNotif ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color="#2E7D32" />
            </View>
          ) : notifikasi.length === 0 ? (
            <View style={styles.emptyNotifSection}>
              <Ionicons name="notifications-off-outline" size={32} color="#BDBDBD" />
              <Text style={styles.emptyNotifText}>Belum ada notifikasi</Text>
            </View>
          ) : (
            <View style={styles.notifContainer}>
              {notifikasi.map((notif) => (
                <TouchableOpacity
                  key={notif.id_notifikasi}
                  style={[styles.notifItem, !notif.is_read && styles.notifItemUnread]}
                  onPress={() => router.push('/(tabs)/notifikasi')}
                >
                  <View style={styles.notifIconContainer}>
                    <Ionicons 
                      name={notif.icon as any || 'notifications'} 
                      size={20} 
                      color={notif.tingkat === 'critical' ? '#F44336' : notif.tingkat === 'warning' ? '#FF9800' : '#2196F3'} 
                    />
                  </View>
                  <View style={styles.notifTextContainer}>
                    <Text style={styles.notifJudul} numberOfLines={1}>{notif.judul}</Text>
                    <Text style={styles.notifPesan} numberOfLines={1}>{notif.pesan}</Text>
                  </View>
                  {!notif.is_read && <View style={styles.notifDot} />}
                </TouchableOpacity>
              ))}
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} belum dibaca</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info Kebun */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Informasi Kebun</Text>
          </View>
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
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>
          </View>
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
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Pengaturan</Text>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/change-password')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="lock-closed" size={20} color="#666" />
                <Text style={styles.menuText}>Ubah Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleHubungiTim}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="logo-whatsapp" size={20} color="#666" />
                <Text style={styles.menuText}>Bantuan & Panduan</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/about')}
            >
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
    marginBottom: 20,
  },
  versionText: {
    color: '#999',
    fontSize: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    padding: 5,
  },
  notifContainer: {
    backgroundColor: '#FFFFFF',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notifItemUnread: {
    backgroundColor: '#F1F8F4',
  },
  notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifJudul: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notifPesan: {
    fontSize: 12,
    color: '#666',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
  emptyNotifSection: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    alignItems: 'center',
  },
  emptyNotifText: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 8,
  },
  unreadBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
});