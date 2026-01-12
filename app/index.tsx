import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { ROUTES } from '@/constants/routes';

export default function RootLayout() {
  const { status } = useAuth();

  // 🚧 HARD BLOCK: App boot / auth hydration
  if (status === 'checking') {
    return (
      <View style={styles.container}>
        <Image
          source={require('@/assets/icons/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🔐 Not logged in → auth flow
  if (status === 'unauthenticated') {
    return <Redirect href={ROUTES.AUTH.LOGIN} />;
  }

  // ✅ Logged in → main app
  if (status === 'authenticated') {
    return <Redirect href={ROUTES.MAP.ROOT} />;
  }

  // 🧱 Fallback (new-user or edge cases)
  return <Stack />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // match your light theme splash
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 96,
    height: 96,
    marginBottom: 24,
  },
});
