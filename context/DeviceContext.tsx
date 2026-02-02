import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

export type Device = {
  device_id: string;
  device_name: string;
  pubnub_channel: string;
  latest_lat?: string;
  latest_lng?: string;
  [key: string]: any;
};

type DeviceContextType = {
  devices: Device[];
  loading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
};

const DeviceContext = createContext<DeviceContextType | null>(null);

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE || '{{BASE_URL_LIVE}}';

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { idToken } = useAuth();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchRef = useRef<number>(0);

  const fetchDevices = useCallback(async () => {
    const now = Date.now();

    console.log(
      '[DeviceContext] fetchDevices called',
      new Date().toISOString(),
      'idToken:',
      !!idToken
    );

    if (!idToken) {
      console.log('[DeviceContext] No idToken, clearing devices');
      setDevices([]);
      setError('No auth token available');
      return;
    }

    // Optional safety throttle (prevents accidental spam)
    if (now - lastFetchRef.current < 1000) {
      console.log('[DeviceContext] fetchDevices skipped (throttled)');
      return;
    }
    lastFetchRef.current = now;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/devices`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      console.log('[DeviceContext] Fetch status:', res.status);

      if (!res.ok) {
        const errText = await res.text();
        console.log('[DeviceContext] Fetch failed:', errText);
        throw new Error(errText || 'Failed to fetch devices');
      }

      const data = await res.json();
      console.log(
        '[DeviceContext] Devices fetched:',
        data.devices?.length ?? 0
      );

      setDevices(data.devices || []);
    } catch (err: any) {
      console.log('[DeviceContext] Device fetch error:', err);
      setError(err.message || 'Failed to fetch devices');
      setDevices([]);
    } finally {
      setLoading(false);
      console.log(
        '[DeviceContext] fetchDevices finished at',
        new Date().toISOString()
      );
    }
  }, [idToken]);

  // Initial fetch on login / token change
  useEffect(() => {
    if (!idToken) return;

    console.log(
      '[DeviceContext] Initial fetch triggered',
      new Date().toISOString()
    );

    fetchDevices();
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
  if (!ctx) {
    throw new Error('useDevices must be used within DeviceProvider');
  }
  return ctx;
};
