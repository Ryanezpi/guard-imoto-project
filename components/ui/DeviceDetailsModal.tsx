import React from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import DateTimePill from '@/components/ui/DateTimePill';

type Props = {
  visible: boolean;
  loading?: boolean;
  device: any | null;
  alert?: any | null;
  resolving?: boolean;
  onResolve?: () => void;
  onClose: () => void;
};

export default function DeviceDetailsModal({
  visible,
  loading,
  device,
  alert,
  resolving,
  onResolve,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const bgSheet = isLight ? '#fff' : '#1f1f1f';
  const textPrimary = isLight ? '#111' : '#f5f5f5';
  const textSecondary = isLight ? '#555' : '#ccc';
  const tagBg = isLight ? '#9F0EA122' : '#C06BD622';
  const tagTextColor = isLight ? '#9F0EA1' : '#C06BD6';
  const buttonPrimaryBg = isLight ? '#9F0EA1' : '#C06BD6';
  const buttonPrimaryText = '#fff';
  const closeButtonBg = isLight ? '#fff' : '#2a2a2a';
  const closeButtonBorder = isLight ? '#9F0EA1' : '#C06BD6';
  const closeButtonText = isLight ? '#9F0EA1' : '#C06BD6';
  const statusEnabledBg = device?.paired ? '#2fa50022' : '#9ca3af22';
  const statusEnabledText = device?.paired ? '#2fa500' : '#9ca3af';
  const alertCardBg = isLight ? '#f9fafb' : '#262626';
  const alertBorder = isLight ? '#e5e7eb' : '#333';
  const alertResolvedColor = '#22c55e';
  const alertActiveColor = '#ef4444';
  const hasMetadata =
    alert?.metadata && Object.keys(alert.metadata || {}).length > 0;
  const formatMetaValue = (value: unknown) => {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return String(value);
      return value.toFixed(2);
    }
    if (value === null || value === undefined) return '—';
    return String(value);
  };
  const formatMetaLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bgSheet }]}>
          {loading || !device ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={textSecondary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>
                Loading details...
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.deviceName, { color: textPrimary }]}>
                  {device.device_name}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusEnabledBg },
                  ]}
                >
                  <Text
                    style={{
                      color: statusEnabledText,
                      fontWeight: '600',
                    }}
                  >
                    {device.paired ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.serial, { color: textSecondary }]}>
                {device.serial_number}
              </Text>

              {alert && (
                <Section title="Alert Details" textColor={textPrimary}>
                  <View
                    style={[
                      styles.alertCard,
                      { backgroundColor: alertCardBg, borderColor: alertBorder },
                    ]}
                  >
                    <DataRow
                      label="Type"
                      value={String(alert.type || '').replace(/_/g, ' ')}
                      labelColor={textSecondary}
                      valueColor={textPrimary}
                    />
                    <View style={styles.dataRow}>
                      <Text style={[styles.dataLabel, { color: textSecondary }]}>
                        Status
                      </Text>
                      <View
                        style={[
                          styles.alertStatusPill,
                          {
                            backgroundColor: alert.resolved
                              ? '#22c55e22'
                              : '#ef444422',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.alertStatusText,
                            {
                              color: alert.resolved
                                ? alertResolvedColor
                                : alertActiveColor,
                            },
                          ]}
                        >
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    <DataRow
                      label="Time"
                      value=""
                      valueElement={<DateTimePill value={alert.created_at} />}
                      labelColor={textSecondary}
                      valueColor={textPrimary}
                    />
                    {hasMetadata && (
                      <View style={{ marginTop: 8 }}>
                        <Text
                          style={[
                            styles.metaTitle,
                            { color: textSecondary },
                          ]}
                        >
                          Metadata
                        </Text>
                        <View style={{ gap: 6, marginTop: 6 }}>
                          {Object.entries(alert.metadata).map(
                            ([key, value]) => (
                              <DataRow
                                key={key}
                                label={formatMetaLabel(String(key))}
                                value={formatMetaValue(value)}
                                labelColor={textSecondary}
                                valueColor={textPrimary}
                              />
                            )
                          )}
                        </View>
                      </View>
                    )}
                    {alert && !alert.resolved && onResolve && (
                      <Pressable
                        style={[
                          styles.resolveButton,
                          { backgroundColor: buttonPrimaryBg, opacity: resolving ? 0.6 : 1 },
                        ]}
                        onPress={onResolve}
                        disabled={resolving}
                      >
                        <Text
                          style={[
                            styles.resolveButtonText,
                            { color: buttonPrimaryText },
                          ]}
                        >
                          {resolving ? 'Resolving...' : 'Resolve Alert'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </Section>
              )}

              {/* Alerts */}
              <Section title="Alerts Enabled" textColor={textPrimary}>
                <TagList
                  items={[
                    device.gps_alerts && 'GPS',
                    device.gyro_alerts && 'Gyroscope',
                    device.rfid_alerts && 'RFID',
                    device.sms_alerts_enabled && 'SMS',
                  ]}
                  bgColor={tagBg}
                  textColor={tagTextColor}
                />
              </Section>

              {/* Latest Data */}
              <Section
                title="Last Known Data"
                textColor={textPrimary}
                meta={<DateTimePill value={device.updated_at} />}
              >
                {device.latest_lat && (
                  <DataRow
                    label="Location"
                    value={`${device.latest_lat}, ${device.latest_lng}`}
                    labelColor={textSecondary}
                    valueColor={textPrimary}
                  />
                )}
                {device.latest_gyro_x && (
                  <DataRow
                    label="Gyroscope"
                    value={`${device.latest_gyro_x}, ${device.latest_gyro_y}, ${device.latest_gyro_z}`}
                    labelColor={textSecondary}
                    valueColor={textPrimary}
                  />
                )}
                {device.latest_rfid && (
                  <DataRow
                    label="RFID"
                    value={device.latest_rfid}
                    labelColor={textSecondary}
                    valueColor={textPrimary}
                  />
                )}
              </Section>
            </>
          )}

          {!(loading || !device) && (
            <View style={{ gap: 4, marginTop: 24 }}>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: buttonPrimaryBg },
                ]}
                onPress={() =>
                  router.navigate({
                    pathname: ROUTES.MAP.DEVICE_SETTINGS,
                    params: {
                      device_id: device.device_id,
                      device_color: device.device_color ?? '#E53935',
                    },
                  })
                }
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: buttonPrimaryText },
                  ]}
                >
                  View
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: closeButtonBg,
                    borderColor: closeButtonBorder,
                  },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.closeText, { color: closeButtonText }]}>
                  Close
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ----------------------- */
/* Small UI helpers       */
/* ----------------------- */
const Section = ({
  title,
  children,
  textColor,
  meta,
}: {
  title: string;
  children: React.ReactNode;
  textColor: string;
  meta?: React.ReactNode;
}) => (
  <View style={{ marginTop: 16 }}>
    <View style={{ gap: 6 }}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      {meta ? <View>{meta}</View> : null}
    </View>
    <View style={{ marginTop: 6 }}>{children}</View>
  </View>
);

const TagList = ({
  items,
  bgColor,
  textColor,
}: {
  items: (string | false)[];
  bgColor: string;
  textColor: string;
}) => {
  const valid = items.filter(Boolean) as string[];

  if (!valid.length) {
    return <Text style={{ color: textColor, opacity: 0.5 }}>None</Text>;
  }

  return (
    <View style={styles.tagRow}>
      {valid.map((item) => (
        <View key={item} style={[styles.tag, { backgroundColor: bgColor }]}>
          <Text style={[styles.tagText, { color: textColor }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const DataRow = ({
  label,
  value,
  valueElement,
  labelColor,
  valueColor,
}: {
  label: string;
  value: string;
  valueElement?: React.ReactNode;
  labelColor: string;
  valueColor: string;
}) => (
  <View style={styles.dataRow}>
    <Text style={[styles.dataLabel, { color: labelColor }]}>{label}</Text>
    {valueElement ? (
      valueElement
    ) : (
      <Text style={[styles.dataValue, { color: valueColor }]}>{value}</Text>
    )}
  </View>
);

/* ----------------------- */
/* Styles                 */
/* ----------------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },

  sheet: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 42,
  },
  loadingContainer: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  deviceName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },

  serial: {
    marginTop: 4,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  dataLabel: {
    fontWeight: '500',
    opacity: 0.6,
  },

  dataValue: {
    fontWeight: '500',
  },

  closeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  alertCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
  },
  alertStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  alertStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resolveButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
