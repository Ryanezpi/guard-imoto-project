// contexts/OnboardingContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  complete: boolean;
  loaded: boolean;
  setComplete: (val: boolean) => void;
}

export const OnboardingContext = createContext<OnboardingContextType>({
  complete: false,
  loaded: false,
  setComplete: () => {},
});

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [complete, setCompleteState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const value = await AsyncStorage.getItem('@onboarding_complete');
      setCompleteState(value === 'true');
      setLoaded(true);
    };
    load();
  }, []);

  const setComplete = async (val: boolean) => {
    await AsyncStorage.setItem('@onboarding_complete', val ? 'true' : 'false');
    setCompleteState(val);
  };

  return (
    <OnboardingContext.Provider value={{ complete, loaded, setComplete }}>
      {children}
    </OnboardingContext.Provider>
  );
};
