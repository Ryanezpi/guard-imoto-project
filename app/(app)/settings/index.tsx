import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
            suffixIcon="chevron-right"
            onPress={() => router.navigate(ROUTES.PROFILE.EDIT)}
          />
        </TitleSection>

        <TitleSection title="Notifications">
          <DynamicCard
            name="Push Notifications"
            prefixIcon="bell"
            suffixIcon="chevron-right"
            toggle
            toggleValue={pushNotificationsEnabled}
            onToggle={setPushNotificationsEnabled}
          />
        </TitleSection>

        <TitleSection title="Theme">
          <DynamicCard
            name={theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            prefixIcon={theme === 'light' ? 'sun-o' : 'moon-o'}
            suffixIcon="chevron-right"
            toggle
            toggleValue={theme === 'light'}
            onToggle={toggleTheme}
          />
        </TitleSection>

        <TitleSection title="Logs">
          <DynamicCard
            name="Audit Logs"
            prefixIcon="file-text"
            suffixIcon="chevron-right"
            onPress={() => router.navigate(ROUTES.PROFILE.LOGS)}
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
              // 1. Firebase logout (THIS is critical)
              await signOut(auth);

              // 2. Optional: clear app-specific storage (not everything)
              await AsyncStorage.multiRemove([
                'theme',
                'onboardingSeen',
                // add only what YOU own
              ]);

              // 3. Route back to login
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
    paddingBottom: 16,
  },
});
