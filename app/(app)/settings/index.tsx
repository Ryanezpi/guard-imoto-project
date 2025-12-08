import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';

export const screenOptions = {
  headerTitle: 'Menu',
  headerTitleAlign: 'center',
};

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727ff';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 120 }} // Add bottom padding so content won't overlap sticky logout
      >
        <TitleSection title="Account Settings">
          <DynamicCard
            name="Profile"
            prefixIcon="user"
            onPress={() => console.log('Navigate to Profile')}
          />
        </TitleSection>

        <TitleSection title="Notifications">
          <DynamicCard
            name="Push Notifications"
            prefixIcon="bell"
            toggle
            toggleValue={pushNotificationsEnabled}
            onToggle={setPushNotificationsEnabled}
          />
        </TitleSection>

        <TitleSection title="Theme">
          <DynamicCard
            name={theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            prefixIcon={theme === 'light' ? 'sun-o' : 'moon-o'}
            toggle
            toggleValue={theme === 'light'}
            onToggle={toggleTheme}
          />
        </TitleSection>

        <TitleSection title="Logs">
          <DynamicCard
            name="Audit Logs"
            prefixIcon="file-text"
            onPress={() => console.log('Navigate to Audit Logs')}
          />
        </TitleSection>
      </ScrollView>

      {/* Sticky logout at bottom */}
      <View style={styles.logoutContainer}>
        <DynamicCard
          key={theme + 'logout'}
          name="Logout"
          prefixIcon="sign-out"
          prefixColor="#ff4d4f"
          onPress={async () => {
            try {
              await AsyncStorage.clear();
              // Navigate back to login
              router.replace(ROUTES.AUTH.LOGIN);
            } catch (err) {
              console.error('Logout failed', err);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16, // safe area padding
  },
});
