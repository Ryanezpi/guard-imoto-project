import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          nameTextBold={true}
          prefixIcon="server"
          suffixIcon="chevron-right"
          onPress={() => router.navigate(ROUTES.MAP.DEVICES)}
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
