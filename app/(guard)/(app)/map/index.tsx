import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function MapDashboard() {
  const { hideLoader } = useLoader();
  const router = useRouter();
  const { theme } = useTheme();
  const { devices, loading } = useDevices();

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null); // store current location

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
      setUserLocation(userRegion); // save initial location
      hideLoader();
    })();
  }, [hideLoader]);

  const getDeviceText = () => {
    if (loading) return 'Loading...';
    if (!devices || devices.length === 0) return 'No devices, add one';
    return `${devices.length} device${devices.length > 1 ? 's' : ''}`;
  };

  const goToHome = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 500); // smooth 1s animation
    }
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
          customMapStyle={mapStyle}
        >
          <Marker
            coordinate={{
              latitude: userLocation?.latitude || 0 + 1,
              longitude: userLocation?.longitude || 0 + 1,
            }}
            title="My Motorcycle"
            description="Parked at Home"
          ></Marker>
        </MapView>
      ) : (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}
      <Pressable style={styles.absoluteTopRight} onPress={goToHome}>
        <FontAwesome name="compass" size={24} color="black" />
      </Pressable>
      {/* Bottom action cards */}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
