import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';

export type Device = {
  id: string;
  name: string;
  type: string;
  status: string;
  last_seen?: string;
  [key: string]: any;
};

type DeviceContextType = {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
};

const DeviceContext = createContext<DeviceContextType | null>(null);

const BASE_URL = process.env.EXPO_PRIVATE_API_BASE || '{{BASE_URL_LIVE}}';

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { idToken } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!idToken) {
      setDevices([]);
      setError('No auth token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/devices`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to fetch devices');
      }

      const data = await res.json();

      setDevices(data.devices || []);
    } catch (err: any) {
      console.error('Device fetch error:', err);
      setError(err.message || 'Failed to fetch devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (idToken) fetchDevices();
  }, [idToken, fetchDevices]);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        loading,
        error,
        refreshDevices: fetchDevices,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export const useDevices = () => {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be used within DeviceProvider');
  return ctx;
};
