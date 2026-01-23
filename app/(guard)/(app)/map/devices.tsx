import AddDeviceCard from '@/components/ui/AddDeviceCard';
import { DeviceCard } from '@/components/ui/DeviceCard';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { useTheme } from '@/context/ThemeContext';
import { createDevice } from '@/services/user.service';
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapDevicesScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { devices: initial_devices, refreshDevices } = useDevices();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const [scanning, setScanning] = useState(false);
  const [manualAdd, setManualAdd] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [processingScan, setProcessingScan] = useState(false);
  const [facing] = useState<CameraType>('back');

  const [device_name, setDeviceName] = useState('');
  const [serial_number, setSerialNumber] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDevices();
    } finally {
      setRefreshing(false);
    }
  };

  // -----------------------------
  // QR scanning
  // -----------------------------
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (processingScan || !idToken) return;
    setProcessingScan(true);

    try {
      const parsed = JSON.parse(result.data);
      if (!parsed.device_id) throw new Error('Invalid QR format');

      await createDevice(idToken, {
        name: parsed.device_name ?? parsed.device_id,
        serial_number: parsed.device_id,
      });

      await refreshDevices(); // refresh context so initial_devices updates
    } catch (err) {
      Alert.alert('Error', 'Failed to add device or invalid QR.');
      console.error(err);
    } finally {
      setScanning(false);
      setTimeout(() => setProcessingScan(false), 500);
    }
  };

  // -----------------------------
  // Manual add with loader
  // -----------------------------
  const handleManualAdd = async () => {
    if (!device_name || !serial_number || !idToken) {
      Alert.alert('Error', 'Please enter both name and serial number');
      return;
    }

    setAddingDevice(true);

    try {
      await createDevice(idToken, {
        name: device_name,
        serial_number,
      });

      await refreshDevices();

      setDeviceName('');
      setSerialNumber('');
      setManualAdd(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add device.');
      console.error(err);
    } finally {
      setAddingDevice(false);
    }
  };

  // -----------------------------
  // Render camera
  // -----------------------------
  if (scanning) {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          edges={['bottom', 'left', 'right']}
        >
          <Text style={{ color: textColor }}>
            We need your permission to access the camera
          </Text>
          <Pressable onPress={requestPermission}>
            <Text style={{ color: '#2563EB', marginTop: 8 }}>
              Grant Permission
            </Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // -----------------------------
  // Main UI
  // -----------------------------
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bgColor }]}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
      >
        {initial_devices?.map((device) => (
          <DeviceCard key={device.device_id} device={device} />
        ))}

        <View style={styles.padding}>
          <AddDeviceCard onPress={() => setManualAdd(true)} />
        </View>
      </ScrollView>

      {/* Manual add modal */}
      <Modal visible={manualAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.title, { color: textColor }]}>Add Device</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                Device Name
              </Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="My ESP32 Alarm 1"
                placeholderTextColor={subTextColor}
                value={device_name}
                onChangeText={setDeviceName}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                Serial Number
              </Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="ESP32-ABC-001"
                placeholderTextColor={subTextColor}
                value={serial_number}
                onChangeText={setSerialNumber}
              />
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                addingDevice && styles.buttonPressed,
              ]}
              onPress={handleManualAdd}
              disabled={addingDevice}
            >
              {addingDevice ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Add Device</Text>
              )}
            </Pressable>

            {!addingDevice && (
              <Pressable
                style={[{ marginTop: 12 }, styles.secondaryButton]}
                onPress={() => setManualAdd(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusRowOffline: {
    opacity: 0.45,
  },

  statusDivider: {
    width: 4,
  },
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#00000088',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  modalCard: {
    borderRadius: 20,
    padding: 20,
  },

  card: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },

  link: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },

  padding: {
    padding: 16,
  },
});
