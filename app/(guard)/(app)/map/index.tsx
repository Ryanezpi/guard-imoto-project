import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Device, useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import DeviceDetailsModal from '@/components/ui/DeviceDetailsModal';
import CustomDeviceMarker from '@/components/ui/PinMarker';

const POLL_INTERVAL_MS = 60000;

export default function MapDashboard() {
  const { hideLoader } = useLoader();
  const { theme } = useTheme();
  const { devices: contextDevices, refreshDevices } = useDevices();
  const router = useRouter();
  const { focusDeviceId } = useLocalSearchParams<{ focusDeviceId?: string }>();

  const mapRef = useRef<MapView>(null);
  const devicesByIdRef = useRef<Map<string, Device>>(new Map());
  const lastHashRef = useRef<number>(0);
  const pollRef = useRef<NodeJS.Timeout | null | any>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [positions, setPositions] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  /* ------------------ Focus device from navigation ------------------ */
  useEffect(() => {
    if (!focusDeviceId || !mapRef.current) return;

    const device = devicesByIdRef.current.get(focusDeviceId);
    if (!device) return;

    const lat = Number(device.latest_lat);
    const lng = Number(device.latest_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      600
    );

    setSelectedDevice(device);
    setDetailsVisible(true);
  }, [focusDeviceId]);

  /* ------------------ Build positions cache (VERY optimized) ------------------ */
  useEffect(() => {
    if (!contextDevices?.length) return;

    const newPositions: Record<string, { lat: number; lng: number }> = {};
    let hash = 0;

    for (const d of contextDevices) {
      const lat = Number(d.latest_lat);
      const lng = Number(d.latest_lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      newPositions[d.device_id] = { lat, lng };
      devicesByIdRef.current.set(d.device_id, d);

      hash = ((hash << 5) - hash + lat * 1000 + lng * 1000) | 0;
    }

    if (hash !== lastHashRef.current) {
      lastHashRef.current = hash;
      setPositions(newPositions);
    }
  }, [contextDevices]);

  /* ------------------ Stable polling (no memory leaks) ------------------ */
  useFocusEffect(
    useCallback(() => {
      console.log('🟢 Map screen focused — polling started');

      refreshDevices(); // run immediately when returning
      pollRef.current = setInterval(refreshDevices, POLL_INTERVAL_MS);

      return () => {
        console.log('🔴 Map screen unfocused — polling stopped');
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }, [refreshDevices])
  );

  /* ------------------ User GPS (run once) ------------------ */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // ⚡ less memory & battery
      });

      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(userRegion);
      setUserLocation(userRegion);
      hideLoader();
    })();

    return () => {
      mounted = false;
    };
  }, [hideLoader]);

  /* ------------------ Handlers (memoized) ------------------ */
  const goToHome = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 500);
    }
  }, [userLocation]);

  const handleSelectDevice = useCallback((d: Device) => {
    setSelectedDevice(d);
    setDetailsVisible(true);
  }, []);

  const handleMapPress = useCallback((e: MapPressEvent) => {
    console.log('Debug tap coords:', e.nativeEvent.coordinate);
  }, []);

  /* ------------------ Device Markers (super lightweight) ------------------ */
  const DeviceMarkers = memo(() => {
    return Object.entries(positions).map(([id, pos]) => {
      const device = devicesByIdRef.current.get(id);
      if (!device) return null;

      return (
        <CustomDeviceMarker
          key={id}
          device={device}
          onPress={() => handleSelectDevice(device)}
        />
      );
    });
  });

  DeviceMarkers.displayName = 'DeviceMarkers';
  /* ------------------ Render ------------------ */

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === 'light' ? '#f0f0f0' : '#121212' },
      ]}
    >
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
          customMapStyle={mapStyle}
          onPress={handleMapPress}
        >
          <DeviceMarkers />
        </MapView>
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      <DeviceDetailsModal
        visible={detailsVisible}
        device={selectedDevice}
        onClose={() => setDetailsVisible(false)}
      />

      <Pressable style={styles.absoluteTopRight} onPress={goToHome}>
        <FontAwesome name="compass" size={24} color="black" />
      </Pressable>

      <SafeAreaView
        style={[
          styles.bottomCards,
          { backgroundColor: theme === 'light' ? '#f0f0f0' : '#272727' },
        ]}
        edges={['bottom', 'left', 'right']}
      >
        <DynamicCard
          name={`Devices (${contextDevices?.length || 0})`}
          prefixIcon="server"
          suffixIcon="chevron-right"
          nameTextBold
          onPress={() => router.navigate(ROUTES.MAP.DEVICES)}
        />
      </SafeAreaView>
    </View>
  );
}

const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  absoluteTopRight: {
    width: 48,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 4,
  },
  bottomCards: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
