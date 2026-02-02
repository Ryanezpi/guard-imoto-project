import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Text,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Device, useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import DeviceDetailsModal from '@/components/ui/DeviceDetailsModal';
import CustomDeviceMarker from '@/components/ui/PinMarker';
import { useAuth } from '@/context/AuthContext';

const POLL_INTERVAL_MS = 60000;

export default function MapDashboard() {
  const { hideLoader } = useLoader();
  const { theme } = useTheme();
  const { user } = useAuth();
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
  const [overlayMinimized, setOverlayMinimized] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoadTimedOut, setMapLoadTimedOut] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  /* ------------------ Focus device from navigation ------------------ */
  useEffect(() => {
    if (!focusDeviceId || !mapRef.current) return;

    const device = devicesByIdRef.current.get(focusDeviceId);
    if (!device) return;

    const lat = Number(device.latest_lat);
    const lng = Number(device.latest_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (lat === 0 && lng === 0) return;

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
      if (lat === 0 && lng === 0) continue;

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
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled || !mounted) {
          hideLoader();
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !mounted) {
          hideLoader();
          return;
        }

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
      } catch (err) {
        console.log('[Map] Failed to get current location:', err);
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown && mounted) {
            const fallbackRegion: Region = {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setRegion(fallbackRegion);
            setUserLocation(fallbackRegion);
          }
        } catch (fallbackErr) {
          console.log('[Map] No last known location available:', fallbackErr);
        }
      } finally {
        hideLoader();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hideLoader]);

  /* ------------------ Fallback to device location ------------------ */
  useEffect(() => {
    if (region || userLocation) return;
    if (!contextDevices?.length) return;

    const firstWithCoords = contextDevices.find((d) => {
      const lat = Number(d.latest_lat);
      const lng = Number(d.latest_lng);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });

    if (!firstWithCoords) return;

    const lat = Number(firstWithCoords.latest_lat);
    const lng = Number(firstWithCoords.latest_lng);

    const fallbackRegion: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(fallbackRegion);
  }, [contextDevices, region, userLocation]);

  useEffect(() => {
    if (!region) return;
    setMapReady(false);
    setMapLoadTimedOut(false);

    const timer = setTimeout(() => {
      setMapLoadTimedOut(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [region]);

  /* ------------------ Handlers (memoized) ------------------ */
  const goToHome = useCallback(() => {
    setOverlayMinimized(false);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 500);
    }
  }, [userLocation]);

  const handleSelectDevice = useCallback((d: Device) => {
    setSelectedDevice(d);
    setDetailsVisible(true);
    setOverlayMinimized(false);
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
  const isLight = theme === 'light';
  const barBg = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(31,31,31,0.92)';
  const barBorder = isLight ? '#e5e7eb' : '#333';
  const barText = isLight ? '#111827' : '#f9fafb';
  const barSub = isLight ? '#6b7280' : '#9ca3af';
  const iconBg = isLight ? '#f3f4f6' : '#2a2a2a';
  const iconBorder = isLight ? '#e5e7eb' : '#333';
  const iconColor = isLight ? '#111827' : '#f9fafb';
  const primary = isLight ? '#9F0EA1' : '#C06BD6';
  const deviceCount = contextDevices?.length ?? 0;
  const userLabel = user?.first_name
    ? `Hi, ${user.first_name}`
    : 'Hi';

  useEffect(() => {
    Animated.timing(overlayAnim, {
      toValue: overlayMinimized ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [overlayAnim, overlayMinimized]);

  const overlayOpacity = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.65],
  });
  const overlayScale = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

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
          onMapReady={() => setMapReady(true)}
          onPanDrag={() => {
            if (!overlayMinimized) setOverlayMinimized(true);
          }}
        >
          <DeviceMarkers />
        </MapView>
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#9F0EA1" />
        </View>
      )}

      {!mapReady && mapLoadTimedOut && (
        <View style={styles.mapErrorOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#9F0EA1" />
          <Text style={styles.mapErrorText}>Map didn&apos;t load</Text>
        </View>
      )}

      <DeviceDetailsModal
        visible={detailsVisible}
        device={selectedDevice}
        onClose={() => setDetailsVisible(false)}
      />

      <SafeAreaView
        style={styles.bottomBarWrap}
        edges={['bottom', 'left', 'right']}
      >
        {overlayMinimized ? (
          <Animated.View
            style={{
              alignSelf: 'flex-end',
              opacity: overlayOpacity,
              transform: [{ scale: overlayScale }],
            }}
          >
            <Pressable
              style={[
                styles.iconBtn,
                { backgroundColor: iconBg, borderColor: iconBorder },
              ]}
              onPress={() => setOverlayMinimized(false)}
            >
              <FontAwesome name="eye" size={16} color={primary} />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            onPress={() => setOverlayMinimized(false)}
            style={{ pointerEvents: 'auto' }}
          >
            <Animated.View
              style={[
                styles.bottomBar,
                {
                  backgroundColor: barBg,
                  borderColor: barBorder,
                  opacity: overlayOpacity,
                  transform: [{ scale: overlayScale }],
                },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.bottomTitle, { color: barText }]}
                  numberOfLines={1}
                >
                  {userLabel}
                </Text>
                <Text
                  style={[styles.bottomSub, { color: barSub }]}
                  numberOfLines={1}
                >
                  {deviceCount} device{deviceCount === 1 ? '' : 's'} • Tap a
                  marker for details
                </Text>
              </View>

              <View style={styles.bottomActions}>
                <Pressable
                  style={[
                    styles.iconBtn,
                    { backgroundColor: iconBg, borderColor: iconBorder },
                  ]}
                  onPress={() => {
                    setOverlayMinimized(false);
                    router.navigate(ROUTES.MAP.DEVICES);
                  }}
                >
                  <FontAwesome name="server" size={16} color={primary} />
                </Pressable>
                <Pressable
                  style={[
                    styles.iconBtn,
                    { backgroundColor: iconBg, borderColor: iconBorder },
                  ]}
                  onPress={goToHome}
                >
                  <FontAwesome name="compass" size={16} color={iconColor} />
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        )}
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
  bottomBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    pointerEvents: 'box-none',
  },
  bottomBar: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bottomSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
