import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock Auth hook
const useAuth = () => {
  const user = null; // set {id:'123'} to test logged-in
  const isLoading = false;
  return { user, isLoading };
};

export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [mounted, setMounted] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );

  const hasRedirected = useRef(false);

  // Load onboarding state
  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@onboarding_complete');
        setOnboardingComplete(value === 'true');
      } catch (e) {
        console.error('Failed to read onboarding state', e);
        setOnboardingComplete(false);
      }
    };
    loadOnboarding();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (
      !mounted ||
      isLoading ||
      onboardingComplete === null ||
      hasRedirected.current
    )
      return;

    const firstSegment = segments[0];

    if (user) {
      // Logged-in → go to app tabs if not already there
      if (firstSegment === '(auth)' || firstSegment === '(onboarding)') {
        hasRedirected.current = true;
        router.replace('/(app)/map'); // default app screen → map tab
      }
    } else {
      // Not logged-in
      if (!onboardingComplete) {
        if (firstSegment !== '(onboarding)') {
          hasRedirected.current = true;
          router.replace(ROUTES.ONBOARDING.WALKTHROUGH);
        }
      } else {
        // Onboarding complete → must go to login
        if (firstSegment !== '(auth)') {
          hasRedirected.current = true;
          router.replace(ROUTES.AUTH.LOGIN);
        }
      }
    }
  }, [mounted, isLoading, onboardingComplete, user, segments, router]);

  if (!mounted || isLoading || onboardingComplete === null) {
    return (
      <ThemeProvider>
        <OnboardingProvider>
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" />
            <Text>Loading App...</Text>
          </View>
        </OnboardingProvider>
      </ThemeProvider>
    );
  }

  return <Slot />;
}
