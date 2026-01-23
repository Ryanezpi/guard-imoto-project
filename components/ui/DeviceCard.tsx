import { router } from 'expo-router';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import DevicePrefix from './DevicePrefix';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';

const StatusPill = ({
  enabled,
  label,
  color,
}: {
  enabled: boolean;
  label: string;
  color: string;
}) => {
  const { theme } = useTheme();
  const bgDisabled = theme === 'light' ? '#e5e7eb' : '#2a2a2a';
  const borderDisabled = theme === 'light' ? '#d1d5db' : '#444';
  const textDisabled = theme === 'light' ? '#9ca3af' : '#ccc';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: enabled ? `${color}22` : bgDisabled,
          borderColor: enabled ? color : borderDisabled,
        },
      ]}
    >
      <Text
        style={[styles.pillText, { color: enabled ? color : textDisabled }]}
      >
        {label}
      </Text>
    </View>
  );
};

export const DeviceCard = ({ device }: { device: any }) => {
  const { theme } = useTheme();
  const isOffline = !device.paired;

  const cardBg = theme === 'light' ? '#ffffff' : '#1e1e1e';
  const offlineOpacity = isOffline ? 0.6 : 1;
  const statusOnlineColor = theme === 'light' ? '#2fa500' : '#4ade80';
  const statusOfflineColor = theme === 'light' ? '#9ca3af' : '#aaa';
  const textColor = theme === 'light' ? '#000' : '#fff';

  return (
    <Pressable
      style={[
        styles.deviceCard,
        { backgroundColor: cardBg, opacity: offlineOpacity },
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
      {/* Header */}
      <View style={styles.deviceHeader}>
        <DevicePrefix color={device.device_color ?? '#E53935'} />
        <Text style={[styles.deviceName, { color: textColor }]}>
          {device.device_name} - ({device.serial_number})
        </Text>
        <Text
          style={[
            styles.deviceStatus,
            { color: isOffline ? statusOfflineColor : statusOnlineColor },
          ]}
        >
          {isOffline ? 'Disabled' : 'Enabled'}
        </Text>
      </View>

      {/* Status Row */}
      <View style={styles.deviceStatusRow}>
        <StatusPill
          enabled={device.relay1_enabled}
          label="Alarm"
          color="#ef4444"
        />
        <StatusPill
          enabled={device.relay2_enabled}
          label="Ignition"
          color="#f59e0b"
        />
        <StatusPill enabled={device.gps_alerts} label="GPS" color="#3b82f6" />
        <StatusPill enabled={device.gyro_alerts} label="Gyro" color="#8b5cf6" />
        <StatusPill enabled={device.rfid_alerts} label="RFID" color="#10b981" />
        <StatusPill
          enabled={device.sms_alerts_enabled}
          label="SMS"
          color="#06b6d4"
        />
      </View>

      <View style={styles.footerRow}>
        <Pressable
          style={styles.viewMapBtn}
          onPress={() => {
            router.dismissTo({
              pathname: ROUTES.APP.MAP,
              params: { focusDeviceId: device.device_id },
            });
          }}
        >
          <Text style={styles.viewMapText}>View on Map</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  deviceCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
  },

  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  deviceName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },

  deviceStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  deviceStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginLeft: 36,
    marginRight: 8,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: 90,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },

  footerRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },

  viewMapBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },

  viewMapText: {
    color: '#FFFFFF',

    fontWeight: '600',
    fontSize: 13,
  },
});
