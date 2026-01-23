import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SectionList,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getDetectionsTelemetry } from '@/services/user.service';

interface DetectionTelemetryProps {
  deviceId: string;
  idToken: string;
  realtime?: boolean;
}

interface DetectionData {
  id: string;
  type: string;
  severity: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export function DetectionTelemetry({
  deviceId,
  idToken,
  realtime,
}: DetectionTelemetryProps) {
  const { theme } = useTheme();
  const [data, setData] = useState<DetectionData[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    bg: theme === 'light' ? '#fff' : '#1e1e1e',
    cardBg: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
    text: theme === 'light' ? '#111' : '#f5f5f5',
    muted: theme === 'light' ? '#999' : '#aaa',
    border: theme === 'light' ? '#eee' : '#333',
    tag: theme === 'light' ? '#4e8cff' : '#61a0ff',
  };

  const severityMeta = (s: number) => {
    if (s >= 3) return { label: 'High', color: '#ff4d4f' };
    if (s === 2) return { label: 'Medium', color: '#faad14' };
    return { label: 'Low', color: '#52c41a' };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetectionsTelemetry(idToken, deviceId);

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

  const { recent24h, older } = useMemo(() => {
    const now = new Date().getTime();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recent24h: DetectionData[] = [];
    const older: DetectionData[] = [];
    data.forEach((item) => {
      const ts = new Date(item.created_at).getTime();
      if (ts >= dayAgo) recent24h.push(item);
      else older.push(item);
    }); // sort by newest first
    recent24h.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    older.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { recent24h, older };
  }, [data]);

  /* ─────────── Loading ─────────── */
  if (loading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.muted} />
        <Text style={{ color: colors.muted, marginTop: 8 }}>
          Loading detections…
        </Text>
      </View>
    );
  }

  /* ─────────── Empty ─────────── */
  if (!data.length) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          No detections recorded
        </Text>
      </View>
    );
  }

  const renderDetection = (item: DetectionData) => {
    const severity = severityMeta(item.severity);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.type, { color: colors.text }]}>
            ⚠ {item.type}
          </Text>
          <View style={[styles.badge, { backgroundColor: severity.color }]}>
            <Text style={styles.badgeText}>{severity.label}</Text>
          </View>
        </View>

        {item.metadata &&
          Object.entries(item.metadata).map(([key, value]) => (
            <Text
              key={key}
              style={[styles.metadataText, { color: colors.tag }]}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
            </Text>
          ))}

        <Text style={[styles.timestamp, { color: colors.muted }]}>
          {new Date(item.created_at).toLocaleDateString()} •{' '}
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SectionList
        sections={[
          { title: 'Recent within 24h', data: recent24h },
          { title: 'Older', data: older },
        ]}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            {section.title} ({section.data.length})
          </Text>
        )}
        renderItem={({ item }) => renderDetection(item)}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

/* ─────────── Styles ─────────── */
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginVertical: 8,
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 13,
    marginTop: 6,
  },
});
