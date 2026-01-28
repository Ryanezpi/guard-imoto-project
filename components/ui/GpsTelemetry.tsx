import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, LatLng, Region } from 'react-native-maps';
import { useTheme } from '@/context/ThemeContext';
import { getGPSTelemetry } from '@/services/user.service';
import DateTimePill from '@/components/ui/DateTimePill';

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
    accuracy: theme === 'light' ? '#B874DB' : '#D090E8',
    polyline: theme === 'light' ? '#9F0EA1' : '#C06BD6',
    primary: '#D090E8',
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
      <View style={{ maxHeight: SCREEN_HEIGHT * 0.45, flexGrow: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {data.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
              onPress={() => focusOnPoint(Number(item.lat), Number(item.lng))}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Coordinates
                </Text>
              </View>
              <View
                style={[
                  styles.metaCard,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <View style={styles.metaColumn}>
                  <View style={styles.metaItemRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>
                      Latitude
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.lat}
                    </Text>
                  </View>
                  <View style={styles.metaItemRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>
                      Longitude
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.lng}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.pillsRow}>
                <View
                  style={[
                    styles.accuracyBadge,
                    { backgroundColor: `${colors.primary}22` },
                  ]}
                >
                  <Text
                    style={[styles.accuracyText, { color: colors.primary }]}
                  >
                    Drift ±{item.accuracy}m
                  </Text>
                </View>
                <DateTimePill value={item.recorded_at} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
    paddingBottom: 28,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  accuracyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  metaColumn: {
    flexDirection: 'column',
    gap: 6,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
