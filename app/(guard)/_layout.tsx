import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';

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

  useEffect(() => {
    if (!ready) return;

    if (!onboardingComplete) {
      router.replace(ROUTES.ONBOARDING.WALKTHROUGH);
    }
  }, [ready, onboardingComplete, router]);

  if (!ready) return null;

  return <Slot />;
}
