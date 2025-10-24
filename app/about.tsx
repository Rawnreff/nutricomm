import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AboutScreen() {
  const APP_VERSION = '1.0.0';
  const RELEASE_DATE = 'Oktober 2024';

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = '6281336437117';
    const message = encodeURIComponent('Halo Tim Nutricomm! Saya ingin tahu lebih lanjut tentang aplikasi ini.');
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    handleOpenLink(url);
  };

  const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon as any} size={28} color="#2E7D32" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );

  const TeamMember = ({ name, role, icon }: { name: string; role: string; icon: string }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamIcon}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.teamName}>{name}</Text>
      <Text style={styles.teamRole}>{role}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <View style={styles.appIconContainer}>
            <Ionicons name="leaf" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>Nutricomm</Text>
          <Text style={styles.appTagline}>Sistem Monitoring Kebun Gizi Berbasis IoT</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tentang Nutricomm</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              Nutricomm adalah aplikasi monitoring kebun gizi yang memanfaatkan teknologi IoT dan sensor untuk membantu pengelolaan kebun komunitas secara efektif dan efisien.
            </Text>
            <Text style={[styles.descriptionText, { marginTop: 12 }]}>
              Dengan Nutricomm, Anda dapat memantau kondisi lingkungan kebun secara real-time, mencatat aktivitas harian, dan mengelola absensi petugas dengan mudah.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitur Utama</Text>
          <FeatureCard
            icon="speedometer"
            title="Dashboard Real-time"
            description="Monitor kondisi kebun dengan data sensor suhu, kelembapan, cahaya, dan CO₂ secara real-time"
          />
          <FeatureCard
            icon="calendar"
            title="Absensi Digital"
            description="Sistem absensi check-in/check-out untuk petugas kebun dengan validasi waktu"
          />
          <FeatureCard
            icon="leaf"
            title="Catatan Aktivitas"
            description="Catat semua aktivitas kebun seperti menyiram, memberi pupuk, dan memanen"
          />
          <FeatureCard
            icon="notifications"
            title="Notifikasi Cerdas"
            description="Dapatkan pemberitahuan otomatis untuk kondisi kebun yang memerlukan perhatian"
          />
        </View>

        {/* Technology Stack */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teknologi</Text>
          <View style={styles.techCard}>
            <View style={styles.techRow}>
              <View style={styles.techItem}>
                <Ionicons name="hardware-chip" size={24} color="#2E7D32" />
                <Text style={styles.techText}>IoT Sensors</Text>
              </View>
              <View style={styles.techItem}>
                <Ionicons name="phone-portrait" size={24} color="#2E7D32" />
                <Text style={styles.techText}>React Native</Text>
              </View>
            </View>
            <View style={styles.techRow}>
              <View style={styles.techItem}>
                <Ionicons name="server" size={24} color="#2E7D32" />
                <Text style={styles.techText}>Flask API</Text>
              </View>
              <View style={styles.techItem}>
                <Ionicons name="analytics" size={24} color="#2E7D32" />
                <Text style={styles.techText}>MongoDB</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tim Pengembang</Text>
          <View style={styles.teamContainer}>
            <TeamMember name="Backend Team" role="API & Database" icon="code-slash" />
            <TeamMember name="Frontend Team" role="Mobile App" icon="phone-portrait" />
            <TeamMember name="Hardware Team" role="IoT & Sensors" icon="hardware-chip" />
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hubungi Kami</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.contactInfo}>
              <Ionicons name="call" size={20} color="#666" />
              <Text style={styles.contactInfoText}>+62 813-3643-7117</Text>
            </View>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.creditsSection}>
          <Text style={styles.creditsTitle}>🌱 Nutricomm</Text>
          <Text style={styles.creditsText}>Dibuat dengan ❤️ untuk Kebun Gizi Indonesia</Text>
          <Text style={styles.creditsText}>© 2024 Nutricomm Team. All rights reserved.</Text>
          <Text style={styles.releaseText}>Released: {RELEASE_DATE}</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appInfoCard: {
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  versionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  featureCard: {
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
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  techCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  techItem: {
    alignItems: 'center',
    flex: 1,
  },
  techText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  teamContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactInfoText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
  },
  creditsSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  creditsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  creditsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  releaseText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});

