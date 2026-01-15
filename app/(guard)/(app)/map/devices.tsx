import AddDeviceCard from '@/components/ui/AddDeviceCard';
import DevicePrefix from '@/components/ui/DevicePrefix';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
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
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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

  const [items, setItems] = useState<DynamicListItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [manualAdd, setManualAdd] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [processingScan, setProcessingScan] = useState(false);
  const [facing] = useState<CameraType>('back');

  const [device_name, setDeviceName] = useState('');
  const [serial_number, setSerialNumber] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  // -----------------------------
  // Initialize list from context
  // -----------------------------
  useEffect(() => {
    if (!initial_devices) return;

    const mappedItems = initial_devices.map((d) => ({
      id: d.device_id,
      name: d.device_name ?? d.serial_number,
      prefixElement: <DevicePrefix color={d.device_color ?? '#E53935'} />,
      subText: d.paired ? 'Enabled' : 'Disabled',
      subTextColor: d.paired ? '#2fa500ff' : '#E53935',
      suffixIcon: 'chevron-right' as const,
      onPress: () =>
        router.navigate({
          pathname: '/map/device-settings',
          params: {
            device_id: d.device_id,
            device_color: d.device_color ?? '#E53935',
          },
        }),
    }));

    setItems(mappedItems);
  }, [initial_devices]);

  // -----------------------------
  // Add device helper
  // -----------------------------
  const addDeviceToList = (device: {
    device_id: string;
    device_color: string;
    device_enabled: boolean;
    device_name?: string;
  }) => {
    setItems((prevItems) => {
      if (
        prevItems.some(
          (i) => i.name === device.device_name || i.name === device.device_id
        )
      )
        return prevItems;

      const uniqueId = `${device.device_id}-${Date.now()}`;
      return [
        ...prevItems,
        {
          id: uniqueId,
          name: device.device_name ?? device.device_id,
          prefixElement: <DevicePrefix color={device.device_color} />,
          subText: device.device_enabled ? 'Enabled' : 'Disabled',
          subTextColor: device.device_enabled ? '#2fa500ff' : '#E53935',
          suffixIcon: 'chevron-right',
          onPress: () =>
            router.navigate({
              pathname: '/map/device-settings',
              params: {
                device_id: device.device_id,
                device_color: device.device_color,
              },
            }),
        },
      ];
    });
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

      addDeviceToList({
        device_id: parsed.device_id,
        device_color: parsed.device_color ?? '#E53935',
        device_enabled: parsed.device_enabled ?? true,
        device_name: parsed.device_name,
      });
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
      <DynamicList items={items} />
      <View style={styles.padding}>
        <AddDeviceCard onPress={() => setManualAdd(true)} />
      </View>

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
