import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { registerUserWithBackend } from '@/services/auth.service';

export default function PasswordStep() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // Enable continue button only if both fields are non-empty and match
  useEffect(() => {
    setIsValid(
      password.length >= 6 && confirm.length >= 6 && password === confirm
    );
  }, [password, confirm]);

  const next = async () => {
    router.push('/(guard)/(auth)/create-account/email-verification');

    if (!isValid) return;

    try {
      setLoading(true);

      setLoading(true);

      const res = await createUserWithEmailAndPassword(
        auth,
        params.email as string,
        password
      );

      await registerUserWithBackend(res.user, {
        first_name: params.firstName as string,
        last_name: params.lastName as string,
        phone: params.phone as string,
      });

      router.push('/(guard)/(auth)/create-account/email-verification');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Set a password</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Your password must be at least 6 characters
        </Text>

        {/* Password */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>Password</Text>
          <View style={[styles.passwordRow, { borderColor }]}>
            <TextInput
              style={[styles.passwordInput, { color: textColor }]}
              secureTextEntry={secure1}
              placeholder="••••••••"
              placeholderTextColor={subTextColor}
              value={password}
              onChangeText={setPassword}
              onBlur={() => setSecure1(true)}
            />
            <Pressable onPress={() => setSecure1(!secure1)}>
              <Text style={styles.toggle}>{secure1 ? 'Show' : 'Hide'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>
            Confirm Password
          </Text>
          <View style={[styles.passwordRow, { borderColor }]}>
            <TextInput
              style={[styles.passwordInput, { color: textColor }]}
              secureTextEntry={secure2}
              placeholder="••••••••"
              placeholderTextColor={subTextColor}
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setSecure2(true)}
            />
            <Pressable onPress={() => setSecure2(!secure2)}>
              <Text style={styles.toggle}>{secure2 ? 'Show' : 'Hide'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Continue Button */}
        <Pressable
          style={[styles.primaryButton, { opacity: isValid ? 1 : 0.5 }]}
          onPress={next}
          disabled={!isValid || loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating…' : 'Continue'}
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
    marginTop: 16,
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
});
