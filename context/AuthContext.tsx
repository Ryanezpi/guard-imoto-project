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
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getMeAPI } from '@/services/user.service';
import { useLoader } from './LoaderContext';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';

type Status = 'checking' | 'unauthenticated' | 'authenticated' | 'new-user';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { hideLoader } = useLoader();
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------- */
  /* Refresh Firebase ID token           */
  /* ---------------------------------- */
  const refreshToken = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    const newToken = await fbUser.getIdToken(true);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setIdToken(newToken);

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
  const refreshUser = useCallback(async () => {
    if (!idToken) return null;
    try {
      const me = await getMeAPI(idToken);

      // Check if we have a stored Expo push token
      const storedToken = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
      if (storedToken) {
        // await updateExpoTokenAPI(storedToken, idToken);
        me.expo_push_token = storedToken;
      }

      setUser(me);
      setStatus('authenticated');
      hideLoader();
      return me;
    } catch (err) {
      console.log('Failed to refresh user:', err);
      return null;
    }
  }, [hideLoader, idToken]);

  /* ---------------------------------- */
  /* Handle Firebase auth changes        */
  /* ---------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setUser(null);
          setIdToken(null);
          setStatus('unauthenticated');
          console.log('unauthenticated');
          return;
        }

        try {
          const token = await fbUser.getIdToken();
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          setIdToken(token);

          const me = await getMeAPI(token);

          // Add stored Expo token if present
          const storedToken = await AsyncStorage.getItem(EXPO_TOKEN_KEY);
          if (storedToken) {
            // await updateExpoTokenAPI(storedToken, token);
            me.expo_push_token = storedToken;
          }

          setUser(me);
          setStatus('authenticated');

          router.replace(ROUTES.MAP.ROOT);
          console.log('Authenticated user:', me);
          hideLoader();
          scheduleTokenRefresh();
        } catch (err) {
          console.log('Backend user not created yet:', err);
          setStatus('new-user');
        }
      }
    );

    return () => {
      unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [hideLoader, scheduleTokenRefresh]);

  const logout = async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await auth.signOut();

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
