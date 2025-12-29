// app/(guard)/_layout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';

export default function GuardLayout() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );

  /* ---------------------------------- */
  /* Load onboarding flag               */
  /* ---------------------------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await AsyncStorage.getItem('@onboarding_complete');
        if (mounted) setOnboardingComplete(value === 'true');
      } catch {
        if (mounted) setOnboardingComplete(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------------------------- */
  /* Routing guard                      */
  /* ---------------------------------- */
  useEffect(() => {
    if (status === 'checking' || onboardingComplete === null) return;

    const isOnboarding = segments.includes('(onboarding)' as never);
    const isAuth = segments.includes('(auth)' as never);
    const isApp = segments.includes('(app)' as never);

    // 1️⃣ Not authenticated
    if (status === 'unauthenticated') {
      if (!onboardingComplete && !isOnboarding) {
        router.replace(ROUTES.ONBOARDING.WALKTHROUGH);
        return;
      }

      if (onboardingComplete && !isAuth) {
        router.replace(ROUTES.AUTH.LOGIN);
        return;
      }
    }

    // 2️⃣ New user
    if (status === 'new-user' && !isAuth) {
      router.replace(ROUTES.AUTH.CREATE_ACCOUNT.ROOT); // define this in ROUTES
      return;
    }

    // 3️⃣ Authenticated
    if (status === 'authenticated' && !isApp) {
      router.replace(ROUTES.APP.MAP);
      return;
    }
  }, [status, onboardingComplete, segments, router]);

  /* ---------------------------------- */
  /* Loader                             */
  /* ---------------------------------- */
  if (status === 'checking' || onboardingComplete === null) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
