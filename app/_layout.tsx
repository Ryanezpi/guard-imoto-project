import { Slot, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { DeviceProvider } from '@/context/DeviceContext';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { status } = useAuth();

  useEffect(() => {
    if (!segments.length) return;

    const root = segments[0];
    if (root === '(onboarding)') return;

    const inAuth = root === '(guard)' && segments[1] === '(auth)';

    if (status === 'unauthenticated') {
      if (!inAuth) router.replace(ROUTES.AUTH.LOGIN);
      return;
    }

    if (status === 'email-unverified') {
      if (
        !(
          root === '(guard)' &&
          segments[1] === '(auth)' &&
          segments[2] === 'create-account' &&
          segments[3] === 'email-verification'
        )
      ) {
        router.replace(ROUTES.AUTH.CREATE_ACCOUNT.EMAIL_VERIFICATION);
      }
      return;
    }

    if (status === 'authenticated') {
      if (inAuth) router.replace(ROUTES.MAP.ROOT);
    }
  }, [router, segments, status]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <LoaderProvider>
              <AuthGate />
            </LoaderProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </DeviceProvider>
    </AuthProvider>
  );
}
