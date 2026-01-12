import { ROUTES } from '@/constants/routes';
import { Stack } from 'expo-router';
import React from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import NavButton from '@/components/ui/NavButton';
import { HeaderEditButton } from '@/components/ui/HeaderEditButton';

function LayoutContent() {
  const { theme } = useTheme();

  // Dynamic colors based on theme
  const headerBg = theme === 'light' ? '#fff' : '#1e1e1e';
  const iconColor = theme === 'light' ? '#000' : '#fff';
  const titleColor = theme === 'light' ? '#000' : '#fff';

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
            <NavButton
              route={ROUTES.PROFILE.NOTIFICATIONS}
              iconName="bell"
              color={iconColor}
            />
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
        name="profile/devices"
        options={{
          headerStyle: { backgroundColor: headerBg },
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Text
              style={{ fontSize: 18, fontWeight: '600', color: titleColor }}
            >
              Device Details
            </Text>
          ),
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
});

export default function AppLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
