import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SectionList,
  Pressable,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getDetectionsTelemetry, resolveAlert } from '@/services/user.service';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePill from '@/components/ui/DateTimePill';

interface DetectionTelemetryProps {
  deviceId: string;
  idToken: string;
  realtime?: boolean;
}

interface DetectionData {
  id: string;
  alert_id?: string;
  alertId?: string;
  alert_resolved?: boolean;
  alert_created_at?: string;
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
  const [resolving, setResolving] = useState(false);

  const colors = {
    bg: theme === 'light' ? '#fff' : '#1e1e1e',
    cardBg: theme === 'light' ? '#f9f9f9' : '#2a2a2a',
    text: theme === 'light' ? '#111' : '#f5f5f5',
    muted: theme === 'light' ? '#999' : '#aaa',
    border: theme === 'light' ? '#eee' : '#333',
    tag: theme === 'light' ? '#B874DB' : '#D090E8',
    primary: theme === 'light' ? '#9F0EA1' : '#C06BD6',
  };

  const renderSensorIcon = (
    icon: keyof typeof FontAwesome.glyphMap,
    color: string
  ) => (
    <View style={[styles.iconBadge, { backgroundColor: `${color}22` }]}>
      <FontAwesome name={icon} size={12} color={color} />
    </View>
  );

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('gps')) return 'map-marker';
    if (t.includes('gyro')) return 'bullseye';
    if (t.includes('rfid')) return 'id-card';
    return 'bell';
  };

  const unresolvedDetections = useMemo(
    () => data.filter((d) => !d.alert_resolved),
    [data]
  );

  const severityMeta = (s: number) => {
    if (s >= 3) return { label: 'High', color: '#ff4d4f' };
    if (s === 2) return { label: 'Medium', color: '#faad14' };
    return { label: 'Low', color: '#52c41a' };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetectionsTelemetry(idToken, deviceId);
      const normalized = Array.isArray(res)
        ? res
        : res && typeof res === 'object'
          ? Object.values(res)
          : [];
      setData(normalized as DetectionData[]);
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

  const handleResolveAll = useCallback(async () => {
    if (!unresolvedDetections.length || resolving) return;
    try {
      setResolving(true);
      for (const d of unresolvedDetections) {
        if (!d.alert_id) continue;
        await resolveAlert(idToken, d.alert_id);
      }
      setData((prev) =>
        prev.map((d) =>
          unresolvedDetections.find((u) => u.alert_id === d.alert_id)
            ? { ...d, alert_resolved: true }
            : d
        )
      );
    } catch (e) {
      console.error('[RESOLVE ALERTS]', e);
    } finally {
      setResolving(false);
    }
  }, [idToken, unresolvedDetections, resolving]);

  const handleResolveOne = useCallback(
    async (alertId: string) => {
      if (resolving) return;
      try {
        setResolving(true);
        await resolveAlert(idToken, alertId);
        setData((prev) =>
          prev.map((d) =>
            d.alert_id === alertId ? { ...d, alert_resolved: true } : d
          )
        );
      } catch (e) {
        console.error('[RESOLVE ALERT]', e);
      } finally {
        setResolving(false);
      }
    },
    [idToken, resolving]
  );

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
    const resolved = Boolean(item.alert_resolved);
    const statusText = resolved ? 'Resolved' : 'Active';
    const statusColor = resolved ? '#22c55e' : '#ef4444';
    const statusBg =
      theme === 'light'
        ? resolved
          ? '#22c55e22'
          : '#ef444422'
        : resolved
          ? '#22c55e33'
          : '#ef444433';

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.typeRow}>
            {renderSensorIcon(getIconForType(item.type), severity.color)}
            <Text style={[styles.type, { color: colors.text }]}>
              {item.type}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: severity.color }]}>
              <Text style={styles.badgeText}>{severity.label}</Text>
            </View>
          </View>
        </View>

        {item.metadata &&
          Object.entries(item.metadata)
            .filter(([key]) => key !== 'attempts')
            .map(([key, value]) => (
              <Text
                key={key}
                style={[styles.metadataText, { color: colors.tag }]}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
              </Text>
            ))}

        <View style={{ marginTop: 6 }}>
          <DateTimePill value={item.created_at} />
        </View>

        {!resolved && item.alert_id && (
          <View style={styles.resolveRow}>
            <Pressable
              onPress={() => handleResolveOne(item.alert_id!)}
              disabled={resolving}
              style={[
                styles.resolvePill,
                {
                  backgroundColor: colors.primary,
                  opacity: resolving ? 0.6 : 1,
                },
              ]}
            >
              <FontAwesome name="check" size={12} color="#fff" />
              <Text style={styles.resolvePillText}>Resolve</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.alertRow}>
        <Text style={[styles.alertLabel, { color: colors.muted }]}>
          Unresolved alerts: {unresolvedDetections.length}
        </Text>
        {unresolvedDetections.length > 0 && (
          <Pressable
            onPress={handleResolveAll}
            disabled={resolving}
            style={[
              styles.resolvePill,
              { backgroundColor: colors.primary, opacity: resolving ? 0.6 : 1 },
            ]}
          >
            <FontAwesome name="check" size={12} color="#fff" />
            <Text style={styles.resolvePillText}>
              {resolving ? 'Resolving...' : 'Resolve All'}
            </Text>
          </Pressable>
        )}
      </View>
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  alertLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolvePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolvePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resolveRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
