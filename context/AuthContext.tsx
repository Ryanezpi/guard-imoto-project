import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  getIdToken,
  onAuthStateChanged,
  signOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { auth } from '@/lib/firebase';
import { getMeAPI, updateProfile } from '@/services/user.service';
import { useLoader } from './LoaderContext';

type Status =
  | 'checking'
  | 'unauthenticated'
  | 'authenticated'
  | 'new-user'
  | 'email-unverified';

export type User = {
  id: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  notifications_enabled: boolean;
  expo_push_token?: string | null; // <- add optional token
};

type AuthContextType = {
  status: Status;
  user: User | null;
  idToken: string | null;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'idToken';
const EXPO_TOKEN_KEY = '@expo_push_token';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hideLoader } = useLoader();
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expoSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExpoSyncRef = useRef<number>(0);
  const authRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRetryCount = useRef(0);
  const healthGateRef = useRef<Promise<void> | null>(null);
  const healthGateActiveRef = useRef(true);

  const scheduleAuthRetry = useCallback((fn: () => Promise<void>) => {
    if (authRetryTimer.current) clearTimeout(authRetryTimer.current);
    const delay = Math.min(300000, 5000 * 2 ** authRetryCount.current);
    authRetryTimer.current = setTimeout(() => {
      authRetryCount.current += 1;
      fn().catch(() => {});
    }, delay);
  }, []);

  const waitForBackendReady = useCallback(async () => {
    if (!API_BASE) return;
    if (healthGateRef.current) return healthGateRef.current;

    healthGateRef.current = (async () => {
      let delay = 2000;
      while (healthGateActiveRef.current) {
        try {
          const res = await fetch(`${API_BASE}/health`);
          if (res.ok) {
            const data = await res.json().catch(() => null);
            const status = (data?.status ?? data?.ok ?? '').toString();
            if (status.toLowerCase() === 'ok' || res.status === 200) return;
          }
        } catch {
          // ignore and retry
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 300000);
      }
    })();

    try {
      await healthGateRef.current;
    } finally {
      healthGateRef.current = null;
    }
  }, []);

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('myNotificationChannel', {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  }, []);

  /* ---------------------------------- */
  /* Refresh Firebase ID token           */
  /* ---------------------------------- */
  const refreshToken = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    const token = await getFreshIdToken();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setIdToken(token);

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refreshToken, 45 * 60 * 1000);
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refreshToken, 45 * 60 * 1000);
  }, [refreshToken]);

  /* ---------------------------------- */
  /* Refresh backend user               */
  /* ---------------------------------- */
  const syncExpoPushToken = useCallback(
    async (token: string, me: User) => {
      try {
        const now = Date.now();
        if (now - lastExpoSyncRef.current < 60_000) return;
        lastExpoSyncRef.current = now;

        const storedToken = await getStoredExpoToken();
        const freshToken = await registerForPushNotificationsAsync();

        if (freshToken) {
          if (storedToken !== freshToken) {
            await AsyncStorage.setItem(EXPO_TOKEN_KEY, freshToken);
          }
          if (me.expo_push_token !== freshToken) {
            await updateProfile(token, { expo_token: freshToken });
            me.expo_push_token = freshToken;
          }
          return;
        }

        if (storedToken) {
          if (me.expo_push_token !== storedToken) {
            await updateProfile(token, { expo_token: storedToken });
            me.expo_push_token = storedToken;
          }
          return;
        }

        if (me.expo_push_token) {
          await AsyncStorage.setItem(EXPO_TOKEN_KEY, me.expo_push_token);
          return;
        }

        console.log('[Expo] Push token missing (local + backend)');
      } catch (err) {
        console.log('[Expo] Push token sync failed:', err);
      }
    },
    [registerForPushNotificationsAsync]
  );

  const refreshUser = useCallback(async () => {
    try {
      const token = await getFreshIdToken();
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      setIdToken(token);

      await waitForBackendReady();
      const me = await getMeAPI(token);
      await syncExpoPushToken(token, me);

      setUser(me);
      setStatus('authenticated');
      hideLoader();
      authRetryCount.current = 0;
      return me;
    } catch (err: any) {
      console.log('Failed to refresh user:', err);
      if (err?.status === 401) {
        setStatus('unauthenticated');
        return null;
      }
      setStatus('checking');
      scheduleAuthRetry(refreshUser);
      return null;
    }
  }, [hideLoader, scheduleAuthRetry, syncExpoPushToken, waitForBackendReady]);

  /* ---------------------------------- */
  /* Handle Firebase auth changes        */
  /* ---------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseAuthTypes.User | null) => {
        if (!fbUser) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setUser(null);
          setIdToken(null);
          setStatus('unauthenticated');
          console.log('unauthenticated');
          return;
        }
        console.log('fbUser.emailVerified', fbUser.emailVerified);

        if (!fbUser.emailVerified) {
          const token = await getFreshIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          setIdToken(token);
          setUser(null);
          setStatus('email-unverified');
          hideLoader();
          console.log('User email not verified:', fbUser.email);
          return; // Do NOT proceed to map
        }

        try {
          const token = await getFreshIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          setIdToken(token);

          await waitForBackendReady();
          const me = await getMeAPI(token);
          await syncExpoPushToken(token, me);

          setUser(me);
          setStatus('authenticated');

          console.log('[Auth] User snapshot on init', {
            id: me.id,
            firebase_uid: me.firebase_uid,
            first_name: me.first_name,
            last_name: me.last_name,
            email: me.email,
            phone: me.phone,
            photo_url: me.photo_url,
            notifications_enabled: me.notifications_enabled,
            expo_push_token: me.expo_push_token,
          });
          hideLoader();
          scheduleTokenRefresh();
        } catch (err: any) {
          console.log('Failed to fetch backend user:', err);
          if (err?.status === 404) {
            setStatus('new-user');
            return;
          }
          if (err?.status === 401) {
            setStatus('unauthenticated');
            return;
          }
          setStatus('checking');
          scheduleAuthRetry(async () => {
            await refreshUser();
          });
        }
      }
    );

    return () => {
      healthGateActiveRef.current = false;
      unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (expoSyncTimer.current) clearTimeout(expoSyncTimer.current);
      if (authRetryTimer.current) clearTimeout(authRetryTimer.current);
    };
  }, [
    hideLoader,
    refreshUser,
    scheduleAuthRetry,
    scheduleTokenRefresh,
    syncExpoPushToken,
    waitForBackendReady,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!idToken || !user) return;
      if (expoSyncTimer.current) clearTimeout(expoSyncTimer.current);
      expoSyncTimer.current = setTimeout(() => {
        syncExpoPushToken(idToken, { ...user });
      }, 500);
    });

    return () => {
      sub.remove();
      if (expoSyncTimer.current) clearTimeout(expoSyncTimer.current);
    };
  }, [idToken, syncExpoPushToken, user]);

  const logout = async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    try {
      await signOut(auth);
    } catch (err) {
      console.log('[Auth] signOut skipped:', err);
    }

    setUser(null);
    setIdToken(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        idToken,
        logout,
        refreshToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export async function getFreshIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  return await getIdToken(user, true);
}

async function getStoredExpoToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
    if (!raw) return null;
    const token = String(raw).trim();
    if (!token || token === 'null' || token === 'undefined') {
      await AsyncStorage.removeItem(EXPO_TOKEN_KEY);
      return null;
    }
    console.log('[Expo] Push token available:', token);
    return token;
  } catch (err) {
    console.log('[Expo] Failed to read push token', err);
  }
  return null;
}
