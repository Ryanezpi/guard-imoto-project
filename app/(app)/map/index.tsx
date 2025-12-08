import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';

export default function MapDashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  const mapBg = theme === 'light' ? '#e0e0e0' : '#1e1e1e';
  const bottomBg = theme === 'light' ? '#f0f0f0' : '#272727';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === 'light' ? '#f0f0f0' : '#121212' },
      ]}
    >
      {/* Map placeholder */}
      <View style={[styles.mapContainer, { backgroundColor: mapBg }]}>
        <Text
          style={{ fontSize: 20, color: theme === 'light' ? '#000' : '#fff' }}
        >
          Map goes here
        </Text>
      </View>

      {/* Bottom action cards */}
      <SafeAreaView
        style={[styles.bottomCards, { backgroundColor: bottomBg }]}
        edges={['bottom', 'left', 'right']}
      >
        <DynamicCard
          key={theme + 'devices'}
          name="Devices"
          subText={3}
          subTextBold={false}
          prefixIcon="server"
          onPress={() => router.push(ROUTES.PROFILE.DEVICES)}
        />

        <DynamicCard
          key={theme + 'history'}
          name="History"
          subText={'View your RFID activity log'}
          prefixIcon="history"
          subTextBold={false}
          onPress={() => router.push(ROUTES.PROFILE.HISTORY)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCards: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
