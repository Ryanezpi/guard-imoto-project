import DynamicCard from '@/components/ui/Card';
import ConfirmModal, {
  type AlertAction,
} from '@/components/ui/forms/ConfirmModal';
import SegmentToggle from '@/components/ui/SegmentToggle';
import TitleSection from '@/components/ui/TitleSection';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { updateProfile } from '@/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdToken, signOut } from '@react-native-firebase/auth';
import * as Clipboard from 'expo-clipboard';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { logout, idToken, user, refreshUser } = useAuth();
  const { showLoader, hideLoader } = useLoader();
  const [pushNotificationsEnabled, setPushNotificationsEnabled] =
    useState(false);
  const [showDisableNotifications, setShowDisableNotifications] =
    useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
  }>({ visible: false, actions: [] });

  const closeAlert = useCallback(
    () => setAlert((prev) => ({ ...prev, visible: false })),
    []
  );
  const openAlert = useCallback(
    (title: string, message: string, actions?: AlertAction[]) =>
      setAlert({
        visible: true,
        title,
        message,
        actions: actions ?? [
          { text: 'OK', variant: 'primary', onPress: closeAlert },
        ],
      }),
    [closeAlert]
  );

  useEffect(() => {
    if (!user) return;
    setPushNotificationsEnabled(Boolean(user.notifications_enabled));
  }, [user]);

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727ff';
  const resetApp = async () => {
    try {
      showLoader();
      await AsyncStorage.clear();
      await signOut(auth);
      console.log('App storage and Auth cleared!');
      router.replace(ROUTES.AUTH.LOGIN);
    } catch (e) {
      console.log('Failed to reset app', e);
    } finally {
      hideLoader();
    }
  };
  // --- Log ID Token (User Auth) ---
  const copyIdToken = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await getIdToken(user, true);
        console.log('[Auth] ID token:', idToken);
      }
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    copyIdToken();
  }, [copyIdToken]);

  const handlePushToggle = async (nextValue: boolean) => {
    if (!idToken) {
      openAlert('Error', 'No user token found. Please log in again.');
      return;
    }

    // Turning OFF is always allowed
    if (!nextValue) {
      setShowDisableNotifications(true);
      return;
    }

    // Physical device required
    if (!Device.isDevice) {
      openAlert(
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
      openAlert(
        'Notifications Disabled',
        'Please enable notifications in system settings to receive alerts.',
        [
          { text: 'Cancel', variant: 'cancel', onPress: closeAlert },
          {
            text: 'Open Settings',
            variant: 'primary',
            onPress: () => {
              closeAlert();
              Linking.openSettings();
            },
          },
        ]
      );

      // Ensure toggle stays OFF
      setPushNotificationsEnabled(false);
      return;
    }

    // ✅ Permission granted → enable in backend
    showLoader();
    try {
      await updateProfile(idToken, { notifications_enabled: true });
      setPushNotificationsEnabled(true);
      await refreshUser();
    } catch (err) {
      console.log('[Push] Failed to enable notifications:', err);
      openAlert('Error', 'Failed to update notification preference.');
      setPushNotificationsEnabled(false);
    } finally {
      hideLoader();
    }
  };

  const confirmDisableNotifications = async () => {
    if (!idToken) return;
    setShowDisableNotifications(false);
    showLoader();
    try {
      await updateProfile(idToken, { notifications_enabled: false });
      setPushNotificationsEnabled(false);
      await refreshUser();
    } catch (err) {
      console.log('[Push] Failed to disable notifications:', err);
      openAlert('Error', 'Failed to update notification preference.');
    } finally {
      hideLoader();
    }
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
          <SegmentToggle
            value={theme}
            onChange={(next) => setTheme(next)}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
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

        {/*
          --- Developer Section ---
          Uncomment when needed.
        */}
        {/*
        <TitleSection title="Developer Tools">
          <DynamicCard
            name="Copy ID Token (JWT)"
            prefixIcon="code"
            suffixIcon="copy"
            onPress={copyIdToken}
          />
          <DynamicCard
            name="Reset App (Clear Storage & Logout)"
            prefixIcon="trash"
            onPress={resetApp}
          />
        </TitleSection>
        */}

        <View style={{ paddingBottom: 12 }}>
          <DynamicCard
            key={theme + 'logout'}
            name="Logout"
            prefixIcon="sign-out"
            prefixColor="#ff4d4f"
            onPress={async () => {
              showLoader();
              try {
                await logout();
                await AsyncStorage.multiRemove(['theme', 'onboardingSeen']);
              } catch (err) {
                console.log('Logout failed', err);
              } finally {
                hideLoader();
              }
            }}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDisableNotifications}
        title="Disable Notifications?"
        confirmText="Turn Off"
        cancelText="Cancel"
        onCancel={() => setShowDisableNotifications(false)}
        onConfirm={confirmDisableNotifications}
      >
        <View>
          <Text style={{ marginBottom: 8 }}>
            Turning this off will bypass device alerts. You can still see alert
            logs, but you will not receive push notifications.
          </Text>
        </View>
      </ConfirmModal>

      <ConfirmModal
        visible={alert.visible}
        title={alert.title}
        actions={alert.actions}
        onCancel={closeAlert}
        onDismiss={closeAlert}
      >
        {alert.message ? <Text>{alert.message}</Text> : null}
      </ConfirmModal>
    </SafeAreaView>
  );
}
