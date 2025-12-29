import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { LoaderProvider } from '@/context/LoaderContext';
import { DeviceProvider } from '@/context/DeviceContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <LoaderProvider>
              <Slot />
            </LoaderProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </DeviceProvider>
    </AuthProvider>
  );
}
