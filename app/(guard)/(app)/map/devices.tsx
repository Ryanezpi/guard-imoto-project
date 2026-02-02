import AddDeviceCard from '@/components/ui/AddDeviceCard';
import { DeviceCard } from '@/components/ui/DeviceCard';
import AuthTextField from '@/components/ui/forms/AuthTextField';
import ConfirmModal, {
  type AlertAction,
} from '@/components/ui/forms/ConfirmModal';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getDeviceNFCs,
  getMyAlerts,
  pairDevice,
} from '@/services/user.service';
import {
  BarcodeScanningResult,
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapDevicesScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { devices: initial_devices, refreshDevices } = useDevices();
  const { showLoader, hideLoader } = useLoader();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const primaryColor = theme === 'light' ? '#9F0EA1' : '#C06BD6';

  const [scanning, setScanning] = useState(false);
  const [manualAdd, setManualAdd] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [processingScan, setProcessingScan] = useState(false);
  const [facing] = useState<CameraType>('back');

  const [device_name, setDeviceName] = useState('');
  const [serial_number, setSerialNumber] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [unresolvedByDevice, setUnresolvedByDevice] = useState<
    Record<string, number>
  >({});
  const [nfcByDevice, setNfcByDevice] = useState<Record<string, number>>({});
  const [alert, setAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
  }>({ visible: false, actions: [] });

  const closeAlert = useCallback(
    () => setAlert((prev) => ({ ...prev, visible: false })),
    []
  );
  const openAlert = useCallback(
    (title: string, message: string, actions?: AlertAction[]) =>
      setAlert({
        visible: true,
        title,
        message,
        actions: actions ?? [
          { text: 'OK', variant: 'primary', onPress: closeAlert },
        ],
      }),
    [closeAlert]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    showLoader();
    try {
      await loadAlerts();
      await loadNfcCounts();
      await refreshDevices();
    } finally {
      hideLoader();
      setRefreshing(false);
    }
  };

  const loadAlerts = useCallback(async () => {
    if (!idToken) return;
    try {
      const res = await getMyAlerts(idToken);
      const counts: Record<string, number> = {};
      (res.alerts || []).forEach((alert: any) => {
        if (!alert.resolved && alert.device_id) {
          counts[alert.device_id] = (counts[alert.device_id] || 0) + 1;
        }
      });
      setUnresolvedByDevice(counts);
    } catch (e) {
      console.log('[ALERTS]', e);
    }
  }, [idToken]);

  const loadNfcCounts = useCallback(async () => {
    if (!idToken || !initial_devices?.length) return;
    try {
      const entries = await Promise.all(
        initial_devices.map(async (device) => {
          try {
            const res = await getDeviceNFCs(idToken, device.device_id);
            return [device.device_id, res?.length ?? 0] as const;
          } catch (e) {
            console.log('[NFC]', device.device_id, e);
            return [device.device_id, 0] as const;
          }
        })
      );
      setNfcByDevice(Object.fromEntries(entries));
    } catch (e) {
      console.log('[NFC]', e);
      setNfcByDevice({});
    }
  }, [idToken, initial_devices]);

  useEffect(() => {
    loadAlerts();
    loadNfcCounts();
  }, [loadAlerts, loadNfcCounts]);

  // -----------------------------
  // QR scanning
  // -----------------------------
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (processingScan || !idToken) return;
    setProcessingScan(true);

    showLoader();
    try {
      const parsed = JSON.parse(result.data);
      if (!parsed.device_id) throw new Error('Invalid QR format');

      await pairDevice(idToken, {
        device_name: parsed.device_name ?? parsed.device_id,
        serial_number: parsed.device_id,
      });

      await refreshDevices(); // refresh context so initial_devices updates
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('device not found')) {
        openAlert(
          'Device not found',
          'No device matched that serial number. Please double-check the QR code / serial number and try again.'
        );
      } else {
        openAlert('Error', msg || 'Failed to add device or invalid QR.');
      }
      console.log(err);
    } finally {
      hideLoader();
      setScanning(false);
      setTimeout(() => setProcessingScan(false), 500);
    }
  };

  // -----------------------------
  // Manual add with loader
  // -----------------------------
  const handleManualAdd = async () => {
    if (!device_name || !serial_number || !idToken) {
      openAlert('Error', 'Please enter both name and serial number');
      return;
    }

    setAddingDevice(true);
    showLoader();

    try {
      await pairDevice(idToken, {
        device_name,
        serial_number,
      });

      await refreshDevices();

      setDeviceName('');
      setSerialNumber('');
      setManualAdd(false);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('device not found')) {
        openAlert(
          'Device not found',
          'No device matched that serial number. Please check the serial number and try again.'
        );
      } else {
        openAlert('Error', msg || 'Failed to add device.');
      }
      console.log(err);
    } finally {
      hideLoader();
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
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          edges={['bottom', 'left', 'right']}
        >
          <Text style={{ color: textColor }}>
            We need your permission to access the camera
          </Text>
          <Pressable onPress={requestPermission}>
            <Text style={{ color: '#9F0EA1', marginTop: 8 }}>
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
      style={[styles.safeArea, { backgroundColor: bgColor, padding: 16 }]}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      >
        {initial_devices?.map((device) => (
          <DeviceCard
            key={device.device_id}
            device={device}
            unresolvedCount={unresolvedByDevice[device.device_id] ?? 0}
            nfcCount={nfcByDevice[device.device_id]}
          />
        ))}

        <View style={styles.padding}>
          <AddDeviceCard onPress={() => setManualAdd(true)} />
        </View>
      </ScrollView>

      {/* Manual add modal */}
      <ConfirmModal
        visible={manualAdd}
        title="Add Device"
        onCancel={() => setManualAdd(false)}
        onDismiss={() => setManualAdd(false)}
        fullWidthActions={true}
        actions={[
          {
            text: 'Cancel',
            variant: 'cancel',
            onPress: () => setManualAdd(false),
          },
          {
            text: addingDevice ? 'Adding…' : 'Add Device',
            variant: 'primary',
            onPress: () => {
              if (addingDevice) return;
              handleManualAdd();
            },
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={{ marginTop: 8 }}>
            <AuthTextField
              label="Device Name"
              placeholder="My ESP32 Alarm 1"
              value={device_name}
              onChangeText={setDeviceName}
              autoCapitalize="words"
            />
            <AuthTextField
              label="Serial Number"
              placeholder="ESP32-ABC-001"
              value={serial_number}
              onChangeText={setSerialNumber}
              autoCapitalize="none"
            />
          </View>
        </KeyboardAvoidingView>
      </ConfirmModal>

      <ConfirmModal
        visible={alert.visible}
        title={alert.title}
        actions={alert.actions}
        onCancel={closeAlert}
        onDismiss={closeAlert}
      >
        {alert.message ? <Text>{alert.message}</Text> : null}
      </ConfirmModal>
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
    backgroundColor: '#9F0EA1',
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
    borderColor: '#9F0EA1',
  },
  secondaryButtonText: {
    color: '#9F0EA1',
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
