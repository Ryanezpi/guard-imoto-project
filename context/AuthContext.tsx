import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginAPI } from '../services/auth.service';

type Status = 'checking' | 'unauthenticated' | 'authenticated' | 'new-user';

type AuthContextType = {
  status: Status;
  user: null;
  login: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) setStatus('authenticated');
      else setStatus('unauthenticated');
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginAPI(email, password);
    await SecureStore.setItemAsync('token', res.token);
    setUser(res.user);
    setStatus('authenticated');
  };

  return (
    <AuthContext.Provider value={{ status, user, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
