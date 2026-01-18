import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DynamicListItem } from '@/components/ui/DynamicList';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DevicePrefix from '@/components/ui/DevicePrefix';
import {
  ActivityIndicator,
  View,
  Text,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getMyAlerts } from '@/services/user.service';
import DynamicCard from '@/components/ui/Card';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const router = useRouter();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await getMyAlerts(idToken!);
      setAlerts(res.alerts || []);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  const items: DynamicListItem[] = useMemo(() => {
    return alerts.map((alert) => {
      const color = alert.type.includes('gps')
        ? '#FB8C00'
        : alert.type.includes('gyro')
          ? '#E53935'
          : alert.type.includes('rfid')
            ? '#8E24AA'
            : '#2563EB';

      return {
        id: alert.alert_id,
        name:
          (alert.device_name || 'Unknown Device') + ` - ${alert.serial_number}`,
        subText:
          alert.type.replace(/_/g, ' ') +
          ` - ${new Date(alert.created_at).toDateString()}`,
        prefixElement: <DevicePrefix color={color} />,
        suffixIcon: 'chevron-right',
        onPress: () =>
          router.navigate({
            pathname: '/profile/devices',
            params: {
              deviceId: alert.device_id,
              prefixColor: color,
              deviceEnabled: 'true',
            },
          }),
      };
    });
  }, [alerts, router]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor, padding: 16 }}
      edges={['bottom', 'left', 'right']}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DynamicCard
            key={item.id}
            prefixElement={item.prefixElement}
            suffixIcon={item.suffixIcon}
            onPress={item.onPress}
            name={item.name}
            nameTextBold={true}
            subText={item.subText}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === 'light' ? '#000' : '#fff'}
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
