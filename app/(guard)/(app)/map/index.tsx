import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useDevices } from '@/context/DeviceContext'; // import the device context

export default function MapDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { devices, loading } = useDevices(); // access global devices

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const bottomBg = theme === 'light' ? '#f0f0f0' : '#272727';

  /* ---------------------------------- */
  /* Get current location               */
  /* ---------------------------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(userRegion);
    })();
  }, []);

  const getDeviceText = () => {
    if (loading) return 'Loading...';
    if (!devices || devices.length === 0) return 'No devices, add one';
    return `${devices.length} device${devices.length > 1 ? 's' : ''}`;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === 'light' ? '#f0f0f0' : '#121212' },
      ]}
    >
      {/* Map */}
      {region ? (
        <MapView
          ref={mapRef}
          style={styles.mapContainer}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton={false}
          zoomEnabled
          scrollEnabled
          rotateEnabled={false}
          pitchEnabled={false}
        />
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {/* Bottom action card */}
      <SafeAreaView
        style={[styles.bottomCards, { backgroundColor: bottomBg }]}
        edges={['bottom', 'left', 'right']}
      >
        <DynamicCard
          name="Devices"
          subText={getDeviceText()}
          nameTextBold
          prefixIcon="server"
          suffixIcon="chevron-right"
          onPress={() => router.navigate(ROUTES.MAP.DEVICES)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCards: {
    position: 'absolute', // fix at bottom
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
