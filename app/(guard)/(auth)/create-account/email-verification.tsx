import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailVerification() {
  const router = useRouter();
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';

  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showVerifiedButton, setShowVerifiedButton] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) {
      setShowVerifiedButton(false);
      return;
    }
    const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendVerification = async () => {
    if (!currentUser) {
      setErrorMessage('No user is logged in.');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    showLoader();

    try {
      await sendEmailVerification(currentUser);
      setSuccessMessage(
        `Verification email sent to ${currentUser.email}. Please check your inbox.`
      );
      setShowVerifiedButton(true);
      setCooldown(180); // 3 minutes cooldown
    } catch (err: any) {
      console.error('Failed to send email verification:', err);
      setErrorMessage('Failed to send email verification. Try again.');
    } finally {
      setSending(false);
      hideLoader();
    }
  };

  const checkVerified = async () => {
    if (!currentUser) return;

    showLoader();
    try {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        console.log('Email verified!');
        await refreshUser();
        router.replace(ROUTES.APP.MAP);
      } else {
        setErrorMessage('Email not verified yet. Please check your inbox.');
      }
    } catch (err: any) {
      console.error('Error checking verification', err);
      setErrorMessage('Failed to check verification. Try again.');
    } finally {
      hideLoader();
    }
  };

  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            {/* Send verification button */}
            <Pressable
              style={[
                styles.primaryButton,
                { opacity: sending || cooldown > 0 ? 0.5 : 1 },
              ]}
              disabled={sending || cooldown > 0}
              onPress={handleSendVerification}
            >
              <Text style={styles.primaryButtonText}>
                {sending
                  ? 'Sending…'
                  : cooldown > 0
                    ? `Resend available in ${formatTimer(cooldown)}`
                    : 'Send Verification Email'}
              </Text>
            </Pressable>
            {/* "I Verified My Email" button */}
            {showVerifiedButton && (
              <Pressable
                style={[styles.primaryButton, { marginTop: 12 }]}
                onPress={checkVerified}
              >
                <Text style={styles.primaryButtonText}>
                  I Verified My Email
                </Text>
              </Pressable>
            )}

            {/* Logout */}
            <View
              style={[styles.logoutContainer, { backgroundColor: cardColor }]}
            >
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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    display: 'flex',
    padding: 24,
    flex: 1,
  },
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
    marginTop: 64,
  },
});
