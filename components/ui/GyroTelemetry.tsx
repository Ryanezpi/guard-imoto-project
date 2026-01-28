import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getGyroTelemetry } from '@/services/user.service';
import DateTimePill from '@/components/ui/DateTimePill';

interface GyroTelemetryProps {
  deviceId: string;
  idToken: string;
  realtime?: boolean;
}

interface GyroData {
  id: string;
  x: number;
  y: number;
  z: number;
  recorded_at: string;
}

export function GyroTelemetry({
  deviceId,
  idToken,
  realtime,
}: GyroTelemetryProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<GyroData[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    bg: theme === 'light' ? '#fff' : '#1e1e1e',
    cardBg: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
    text: theme === 'light' ? '#111' : '#f5f5f5',
    muted: theme === 'light' ? '#999' : '#aaa',
    border: theme === 'light' ? '#eee' : '#333',
    magnitude: theme === 'light' ? '#B874DB' : '#D090E8',
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getGyroTelemetry(idToken, deviceId);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [idToken, deviceId]);

  useEffect(() => {
    fetchData();
    if (!realtime) return;

    const i = setInterval(fetchData, 5000);
    return () => clearInterval(i);
  }, [fetchData, realtime]);

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.muted} />
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Loading Gyro data…
        </Text>
      </View>
    );
  }

  /* ─────────── Empty ─────────── */
  if (!data.length) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          No gyro activity recorded
        </Text>
      </View>
    );
  }

  /* ─────────── Data ─────────── */
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {data.map((item) => {
          const magnitude = Math.sqrt(
            item.x ** 2 + item.y ** 2 + item.z ** 2
          ).toFixed(2);
          const recordedAt = new Date(item.recorded_at);

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Gyroscope
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
                      X Axis
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.x}
                    </Text>
                  </View>
                  <View style={styles.metaItemRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>
                      Y Axis
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.y}
                    </Text>
                  </View>
                  <View style={styles.metaItemRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>
                      Z Axis
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.z}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timestamp */}
              <View style={styles.pillsRow}>
                <View
                  style={[
                    styles.magnitudeBadge,
                    { backgroundColor: `${colors.magnitude}22` },
                  ]}
                >
                  <Text
                    style={[styles.magnitudeText, { color: colors.magnitude }]}
                  >
                    Magnitude {magnitude}
                  </Text>
                </View>
                <DateTimePill value={recordedAt} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 360,
    paddingVertical: 4,
  },
  centerBox: {
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  magnitudeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  magnitudeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
});
