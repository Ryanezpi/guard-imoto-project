import DynamicCard from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useCreateAccountDraft } from '@/context/CreateAccountContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  reload,
  sendEmailVerification,
  signOut,
} from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  const { draft } = useCreateAccountDraft();
  const { showLoader, hideLoader } = useLoader();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';
  const successBg = theme === 'light' ? '#ecfdf3' : '#0f2a1a';
  const successBorder = theme === 'light' ? '#22c55e' : '#16a34a';
  const successText = theme === 'light' ? '#166534' : '#bbf7d0';
  const errorBg = theme === 'light' ? '#fef2f2' : '#2a0f12';
  const errorBorder = theme === 'light' ? '#ef4444' : '#f87171';
  const errorText = theme === 'light' ? '#991b1b' : '#fecaca';

  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [showVerifiedButton, setShowVerifiedButton] = useState(false);
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const currentUser = auth.currentUser;

  useEffect(() => {
    hideLoader();
  }, [hideLoader]);

  useEffect(() => {
    const email = currentUser?.email ?? draft.email;
    const nameFromDraft = `${draft.firstName} ${draft.lastName}`.trim();
    const name = currentUser?.displayName ?? nameFromDraft;

    setUserEmail(email ?? '');
    setUserName(name ?? '');
    setUserInfoLoading(false);
  }, [
    currentUser?.email,
    currentUser?.displayName,
    draft.email,
    draft.firstName,
    draft.lastName,
  ]);

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
      console.log('Failed to send email verification:', err);
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
      await reload(currentUser);
      if (currentUser.emailVerified) {
        console.log('Email verified!');
        await refreshUser();
        // Navigation handled by auth guard after status updates.
      } else {
        setErrorMessage('Email not verified yet. Please check your inbox.');
      }
    } catch (err: any) {
      console.log('Error checking verification', err);
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
            <View style={[styles.userCard, { backgroundColor: bgColor }]}>
              {userInfoLoading ? (
                <ActivityIndicator size="small" color="#9F0EA1" />
              ) : (
                <>
                  <Text style={[styles.userName, { color: textColor }]}>
                    {userName || 'User'}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: subTextColor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {userEmail || 'No email available'}
                  </Text>
                </>
              )}
            </View>
            {errorMessage && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: errorBg,
                    borderColor: errorBorder,
                  },
                ]}
              >
                <Text style={{ color: errorText }}>{errorMessage}</Text>
              </View>
            )}
            {successMessage && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: successBg,
                    borderColor: successBorder,
                  },
                ]}
              >
                <Text style={{ color: successText }}>{successMessage}</Text>
              </View>
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
                  showLoader();
                  try {
                    await signOut(auth);
                    await AsyncStorage.multiRemove(['theme', 'onboardingSeen']);
                    router.replace(ROUTES.AUTH.LOGIN);
                  } catch (err) {
                    console.log('Logout failed', err);
                  } finally {
                    hideLoader();
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
  userCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  messageBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 28 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#9F0EA1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutContainer: {
    marginTop: 64,
  },
});
