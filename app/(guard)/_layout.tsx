import { Slot, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import * as Notifications from 'expo-notifications';
import { CreateAccountProvider } from '@/context/CreateAccountContext';

export default function AuthLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    (async () => {
      const value = await AsyncStorage.getItem('@onboarding_complete');
      setOnboardingComplete(value === 'true');
      setReady(true);
    })();
  }, []);

  const handleNotificationNavigation = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response) {
        router.push(ROUTES.PROFILE.NOTIFICATIONS);
        return;
      }

      const data = response.notification.request.content.data as {
        alert_id?: string;
        alertId?: string;
      };
      const alertId = data?.alert_id ?? data?.alertId;

      if (alertId) {
        router.push({
          pathname: ROUTES.PROFILE.NOTIFICATIONS,
          params: { alert_id: String(alertId) },
        });
      } else {
        router.push(ROUTES.PROFILE.NOTIFICATIONS);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!ready) return;

    if (!onboardingComplete) {
      router.replace(ROUTES.ONBOARDING.WALKTHROUGH);
    }
  }, [ready, onboardingComplete, router]);

  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(response);
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationNavigation(response);
    });

    return () => subscription.remove();
  }, [handleNotificationNavigation]);

  if (!ready) return null;

  return (
    <CreateAccountProvider>
      <Slot />
    </CreateAccountProvider>
  );
}
