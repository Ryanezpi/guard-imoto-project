import React from 'react';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DevicePrefix from '@/components/ui/DevicePrefix';

export default function AuditLogsScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const router = useRouter();

  const auditItems: DynamicListItem[] = [
    {
      id: '1',
      name: 'DEV-123456',
      subText: 'Siren triggered manually by admin',
      prefixElement: <DevicePrefix color="#E53935" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-12-14T09:15:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: { deviceId: 'DEV-123456' },
        }),
    },
    {
      id: '2',
      name: 'DEV-123456',
      subText: 'Firmware updated to v2.1.0',
      prefixElement: <DevicePrefix color="#E53935" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-12-13T16:30:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: { deviceId: 'DEV-123456' },
        }),
    },
    {
      id: '3',
      name: 'DEV-789012',
      subText: 'Device unpaired by user',
      prefixElement: <DevicePrefix color="#4e8cff" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-12-12T14:45:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: { deviceId: 'DEV-789012' },
        }),
    },
    {
      id: '4',
      name: 'DEV-789012',
      subText: 'Low battery alert triggered',
      prefixElement: <DevicePrefix color="#4e8cff" />,
      suffixIcon: 'chevron-right',
      date: new Date('2025-12-12T08:20:00'),
      onPress: () =>
        router.navigate({
          pathname: '/profile/devices',
          params: { deviceId: 'DEV-789012' },
        }),
    },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <DynamicList items={auditItems} />
    </SafeAreaView>
  );
}
