import { ROUTES } from '@/constants/routes';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { LoaderProvider } from '@/context/LoaderContext';
import {
  OnboardingContext,
  OnboardingProvider,
} from '@/context/OnboardingContext';
import { ThemeProvider } from '@/context/ThemeContext';
import * as Notifications from 'expo-notifications';
import { Redirect, Slot, useSegments } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
    <LoaderProvider>
      <AuthProvider>
        <DeviceProvider>
          <ThemeProvider>
            <OnboardingProvider>
              <AuthLoadingGate />
            </OnboardingProvider>
          </ThemeProvider>
        </DeviceProvider>
      </AuthProvider>
    </LoaderProvider>
  );
}

function AuthLoadingGate() {
  const { status } = useAuth();
  const { complete, loaded } = useContext(OnboardingContext);
  const segments = useSegments();
  const lastStatusRef = useRef(status);
  const lastChangeRef = useRef(Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

  const onLayoutRootView = useCallback(() => {
    if (splashHidden) return;
    setSplashHidden(true);
    SplashScreen.hideAsync().catch(() => {});
  }, [splashHidden]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (lastStatusRef.current !== status) {
      lastStatusRef.current = status;
      lastChangeRef.current = Date.now();
    }
  }, [status]);

  const root = segments[0];
  const inAuth = root === '(guard)' && segments[1] === '(auth)';
  const inApp = root === '(guard)' && segments[1] === '(app)';
  const inOnboarding = root === '(onboarding)';

  if (!loaded) {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Image
          source={require('@/assets/icons/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#9F0EA1" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // 1) Onboarding always first on fresh install
  if (!complete) {
    if (!inOnboarding) return <Redirect href={ROUTES.ONBOARDING.WALKTHROUGH} />;
    return (
      <View style={styles.fill} onLayout={onLayoutRootView}>
        <Slot />
      </View>
    );
  }

  // 2) Auth/BE hydration
  if (!hydrated || status === 'checking' || status === 'new-user') {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Image
          source={require('@/assets/icons/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#9F0EA1" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // 3) Email unverified always stays on verification screen
  if (status === 'email-unverified') {
    if (!inAuth) {
      return <Redirect href={ROUTES.AUTH.CREATE_ACCOUNT.EMAIL_VERIFICATION} />;
    }
    return (
      <View style={styles.fill} onLayout={onLayoutRootView}>
        <Slot />
      </View>
    );
  }

  // 4) Unauthenticated stays in auth stack
  if (status === 'unauthenticated') {
    if (!inAuth) return <Redirect href={ROUTES.AUTH.LOGIN} />;
    return (
      <View style={styles.fill} onLayout={onLayoutRootView}>
        <Slot />
      </View>
    );
  }

  // 5) Authenticated stays in app stack
  if (status === 'authenticated') {
    if (!inApp) return <Redirect href={ROUTES.MAP.ROOT} />;
    return (
      <View style={styles.fill} onLayout={onLayoutRootView}>
        <Slot />
      </View>
    );
  }

  // Fallback loader
  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Image
        source={require('@/assets/icons/main-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#9F0EA1" />
      <Text style={styles.loadingText}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
