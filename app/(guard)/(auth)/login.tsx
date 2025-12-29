import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      setSecure(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(guard)/(app)/map');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/icons/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Login to continue
        </Text>

        {/* Email */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>Email</Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={subTextColor}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>Password</Text>

          <View style={[styles.passwordRow, { borderColor }]}>
            <TextInput
              style={[styles.passwordInput, { color: textColor }]}
              secureTextEntry={secure}
              placeholder="••••••••"
              placeholderTextColor={subTextColor}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setSecure(true)}
            />

            <Pressable onPress={() => setSecure(!secure)}>
              <Text style={styles.toggle}>{secure ? 'Show' : 'Hide'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          disabled={loading}
          onPress={login}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Logging in…' : 'Login'}
          </Text>
        </Pressable>

        {/* Secondary actions */}
        <Pressable
          onPress={() => router.push('/(guard)/(auth)/forgot-password')}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(guard)/(auth)/create-account')}
        >
          <Text style={styles.link}>
            Don&apos;t have an account?{' '}
            <Text style={styles.linkBold}>Create one</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },

  logo: {
    width: 120,
    height: 120,
  },

  card: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 28,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
  },

  toggle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    paddingLeft: 12,
  },

  primaryButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonPressed: {
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  link: {
    marginTop: 16,
    fontSize: 14,
    color: '#2563EB',
    textAlign: 'center',
  },

  linkBold: {
    fontWeight: '600',
  },
});
