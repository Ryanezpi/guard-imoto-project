import DateTimePill from '@/components/ui/DateTimePill';
import { useTheme } from '@/context/ThemeContext';
import { getRfidTelemetry } from '@/services/user.service';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface RfidTelemetryProps {
  deviceId: string;
  idToken: string;
  realtime?: boolean;
}

interface RfidData {
  id: string;
  tag_uid: string;
  recorded_at: string;
  authorized?: boolean;
  nfc_tag_id?: string | null;
  tag_paired_at?: string | null;
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
    tag: theme === 'light' ? '#B874DB' : '#D090E8',
    danger: theme === 'light' ? '#ef4444' : '#f87171',
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {data.map((item) => {
          const recordedAt = new Date(item.recorded_at);
          const authorized = Boolean(item.authorized);
          const statusBg =
            theme === 'light'
              ? authorized
                ? '#22c55e22'
                : '#ef444422'
              : authorized
                ? '#22c55e33'
                : '#ef444433';
          const statusText = authorized ? '#22c55e' : '#ef4444';

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
                  RFID Tag
                </Text>
                <View
                  style={[styles.statusPill, { backgroundColor: statusBg }]}
                >
                  <Text style={[styles.statusText, { color: statusText }]}>
                    {authorized ? 'Authorized' : 'Unauthorized'}
                  </Text>
                </View>
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
                      Tag UID
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.tag_uid}
                    </Text>
                  </View>
                  <View style={styles.metaItemRow}>
                    <Text style={[styles.metaLabel, { color: colors.muted }]}>
                      NFC Tag ID
                    </Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>
                      {item.nfc_tag_id || '—'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.pillsRow}>
                <View style={styles.pillGroup}>
                  <Text style={[styles.pillLabel, { color: colors.muted }]}>
                    Scan
                  </Text>
                  <DateTimePill value={recordedAt} />
                </View>

                <View style={styles.pillGroup}>
                  <Text style={[styles.pillLabel, { color: colors.muted }]}>
                    Paired
                  </Text>
                  {item.tag_paired_at ? (
                    <DateTimePill value={item.tag_paired_at} />
                  ) : (
                    <View
                      style={[
                        styles.unpairedPill,
                        {
                          borderColor: colors.danger,
                          backgroundColor: `${colors.danger}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.unpairedText, { color: colors.danger }]}
                      >
                        Not paired
                      </Text>
                    </View>
                  )}
                </View>
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
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
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
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  unpairedPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  unpairedText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
