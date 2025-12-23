// RootLayout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { LoaderProvider } from '@/context/LoaderContext';

interface AuthUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  providerData: { providerId: string }[];
}

export default function RootLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const typedUser = user as AuthUser | null;

  const isAuthenticated = !!user;
  const isEmailVerified = typedUser?.emailVerified ?? false;

  // ---- LOAD ONBOARDING FLAG ----
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await AsyncStorage.getItem('@onboarding_complete');
        if (mounted) setOnboardingComplete(value === 'true');
      } catch (e) {
        console.error('Failed to read onboarding state', e);
        if (mounted) setOnboardingComplete(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---- GLOBAL ROUTING GUARD ----
  useEffect(() => {
    if (loading || authLoading || onboardingComplete === null) return;

    const firstSegment = segments[0];

    if (!isAuthenticated) {
      if (!onboardingComplete) {
        if (firstSegment !== '(onboarding)')
          router.replace(ROUTES.ONBOARDING.WALKTHROUGH);
        return;
      }
      if (firstSegment !== '(auth)') router.replace(ROUTES.AUTH.LOGIN);
      return;
    }

    if (!isEmailVerified) {
      if (firstSegment !== '(auth)')
        router.replace('/(auth)/create-account/email-verification');
      return;
    }

    if (firstSegment !== '(app)') router.replace('/(app)/map');
  }, [
    isAuthenticated,
    isEmailVerified,
    authLoading,
    loading,
    onboardingComplete,
    segments,
    router,
  ]);

  // ---- RENDER LOADER IF STILL LOADING ----
  if (authLoading || loading || onboardingComplete === null) {
    return (
      <ThemeProvider>
        <OnboardingProvider>
          <LoaderProvider>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          </LoaderProvider>
        </OnboardingProvider>
      </ThemeProvider>
    );
  }

  // ---- NORMAL RENDER ----
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <LoaderProvider>
          <Slot />
        </LoaderProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000033', // subtle transparent overlay
  },
});
