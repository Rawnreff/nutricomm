// frontend/app/components/IPConfig.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appConfig } from '../app/services/config';
import { testSocketConnection } from '../app/services/socketIO';
import { apiService } from '../app/services/socket';

interface IPConfigProps {
  isVisible: boolean;
  onClose: () => void;
  onIPChange: (ip: string) => void;
}

export const IPConfig: React.FC<IPConfigProps> = ({ isVisible, onClose, onIPChange }) => {
  const [ip, setIp] = useState('');
  const [testing, setTesting] = useState(false);
  const [savedIPs, setSavedIPs] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      setIp('');
      loadSavedIPs();
    }
  }, [isVisible]);

  const loadSavedIPs = () => {
    // Untuk sekarang kita simpan di state, bisa extend ke AsyncStorage nanti
    const commonIPs = [
      '10.218.18.170',
      '192.168.137.1',
      'localhost'
    ];
    setSavedIPs(commonIPs);
  };

  const handleTestConnection = async () => {
    if (!ip.trim()) {
      Alert.alert('Error', 'Silakan masukkan alamat IP');
      return;
    }

    // Validasi format IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^localhost$/;
    if (!ipRegex.test(ip)) {
      Alert.alert('Error', 'Format IP tidak valid');
      return;
    }

    setTesting(true);
    try {
      const [socketTest, apiTest] = await Promise.all([
        testSocketConnection(ip),
        apiService.testConnection(ip)
      ]);

      if (socketTest || apiTest) {
        Alert.alert(
          'Berhasil!', 
          `Koneksi berhasil!\nSocket: ${socketTest ? '✅' : '❌'}\nAPI: ${apiTest ? '✅' : '❌'}`,
          [
            {
              text: 'Gunakan IP Ini',
              onPress: () => {
                appConfig.setBackendIP(ip);
                onIPChange(ip);
                onClose();
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Tidak dapat terhubung ke backend dengan IP ini');
      }
    } catch (error) {
      Alert.alert('Error', 'Test koneksi gagal');
    } finally {
      setTesting(false);
    }
  };

  const handleQuickSelect = (quickIP: string) => {
    setIp(quickIP);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Konfigurasi IP Backend</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Alamat IP Server:</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 10.218.18.170"
            value={ip}
            onChangeText={setIp}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.currentIP}>
            IP Saat Ini: {appConfig.getBackendUrl().replace('http://', '')}
          </Text>

          {/* Quick Select IPs */}
          {savedIPs.length > 0 && (
            <View style={styles.quickSelectContainer}>
              <Text style={styles.quickSelectTitle}>Pilih Cepat:</Text>
              <View style={styles.quickSelectGrid}>
                {savedIPs.map((savedIP, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.quickIPButton,
                      ip === savedIP && styles.quickIPButtonActive
                    ]}
                    onPress={() => handleQuickSelect(savedIP)}
                  >
                    <Text 
                      style={[
                        styles.quickIPText,
                        ip === savedIP && styles.quickIPTextActive
                      ]}
                    >
                      {savedIP}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.testButton,
                (!ip.trim() || testing) && styles.testButtonDisabled
              ]}
              onPress={handleTestConnection}
              disabled={!ip.trim() || testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="wifi" size={18} color="#ffffff" />
              )}
              <Text style={styles.testButtonText}>
                {testing ? 'Testing...' : 'Test Koneksi'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            💡 Pastikan backend server sedang berjalan di IP yang dimasukkan
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  currentIP: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  quickSelectContainer: {
    marginBottom: 20,
  },
  quickSelectTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickIPButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickIPButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  quickIPText: {
    fontSize: 12,
    color: '#666',
  },
  quickIPTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#2E7D32',
  },
  testButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  note: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});