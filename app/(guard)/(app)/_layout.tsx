import { HeaderEditButton } from '@/components/ui/HeaderEditButton';
import NavButton from '@/components/ui/NavButton';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { getMyAlerts } from '@/services/user.service';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

function LayoutContent() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const [hasAlertBadge, setHasAlertBadge] = useState(false);

  // Dynamic colors based on theme
  const headerBg = theme === 'light' ? '#fff' : '#1e1e1e';
  const iconColor = theme === 'light' ? '#000' : '#fff';
  const titleColor = theme === 'light' ? '#000' : '#fff';
  const badgeColor = '#ef4444';

  const loadAlertBadge = useCallback(async () => {
    if (!idToken) {
      setHasAlertBadge(false);
      return;
    }
    try {
      const res = await getMyAlerts(idToken);
      const hasUnresolved = Boolean(
        res?.alerts?.some((alert: any) => !alert?.resolved)
      );
      setHasAlertBadge(hasUnresolved);
    } catch (e) {
      console.log('[ALERT BADGE]', e);
    }
  }, [idToken]);

  useEffect(() => {
    loadAlertBadge();
    const interval = setInterval(loadAlertBadge, 30000);
    return () => clearInterval(interval);
  }, [loadAlertBadge]);

  return (
    <Stack>
      {/* Map Dashboard */}
      <Stack.Screen
        name="map/index"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{ fontSize: 18, fontWeight: 'bold', color: titleColor }}
            >
              <Image
                source={require('@/assets/icons/main-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Text>
          ),

          headerLeft: () => (
            <NavButton
              route={ROUTES.APP.SETTINGS}
              iconName="bars"
              color={iconColor}
            />
          ),
          headerRight: () => (
            <View style={{ position: 'relative' }}>
              <NavButton
                route={ROUTES.PROFILE.NOTIFICATIONS}
                iconName="bell"
                color={iconColor}
              />
              {hasAlertBadge && (
                <View
                  style={[styles.badgeDot, { backgroundColor: badgeColor }]}
                />
              )}
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'Menu',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />

      <Stack.Screen
        name="profile/edit"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: titleColor }}
            >
              Profile
            </Text>
          ),
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
          headerRight: () => <HeaderEditButton />,
        }}
      />
      <Stack.Screen
        name="profile/notifications"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'Notifications',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="map/devices"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'Devices',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="map/device-settings"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'Device Settings',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="map/device/nfc"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'NFC Configuration',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="map/device/alarm-type"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitle: 'Alarm Type',
          headerTitleAlign: 'center',
          headerTintColor: iconColor, // back button color
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="profile/logs"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: titleColor }}
            >
              Audit Logs
            </Text>
          ),
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
      <Stack.Screen
        name="profile/audit-log-details"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: titleColor }}
            >
              Audit Log Details
            </Text>
          ),
          headerLeft: () => (
            <NavButton route="back" iconName="arrow-left" color={titleColor} />
          ),
        }}
      />
    </Stack>
  );
}
const styles = StyleSheet.create({
  logo: {
    width: 64,
    height: 64,
  },
  badgeDot: {
    position: 'absolute',
    right: 6,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default function AppLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
