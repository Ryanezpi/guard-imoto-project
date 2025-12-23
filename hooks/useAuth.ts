// useAuth.ts
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        await u.reload();
      }
      setUser(u);
      setIsLoading(false);
    });

    return unsub;
  }, []);

  return { user, isLoading };
}
