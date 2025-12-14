import { Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import DynamicList, { DynamicListItem } from '@/components/ui/DynamicList';
import { useGlobalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DevicePrefix from '@/components/ui/DevicePrefix';

export default function DevicesScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.deviceId ?? 'Unknown Device';

  const items: DynamicListItem[] = [
    {
      id: 'header',
      name: deviceId,
      prefixElement: <DevicePrefix color={params.prefixColor ?? '#000'} />,
      suffixIcon: 'cog',
      onPress: () => {},
    },
    {
      id: '2header',
      name: 'Strong Vibration Detected',
      prefixIcon: 'exclamation-triangle',
      subText: new Date('2025-10-02T12:00:00').toISOString(),
    },
    {
      id: '1',
      name: 'Battery',
      prefixIcon: 'battery',
      subText: '100%',
    },
    {
      id: '2',
      name: 'Location',
      prefixIcon: 'map',
      expandable: true,
      expanded: true,
      children: (
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>Test</Text>
      ),
    },
    {
      id: '3',
      name: 'Gyroscope',
      prefixIcon: 'balance-scale',
      expandable: true,
      expanded: true,
      children: (
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>
          Connected via VPN
        </Text>
      ),
    },
    {
      id: '4',
      name: 'RFID History',
      prefixIcon: 'file-text',
      expandable: true,
      expanded: true,
      children: (
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>
          Connected via VPN
        </Text>
      ),
    },
    {
      id: '5',
      name: 'Detection History',
      prefixIcon: 'clock-o',
      expandable: true,
      expanded: true,
      children: (
        <Text style={{ color: theme === 'light' ? '#000' : '#fff' }}>
          Connected via VPN
        </Text>
      ),
    },
  ];

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: bgColor,
      }}
      edges={['bottom', 'left', 'right']}
    >
      <DynamicList items={items} />
    </SafeAreaView>
  );
}
