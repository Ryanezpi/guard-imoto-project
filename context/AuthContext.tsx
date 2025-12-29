import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getMeAPI } from '@/services/user.service';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

    // Schedule next refresh
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refreshToken, 45 * 60 * 1000);
  }, []);

  /* ---------------------------------- */
  /* Schedule token refresh             */
  /* ---------------------------------- */
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    // Refresh 15 minutes before expiry (45 mins)
    refreshTimer.current = setTimeout(refreshToken, 45 * 60 * 1000);
  }, [refreshToken]);

  /* ---------------------------------- */
  /* Refresh backend user               */
  /* ---------------------------------- */
  const refreshUser = useCallback(async () => {
    if (!idToken) return null;
    try {
      const latestUser = await getMeAPI(idToken);
      setUser(latestUser);
      setStatus('authenticated');
      return latestUser;
    } catch (err) {
      console.log('Failed to refresh user:', err);
      return null;
    }
  }, [idToken]);

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
          setUser(me);
          setStatus('authenticated');
          console.log('Authenticated user:', me);

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
  }, [scheduleTokenRefresh]);

  /* ---------------------------------- */
  /* Logout                             */
  /* ---------------------------------- */
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
