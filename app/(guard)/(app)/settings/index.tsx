import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import React, { useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727ff';

  // --- Copy ID Token (User Auth) ---
  const copyIdToken = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(true);
        await Clipboard.setStringAsync(idToken);
        Alert.alert(
          'Auth Token Copied',
          'Paste this into Postman Authorization header.'
        );
      } else {
        Alert.alert('Error', 'No user logged in.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to get ID token.');
    }
  };

  const handlePushToggle = async (nextValue: boolean) => {
    // Turning OFF is always allowed
    if (!nextValue) {
      setPushNotificationsEnabled(false);
      return;
    }

    // Physical device required
    if (!Device.isDevice) {
      Alert.alert(
        'Unsupported Device',
        'Push notifications require a physical device.'
      );
      return;
    }

    // Check current permission
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Request if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Still denied → force user to settings
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in system settings to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );

      // Ensure toggle stays OFF
      setPushNotificationsEnabled(false);
      return;
    }

    // ✅ Permission granted
    setPushNotificationsEnabled(true);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 120 }}
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
            onToggle={handlePushToggle}
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

        {/* --- Developer Section --- */}
        <TitleSection title="Developer Tools">
          <DynamicCard
            name="Copy ID Token (JWT)"
            prefixIcon="code"
            suffixIcon="copy"
            onPress={copyIdToken}
          />
        </TitleSection>

        <View style={{ paddingBottom: 12 }}>
          <DynamicCard
            key={theme + 'logout'}
            name="Logout"
            prefixIcon="sign-out"
            prefixColor="#ff4d4f"
            onPress={async () => {
              try {
                await signOut(auth);
                await AsyncStorage.multiRemove(['theme', 'onboardingSeen']);
                router.replace(ROUTES.AUTH.LOGIN);
              } catch (err) {
                console.error('Logout failed', err);
              }
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
