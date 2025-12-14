import { Alert, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import React, { useState } from 'react';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import { useTheme } from '@/context/ThemeContext';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
import AddDeviceCard from '@/components/ui/AddDeviceCard';
import DevicePrefix from '@/components/ui/DevicePrefix';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface ScannedDevice {
  deviceId: string;
  prefixColor: string;
  deviceEnabled: boolean;
  coords?: { x: number; y: number };
}

export default function MapDevicesScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const [facing] = useState<CameraType>('back');

  const [items, setItems] = useState<DynamicListItem[]>([
    {
      id: '0',
      name: 'DEV-123456',
      prefixElement: <DevicePrefix color="#E53935" />,
      subText: 'Enabled',
      subTextColor: '#2fa500ff',
      suffixIcon: 'chevron-right',
      onPress: () =>
        router.navigate({
          pathname: '/map/device-settings',
          params: { deviceId: 'DEV-123456', prefixColor: '#E53935' },
        }),
    },
  ]);

  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [processingScan, setProcessingScan] = useState(false);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (processingScan) return;
    setProcessingScan(true);

    try {
      const parsed: ScannedDevice = JSON.parse(result.data);
      if (!parsed.deviceId || !parsed.prefixColor)
        throw new Error('Invalid QR format');
      parsed.coords = parsed.coords ?? { x: 0, y: 0 };

      setItems((prevItems) => {
        if (prevItems.some((i) => i.name === parsed.deviceId)) return prevItems;

        const uniqueId = `${parsed.deviceId}-${Date.now()}`;
        return [
          ...prevItems,
          {
            id: uniqueId,
            name: parsed.deviceId,
            prefixElement: <DevicePrefix color={parsed.prefixColor} />,
            subText: parsed.deviceEnabled ? 'Enabled' : 'Disabled',
            subTextColor: parsed.deviceEnabled ? '#2fa500ff' : '#999',
            suffixIcon: 'chevron-right',
            onPress: () =>
              router.navigate({
                pathname: '/map/device-settings',
                params: {
                  deviceId: parsed.deviceId,
                  prefixColor: parsed.prefixColor,
                },
              }),
          },
        ];
      });
    } catch (err) {
      Alert.alert(
        'Invalid QR',
        'QR code does not contain a valid device object',
        err as any
      );
    } finally {
      setScanning(false);
      setTimeout(() => setProcessingScan(false), 500);
    }
  };

  if (scanning) {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <SafeAreaView
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          edges={['bottom', 'left', 'right']}
        >
          <Text>We need your permission to access the camera</Text>
          <TouchableOpacity onPress={requestPermission}>
            <Text style={{ color: 'blue', marginTop: 8 }}>
              Grant Permission
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setScanning(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <DynamicList items={items} />
      <View style={{ marginTop: 12 }}>
        <AddDeviceCard onPress={() => setScanning(true)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
