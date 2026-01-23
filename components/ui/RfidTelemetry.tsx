import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getRfidTelemetry } from '@/services/user.service';

interface RfidTelemetryProps {
  deviceId: string;
  idToken: string;
  realtime?: boolean;
}

interface RfidData {
  id: string;
  tag_uid: string;
  recorded_at: string;
}

export function RfidTelemetry({
  deviceId,
  idToken,
  realtime,
}: RfidTelemetryProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<RfidData[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    bg: theme === 'light' ? '#fff' : '#1e1e1e',
    cardBg: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
    text: theme === 'light' ? '#111' : '#f5f5f5',
    muted: theme === 'light' ? '#999' : '#aaa',
    border: theme === 'light' ? '#eee' : '#333',
    tag: theme === 'light' ? '#4e8cff' : '#61a0ff',
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getRfidTelemetry(idToken, deviceId);
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
          Loading RFID data…
        </Text>
      </View>
    );
  }

  /* ─────────── Empty ─────────── */
  if (!data.length) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          No RFID scans recorded
        </Text>
      </View>
    );
  }

  /* ─────────── Data ─────────── */
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const recordedAt = new Date(item.recorded_at);
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
            >
              {/* Tag UID */}
              <Text style={[styles.tag, { color: colors.tag }]}>
                🏷️ {item.tag_uid}
              </Text>

              {/* Timestamp */}
              <Text style={[styles.timestamp, { color: colors.muted }]}>
                {recordedAt.toLocaleDateString()} •{' '}
                {recordedAt.toLocaleTimeString()}
              </Text>
            </View>
          );
        }}
      />
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
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  tag: {
    fontSize: 16,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    marginTop: 4,
  },
});
