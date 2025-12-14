import React from 'react';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DevicePrefix from '@/components/ui/DevicePrefix';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const router = useRouter();

  const items: DynamicListItem[] = [
    {
      id: '1',
      name: 'DEV-123456',
      subText: 'Strong vibration detected',
      prefixElement: <DevicePrefix color="#E53935" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-10-02T12:00:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: {
            deviceId: 'DEV-123456',
            deviceEnabled: 'true',
            prefixColor: '#E53935',
          },
        }),
    },
    {
      id: '2',
      name: 'DEV-123456',
      subText: 'Moderate vibration detected',
      prefixElement: <DevicePrefix color="#E53935" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-10-02T12:00:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: {
            deviceId: 'DEV-123456',
            prefixColor: '#E53935',
            deviceEnabled: 'true',
          },
        }),
    },
    {
      id: '3',
      name: 'DEV-123456',
      subText: 'Minor vibration detected',

      prefixIcon: 'check-circle',
      suffixIcon: 'chevron-right',
      date: new Date('2025-10-02T12:00:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: {
            deviceId: 'DEV-123456',
            prefixColor: '#E53935',
            deviceEnabled: 'true',
          },
        }),
    },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <DynamicList items={items} />
    </SafeAreaView>
  );
}
