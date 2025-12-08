import { ROUTES } from '@/constants/routes';
import { Stack } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import NavButton from '@/components/ui/NavButton';

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
              MyLogo
            </Text>
          ),

          headerLeft: () => (
            <NavButton route={ROUTES.APP.SETTINGS} iconName="bars" color={iconColor} />
          ),
          headerRight: () => (
            <NavButton route={ROUTES.PROFILE.NOTIFICATIONS} iconName="bell" color={iconColor} />
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
        }}
      />
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
