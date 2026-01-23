import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, LatLng, Region } from 'react-native-maps';
import { useTheme } from '@/context/ThemeContext';
import { getGPSTelemetry } from '@/services/user.service';

interface GpsTelemetryProps {
  deviceId: string;
  idToken: string;
}

interface GpsData {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  recorded_at: string;
}

const MAX_POINTS = 100;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function GpsTelemetry({ deviceId, idToken }: GpsTelemetryProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<GpsData[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  const colors = {
    bg: theme === 'light' ? '#fff' : '#1e1e1e',
    cardBg: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
    text: theme === 'light' ? '#111' : '#f5f5f5',
    muted: theme === 'light' ? '#999' : '#aaa',
    border: theme === 'light' ? '#eee' : '#333',
    accuracy: theme === 'light' ? '#4e8cff' : '#61a0ff',
    polyline: theme === 'light' ? '#2563eb' : '#61a0ff',
    primary: '#61a0ff',
  };

  // Fetch ONCE
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getGPSTelemetry(idToken, deviceId);
        if (mounted && res?.length) {
          setData(res.slice(-MAX_POINTS));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [deviceId, idToken]);

  // Normalize coordinates once
  const coordinates = useMemo<LatLng[]>(() => {
    return data
      .map((d) => {
        const lat = Number(d.lat);
        const lng = Number(d.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { latitude: lat, longitude: lng };
      })
      .filter(Boolean) as LatLng[];
  }, [data]);

  const focusOnPoint = (lat: number, lng: number) => {
    const region: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    mapRef.current?.animateToRegion(region, 300);
  };

  if (loading) {
    return (
      <View style={[styles.centerBox, styles.loaderContainer]}>
        <ActivityIndicator size="large" color={colors.muted} />
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Loading GPS data…
        </Text>
      </View>
    );
  }

  if (!coordinates.length) {
    return (
      <View style={[styles.centerBox, styles.loaderContainer]}>
        <Text style={{ color: colors.muted }}>No GPS data recorded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAP - Ensure this has a fixed height so it doesn't vanish in the modal */}
      <View style={[styles.mapWrapper, { borderColor: colors.border }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: coordinates[0]?.latitude || 0,
            longitude: coordinates[0]?.longitude || 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          showsPointsOfInterest={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          customMapStyle={mapStyle}
        >
          {coordinates.map((coord, idx) => (
            <Marker
              key={data[idx].id}
              coordinate={coord}
              title={'Point ' + String.fromCharCode(65 + idx)}
            />
          ))}
          <Polyline
            coordinates={coordinates}
            strokeColor={colors.polyline}
            strokeWidth={3}
          />
        </MapView>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.muted }]}>
        MOVEMENT HISTORY
      </Text>

      {/* LIST - Set a max height relative to screen to prevent modal overflow */}
      <View style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}>
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
              onPress={() => focusOnPoint(Number(item.lat), Number(item.lng))}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.coordText, { color: colors.text }]}>
                  {Number(item.lat).toFixed(5)}, {Number(item.lng).toFixed(5)}
                </Text>
                <Text style={[styles.accuracyText, { color: colors.primary }]}>
                  ±{item.accuracy}m
                </Text>
              </View>
              <Text style={[styles.dateText, { color: colors.muted }]}>
                {new Date(item.recorded_at).toLocaleString()}
              </Text>
            </Pressable>
          )}
        />
      </View>
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
  container: {},
  loaderContainer: {
    height: 360,
    paddingVertical: 4,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 10,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coordText: {
    fontWeight: '600',
    fontSize: 14,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
