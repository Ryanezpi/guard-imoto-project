import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { DeviceProvider } from '@/context/DeviceContext';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <LoaderProvider>
              <Slot />
            </LoaderProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </DeviceProvider>
    </AuthProvider>
  );
}
