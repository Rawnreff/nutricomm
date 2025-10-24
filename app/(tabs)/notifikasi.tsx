import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { appConfig } from '../services/config';

interface NotifikasiData {
  _id: string;
  id_notifikasi: string;
  user_id: string;
  kebun_id: string;
  jenis: string;
  kategori: string;
  judul: string;
  pesan: string;
  tingkat: string;
  icon: string;
  is_read: boolean;
  sensor_data?: any;
  created_at: string;
  read_at?: string;
}

export default function NotifikasiScreen() {
  const { user } = useAuth();
  const [notifikasi, setNotifikasi] = useState<NotifikasiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      loadNotifikasi();
    }
  }, [user]);

  const loadNotifikasi = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/notifikasi/user/${user?.id_user}?limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setNotifikasi(data.notifikasi);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('[Notifikasi] Error loading notifikasi:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifikasi();
    setRefreshing(false);
  };

  const markAsRead = async (idNotifikasi: string) => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/notifikasi/${idNotifikasi}/read`,
        { method: 'PUT' }
      );
      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifikasi(prev =>
          prev.map(notif =>
            notif.id_notifikasi === idNotifikasi
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[Notifikasi] Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const backendUrl = appConfig.getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/notifikasi/user/${user?.id_user}/read-all`,
        { method: 'PUT' }
      );
      const data = await response.json();

      if (data.success) {
        // Reload notifikasi
        await loadNotifikasi();
        Alert.alert('Berhasil', 'Semua notifikasi telah ditandai sebagai dibaca');
      }
    } catch (error) {
      console.error('[Notifikasi] Error marking all as read:', error);
      Alert.alert('Error', 'Gagal menandai notifikasi sebagai dibaca');
    }
  };

  const deleteNotifikasi = async (idNotifikasi: string) => {
    Alert.alert(
      'Hapus Notifikasi',
      'Apakah Anda yakin ingin menghapus notifikasi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const backendUrl = appConfig.getBackendUrl();
              const response = await fetch(
                `${backendUrl}/api/notifikasi/${idNotifikasi}`,
                { method: 'DELETE' }
              );
              const data = await response.json();

              if (data.success) {
                setNotifikasi(prev =>
                  prev.filter(notif => notif.id_notifikasi !== idNotifikasi)
                );
              }
            } catch (error) {
              console.error('[Notifikasi] Error deleting notifikasi:', error);
            }
          }
        }
      ]
    );
  };

  const getNotificationColor = (tingkat: string) => {
    switch (tingkat) {
      case 'critical':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredNotifikasi = selectedFilter === 'all' 
    ? notifikasi 
    : notifikasi.filter(n => !n.is_read);

  const NotificationItem = ({ item }: { item: NotifikasiData }) => (
    <TouchableOpacity
      style={[
        styles.notifCard,
        !item.is_read && styles.notifCardUnread
      ]}
      onPress={() => {
        if (!item.is_read) {
          markAsRead(item.id_notifikasi);
        }
      }}
      onLongPress={() => deleteNotifikasi(item.id_notifikasi)}
    >
      <View style={[
        styles.notifIcon,
        { backgroundColor: `${getNotificationColor(item.tingkat)}20` }
      ]}>
        <Ionicons
          name={item.icon as any || 'notifications'}
          size={24}
          color={getNotificationColor(item.tingkat)}
        />
      </View>
      
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={styles.notifJudul} numberOfLines={1}>
            {item.judul}
          </Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notifPesan} numberOfLines={2}>
          {item.pesan}
        </Text>
        
        <View style={styles.notifFooter}>
          <Text style={styles.notifTime}>{formatTime(item.created_at)}</Text>
          {item.sensor_data && (
            <View style={styles.sensorBadge}>
              <Ionicons name="analytics" size={12} color="#666" />
              <Text style={styles.sensorBadgeText}>Data Sensor</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          <Text style={styles.headerSubtitle}>Riwayat Pemberitahuan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Memuat notifikasi...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifikasi</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua terbaca'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.markAllText}>Tandai Semua</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'all' && styles.filterTabTextActive
          ]}>
            Semua ({notifikasi.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'unread' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('unread')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'unread' && styles.filterTabTextActive
          ]}>
            Belum Dibaca ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifikasi List */}
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
      >
        {filteredNotifikasi.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyStateTitle}>
              {selectedFilter === 'all' ? 'Belum ada notifikasi' : 'Tidak ada notifikasi baru'}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'Notifikasi akan muncul di sini ketika ada pembaruan'
                : 'Semua notifikasi sudah dibaca'}
            </Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {filteredNotifikasi.map((item) => (
              <NotificationItem key={item.id_notifikasi} item={item} />
            ))}
          </View>
        )}
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 4,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#2E7D32',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notifList: {
    padding: 16,
    paddingBottom: 32,
  },
  notifCard: {
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
  notifCardUnread: {
    backgroundColor: '#F1F8F4',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifJudul: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
    marginLeft: 8,
  },
  notifPesan: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTime: {
    fontSize: 12,
    color: '#999',
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sensorBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
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
});

