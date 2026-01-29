import { router } from 'expo-router';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import DevicePrefix from './DevicePrefix';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';

const StatusPill = ({
  enabled,
  label,
  color,
  maxWidth = 90,
}: {
  enabled: boolean;
  label: string;
  color: string;
  maxWidth?: number;
}) => {
  const { theme } = useTheme();
  const bgDisabled = theme === 'light' ? '#e5e7eb' : '#2a2a2a';
  const textDisabled = theme === 'light' ? '#9ca3af' : '#ccc';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: enabled ? `${color}22` : bgDisabled,
          maxWidth,
        },
      ]}
    >
      <Text
        style={[styles.pillText, { color: enabled ? color : textDisabled }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
    </View>
  );
};

export const DeviceCard = ({
  device,
  disablePress = false,
  unresolvedCount,
  nfcCount,
  showEditButton = false,
  onEditPress,
}: {
  device: any;
  disablePress?: boolean;
  unresolvedCount?: number;
  nfcCount?: number;
  showEditButton?: boolean;
  onEditPress?: () => void;
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isOffline = !device.paired;

  const cardBg = theme === 'light' ? '#ffffff' : '#1e1e1e';
  const offlineOpacity = isOffline ? 0.6 : 1;
  const statusOnlineColor = theme === 'light' ? '#2fa500' : '#4ade80';
  const statusPillBg = theme === 'light' ? '#e5e7eb' : '#2a2a2a';
  const statusPillText = theme === 'light' ? '#6b7280' : '#9ca3af';
  const unresolvedBg = theme === 'light' ? '#ef444422' : '#ef444433';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const subTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const alertTagColor = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const relayTagColor = theme === 'light' ? '#ef4444' : '#f87171';
  const ignitionTagColor = theme === 'light' ? '#f59e0b' : '#fbbf24';
  const editColor = alertTagColor;
  const latestLat = Number(device.latest_lat);
  const latestLng = Number(device.latest_lng);
  const hasMapLocation =
    Number.isFinite(latestLat) &&
    Number.isFinite(latestLng) &&
    !(latestLat === 0 && latestLng === 0);

  const resolvedNfcCount =
    typeof nfcCount === 'number'
      ? nfcCount
      : typeof device.nfc_count === 'number'
        ? device.nfc_count
        : undefined;
  const nfcLabel =
    resolvedNfcCount === undefined
      ? 'Unknown'
      : resolvedNfcCount > 0
        ? `Linked${resolvedNfcCount > 1 ? ` (${resolvedNfcCount})` : ''}`
        : 'Not linked';

  const notificationsEnabled = user?.notifications_enabled ?? true;
  const alertTypes = [
    device.gps_alerts && 'GPS',
    device.gyro_alerts && 'Gyro',
    device.rfid_alerts && 'RFID',
    device.sms_alerts_enabled && 'SMS',
  ].filter(Boolean) as string[];
  const alertTypePills = alertTypes.length ? alertTypes : ['Default'];

  const handlePress = () => {
    if (disablePress) return;
    router.navigate({
      pathname: ROUTES.MAP.DEVICE_SETTINGS,
      params: {
        device_id: device.device_id,
        device_color: device.device_color ?? '#E53935',
      },
    });
  };

  return (
    <Pressable
      style={[
        styles.deviceCard,
        { backgroundColor: cardBg, opacity: offlineOpacity },
      ]}
      onPress={handlePress}
      disabled={disablePress}
    >
      {/* Header */}
      <View style={styles.deviceHeader}>
        <DevicePrefix color={device.device_color ?? '#E53935'} />
        <View style={styles.deviceHeaderMain}>
          <View style={styles.deviceNameRow}>
            <Text
              style={[styles.deviceName, { color: textColor }]}
              numberOfLines={1}
            >
              {device.device_name}
            </Text>
            <Text
              style={[styles.deviceSerial, { color: subTextColor }]}
              numberOfLines={1}
            >
              ({device.serial_number || '—'})
            </Text>
            <View
              style={[
                styles.deviceStatusPill,
                {
                  backgroundColor: isOffline
                    ? statusPillBg
                    : `${statusOnlineColor}22`,
                },
              ]}
            >
              <Text
                style={[
                  styles.deviceStatusText,
                  { color: isOffline ? statusPillText : statusOnlineColor },
                ]}
              >
                {isOffline ? 'Disabled' : 'Enabled'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.devicePillsRow}>
          {showEditButton && onEditPress && (
            <Pressable
              style={[styles.editIconBtn, { borderColor: editColor }]}
              onPress={onEditPress}
            >
              <FontAwesome name="pencil" size={12} color={editColor} />
            </Pressable>
          )}
          {typeof unresolvedCount === 'number' && unresolvedCount > 0 && (
            <View
              style={[styles.unresolvedPill, { backgroundColor: unresolvedBg }]}
            >
              <Text style={styles.unresolvedText}>
                {(unresolvedCount > 9 ? '9+' : unresolvedCount) + ' unresolved'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Relays */}
      <Text style={[styles.sectionLabel, { color: textColor }]}>Relays</Text>
      <View style={styles.deviceStatusRow}>
        <StatusPill
          enabled={device.relay1_enabled}
          label="Alarm"
          color={relayTagColor}
        />
        <StatusPill
          enabled={device.relay2_enabled}
          label="Ignition"
          color={ignitionTagColor}
        />
      </View>

      {/* Alerts */}
      <Text style={[styles.sectionLabel, { color: textColor }]}>
        Alert Type
      </Text>
      <View style={styles.deviceStatusRow}>
        {notificationsEnabled ? (
          alertTypePills.map((label) => (
            <StatusPill
              key={label}
              enabled={true}
              label={label}
              color={alertTagColor}
            />
          ))
        ) : (
          <StatusPill
            enabled={false}
            label="Notifications Off"
            color={alertTagColor}
            maxWidth={140}
          />
        )}
      </View>

      {/* NFC */}
      <Text style={[styles.sectionLabel, { color: textColor }]}>NFC</Text>
      <View style={styles.deviceStatusRow}>
        <StatusPill
          enabled={resolvedNfcCount !== undefined && resolvedNfcCount > 0}
          label={nfcLabel}
          color={alertTagColor}
        />
      </View>

      <View style={styles.footerRow}>
        {hasMapLocation ? (
          <Pressable
            style={styles.viewMapBtn}
            onPress={() => {
              router.dismissTo({
                pathname: ROUTES.APP.MAP,
                params: { focusDeviceId: device.device_id },
              });
            }}
          >
            <FontAwesome name="map-marker" size={14} color="#fff" />
            <Text style={styles.viewMapText}>View on Map</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  deviceCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
  },

  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  deviceHeaderMain: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  deviceSerial: {
    fontSize: 12,
    fontWeight: '600',
  },
  devicePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  deviceStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unresolvedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 6,
  },
  unresolvedText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },

  deviceStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: 36,
    marginRight: 8,
  },
  sectionLabel: {
    marginLeft: 36,
    marginTop: 6,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },

  footerRow: {
    marginTop: 10,
    alignItems: 'flex-end',
    position: 'relative',
  },

  viewMapBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#9F0EA1',
  },

  viewMapText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
