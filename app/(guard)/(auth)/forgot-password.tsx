import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { checkEmailAvailability } from '@/services/auth.service';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPassword() {
  const { theme } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const validateEmail = (email: string) => {
    // Basic email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const submit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Please enter your email.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    showLoader();

    try {
      const available = await checkEmailAvailability(trimmedEmail);

      if (available) {
        // If available, that means email does NOT exist
        setErrorMessage('This email is not registered.');
        return;
      }

      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage(
        `Password reset email sent to ${trimmedEmail}. Check your inbox.`
      );
      setSent(true);
    } catch (err: any) {
      console.error('Failed to send reset email:', err);
      hideLoader();
      setErrorMessage(err.message || 'Failed to send reset email. Try again.');
    } finally {
      hideLoader();
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Enter your email address and we will send you a password reset link.
          </Text>

          {!sent && (
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="Email address"
              placeholderTextColor={subTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          )}

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

          {!sent && (
            <Pressable
              style={[styles.primaryButton, sending && styles.buttonPressed]}
              disabled={sending}
              onPress={submit}
            >
              <Text style={styles.primaryButtonText}>
                {sending ? 'Sending…' : 'Reset Password'}
              </Text>
            </Pressable>
          )}

          {sent && (
            <Pressable
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </Pressable>
          )}

          {!sent && (
            <Pressable
              style={[
                styles.primaryButton,
                {
                  marginTop: sent ? 12 : 16,
                  borderWidth: 1,
                  borderColor,
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={() => router.back()}
            >
              <Text style={[styles.primaryButtonText, { color: textColor }]}>
                Cancel
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  card: {
    flex: 1,
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

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 16,
  },

  primaryButton: {
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
    opacity: 0.7,
  },
});
