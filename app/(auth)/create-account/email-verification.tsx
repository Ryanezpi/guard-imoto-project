import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmailVerification() {
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';

  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVerifiedButton, setShowVerifiedButton] = useState(false);
  const [timer, setTimer] = useState(0);

  const currentUser = auth.currentUser;

  // Countdown for expiration
  useEffect(() => {
    if (timer <= 0) {
      setShowVerifiedButton(false);
      return;
    }
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendVerification = async () => {
    if (!currentUser) {
      setErrorMessage('No user is logged in.');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await sendEmailVerification(currentUser);
      setSuccessMessage(
        `Verification email sent to ${currentUser.email}. Please check your inbox.`
      );
      setShowVerifiedButton(true);
      setTimer(120); // 2 minutes countdown
      console.log('Email verification sent!');
    } catch (err: any) {
      console.error('Failed to send email verification:', err);
      setErrorMessage('Failed to send email verification. Try again.');
    } finally {
      setSending(false);
    }
  };

  const checkVerified = async () => {
    if (!currentUser) return;

    await currentUser.reload();
    if (currentUser.emailVerified) {
      console.log('Email verified!');
      router.replace('/(app)/map');
    } else {
      setErrorMessage('Email not verified yet. Please check your inbox.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Email Verification
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            A verification email will be sent to your registered email. Please
            verify to continue.
          </Text>

          {errorMessage && (
            <Text style={{ color: 'red', marginBottom: 8 }}>
              {errorMessage}
            </Text>
          )}
          {successMessage && (
            <Text style={{ color: 'green', marginBottom: 8 }}>
              {successMessage}
            </Text>
          )}
          {!showVerifiedButton && (
            <Pressable
              style={[styles.primaryButton, { opacity: sending ? 0.5 : 1 }]}
              disabled={sending}
              onPress={handleSendVerification}
            >
              <Text style={styles.primaryButtonText}>
                {sending ? 'Sending…' : 'Send Verification Email'}
              </Text>
            </Pressable>
          )}
          {showVerifiedButton && (
            <Pressable
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={checkVerified}
            >
              <Text style={styles.primaryButtonText}>I Verified My Email</Text>
            </Pressable>
          )}
        </View>

        {/* Logout at the bottom */}
        <View style={[styles.logoutContainer, { backgroundColor: cardColor }]}>
          <DynamicCard
            key={theme + 'logout'}
            name="Logout"
            prefixIcon="sign-out"
            prefixColor="#ff4d4f"
            onPress={async () => {
              try {
                await signOut(auth);
                await AsyncStorage.multiRemove(['theme', 'onboardingSeen']);
                router.replace(ROUTES.AUTH.LOGIN);
              } catch (err) {
                console.error('Logout failed', err);
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginHorizontal: 20, borderRadius: 20, padding: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 28 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-end',
  },
});
