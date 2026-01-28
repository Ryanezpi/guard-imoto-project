import DynamicCard from '@/components/ui/Card';
import DeviceDetailsModal from '@/components/ui/DeviceDetailsModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DynamicListItem } from '@/components/ui/DynamicList';
import { useAuth } from '@/context/AuthContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import DateTimePill from '@/components/ui/DateTimePill';
import HelperBox from '@/components/ui/HelperBoxProps';
import {
  getByDeviceId,
  getMyAlerts,
  resolveAlert,
} from '@/services/user.service';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams } from 'expo-router';

type AlertItem = {
  alert_id: string;
  device_id: string;
  device_name?: string | null;
  serial_number?: string | null;
  type: string;
  created_at: string;
  resolved?: boolean;
  metadata?: Record<string, any>;
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { idToken, user } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const params = useGlobalSearchParams() as { alert_id?: string };

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const primaryColor = theme === 'light' ? '#9F0EA1' : '#C06BD6';

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const handleAlertPress = useCallback(
    async (alert: AlertItem) => {
      try {
        setDeviceLoading(true);
        setDetailsVisible(true);
        setSelectedAlert(alert);

        const res = await getByDeviceId(idToken!, alert.device_id);
        setSelectedDevice(res.device);
      } catch (e) {
        console.error('[DEVICE DETAILS]', e);
        setDetailsVisible(false);
      } finally {
        setDeviceLoading(false);
      }
    },
    [idToken]
  );

  const handleResolveAlert = useCallback(async () => {
    if (!selectedAlert || !idToken || resolving) return;
    try {
      setResolving(true);
      await resolveAlert(idToken, selectedAlert.alert_id);
      setAlerts((prev: AlertItem[]) =>
        prev.map((a) =>
          a.alert_id === selectedAlert.alert_id ? { ...a, resolved: true } : a
        )
      );
      setSelectedAlert((prev: AlertItem | null) =>
        prev ? { ...prev, resolved: true } : prev
      );
    } catch (e) {
      console.error('[RESOLVE ALERT]', e);
    } finally {
      setResolving(false);
    }
  }, [idToken, resolving, selectedAlert]);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await getMyAlerts(idToken!);
      setAlerts((res.alerts || []) as AlertItem[]);
    } catch (e) {
      console.error('[ALERTS]', e);
    }
  }, [idToken]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await loadAlerts();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadAlerts]);

  useEffect(() => {
    if (autoOpened || !params.alert_id || !alerts.length) return;
    const match = alerts.find((a) => a.alert_id === params.alert_id);
    if (match) {
      setAutoOpened(true);
      handleAlertPress(match);
    }
  }, [alerts, autoOpened, handleAlertPress, params.alert_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    showLoader();
    await loadAlerts();
    hideLoader();
    setRefreshing(false);
  }, [loadAlerts, showLoader, hideLoader]);

  const items: DynamicListItem[] = useMemo(() => {
    return alerts.map((alert) => {
      const color = alert.type.includes('gps')
        ? '#FB8C00'
        : alert.type.includes('gyro')
          ? '#E53935'
          : alert.type.includes('rfid')
            ? '#8E24AA'
            : '#9F0EA1';
      const iconName = alert.type.includes('gps')
        ? 'map-marker'
        : alert.type.includes('gyro')
          ? 'bullseye'
          : alert.type.includes('rfid')
            ? 'id-card'
            : 'bell';

      const resolved = Boolean(alert.resolved);
      const statusColor = resolved ? '#22c55e' : '#ef4444';
      const statusText = resolved ? 'Resolved' : 'Active';
      const statusBg =
        theme === 'light'
          ? resolved
            ? '#22c55e22'
            : '#ef444422'
          : resolved
            ? '#22c55e33'
            : '#ef444433';

      return {
        id: alert.alert_id,
        name:
          (alert.device_name || 'Unknown Device') + ` - ${alert.serial_number}`,
        nameElement: (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flex: 1,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontWeight: '700',
                  color: theme === 'light' ? '#000' : '#fff',
                }}
                numberOfLines={1}
              >
                {alert.device_name || 'Unknown Device'}{' '}
                <Text
                  style={{
                    color: theme === 'light' ? '#6b7280' : '#9ca3af',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  ({alert.serial_number || '—'})
                </Text>
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: statusBg,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  color: statusColor,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {statusText}
              </Text>
            </View>
          </View>
        ),
        subTextElement: (
          <View style={{ gap: 6, marginTop: 2 }}>
            <Text
              style={{
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {alert.type.replace(/_/g, ' ')}
            </Text>
            <DateTimePill value={alert.created_at} />
          </View>
        ),
        prefixElement: (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: `${color}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FontAwesome name={iconName as any} size={14} color={color} />
          </View>
        ),
        suffixIcon: 'chevron-right',
        onPress: () => handleAlertPress(alert),
      };
    });
  }, [alerts, handleAlertPress, theme]);
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor, padding: 16 }}
      edges={['bottom', 'left', 'right']}
    >
      {!user?.notifications_enabled && (
        <HelperBox
          variant="warning"
          iconName="bell-slash"
          text="Notifications are off. Alerts will still appear here, but your device won't receive push notifications."
        />
      )}
      <DeviceDetailsModal
        visible={detailsVisible}
        loading={deviceLoading}
        device={selectedDevice}
        alert={selectedAlert}
        resolving={resolving}
        onResolve={handleResolveAlert}
        onClose={() => setDetailsVisible(false)}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DynamicCard
            key={item.id}
            prefixElement={item.prefixElement}
            nameElement={item.nameElement}
            suffixElement={item.suffixElement}
            suffixIcon={item.suffixIcon}
            onPress={item.onPress}
            name={item.name}
            nameTextBold={true}
            subText={item.subText}
            subTextElement={item.subTextElement}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40,
            }}
          >
            <Text style={{ opacity: 0.6 }}>No alerts yet</Text>
            <Text style={{ opacity: 0.4, marginTop: 6 }}>
              Pull down to refresh
            </Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
