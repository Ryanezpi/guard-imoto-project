import { ROUTES } from '@/constants/routes';
import AuthTextField from '@/components/ui/forms/AuthTextField';
import { useCreateAccountDraft } from '@/context/CreateAccountContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import { registerUserWithBackend } from '@/services/auth.service';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import PrivacyPolicyModal from '@/components/ui/PrivacyPolicyModal';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

const waitForBackendReady = async () => {
  if (!API_BASE) return;
  let delay = 2000;
  // Keep waiting until backend is ready (cold start safe)
  while (true) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const status = (data?.status ?? data?.ok ?? '')
          .toString()
          .toLowerCase();
        if (status === 'ok' || res.status === 200) return;
      }
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 300000);
  }
};

export default function PasswordStep() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showLoader } = useLoader();
  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';

  const { draft, setDraft } = useCreateAccountDraft();
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [touched, setTouched] = useState({
    password: false,
    confirm: false,
  });

  // Enable continue button only if both fields are non-empty and match
  useEffect(() => {
    setIsValid(
      draft.password.length >= 6 &&
        draft.confirmPassword.length >= 6 &&
        draft.password === draft.confirmPassword &&
        draft.agreedToPrivacy
    );
  }, [draft.confirmPassword, draft.password, draft.agreedToPrivacy]);

  const passwordError =
    (attempted || touched.password) && draft.password.length === 0
      ? 'Password is required.'
      : (attempted || touched.password) && draft.password.length < 6
        ? 'Password must be at least 6 characters.'
        : undefined;
  const confirmError =
    (attempted || touched.confirm) && draft.confirmPassword.length === 0
      ? 'Please confirm your password.'
      : (attempted || touched.confirm) &&
          draft.confirmPassword !== draft.password
        ? 'Passwords do not match.'
        : undefined;
  const privacyError =
    attempted && !draft.agreedToPrivacy
      ? 'You must agree to the privacy policy.'
      : undefined;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const next = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      showLoader();
      const res = await createUserWithEmailAndPassword(
        auth,
        draft.email,
        draft.password
      );

      await waitForBackendReady();
      await registerUserWithBackend(res.user, {
        first_name: draft.firstName,
        last_name: draft.lastName,
        phone: draft.phone,
      });
      router.replace(ROUTES.AUTH.CREATE_ACCOUNT.EMAIL_VERIFICATION);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.card,
              {
                backgroundColor: cardColor,
                paddingBottom: 24 + keyboardHeight,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: textColor }]}>
              Set a password
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              Your password must be at least 6 characters
            </Text>

            {/* Password */}
            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  Password
                </Text>
              }
              secureTextEntry={secure1}
              placeholder="••••••••"
              value={draft.password}
              onChangeText={(v) => setDraft({ password: v })}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              error={passwordError}
              rightElement={
                <Pressable onPress={() => setSecure1(!secure1)}>
                  <Text style={styles.toggle}>
                    {secure1 ? (
                      <FontAwesome name="eye" size={18} color="#8E8E93" />
                    ) : (
                      <FontAwesome name="eye-slash" size={18} color="#8E8E93" />
                    )}
                  </Text>
                </Pressable>
              }
              onSubmitEditing={() => setSecure1(true)}
            />

            {/* Confirm Password */}
            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  Confirm Password
                </Text>
              }
              secureTextEntry={secure2}
              placeholder="••••••••"
              value={draft.confirmPassword}
              onChangeText={(v) => setDraft({ confirmPassword: v })}
              onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
              error={confirmError}
              rightElement={
                <Pressable onPress={() => setSecure2(!secure2)}>
                  <Text style={styles.toggle}>
                    {secure2 ? (
                      <FontAwesome name="eye" size={18} color="#8E8E93" />
                    ) : (
                      <FontAwesome name="eye-slash" size={18} color="#8E8E93" />
                    )}
                  </Text>
                </Pressable>
              }
              onSubmitEditing={() => setSecure2(true)}
            />

            {/* Continue Button */}
            <Pressable
              style={[
                styles.primaryButton,
                { opacity: isValid && !loading ? 1 : 0.5 },
              ]}
              onPress={() => {
                setAttempted(true);
                if (!isValid || loading) return;
                next();
              }}
              disabled={!isValid || loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating…' : 'Continue'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.privacyRow}
              onPress={() =>
                setDraft({ agreedToPrivacy: !draft.agreedToPrivacy })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  draft.agreedToPrivacy && styles.checkboxChecked,
                ]}
              >
                {draft.agreedToPrivacy ? (
                  <Text style={styles.checkboxTick}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.legalText}>
                By proceeding further, you agree to our
                <Text style={styles.link} onPress={() => setShowPrivacy(true)}>
                  {' '}
                  privacy policy{' '}
                </Text>
                and provide your consent.
              </Text>
            </Pressable>
            {privacyError ? (
              <Text style={styles.privacyError}>{privacyError}</Text>
            ) : null}
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Return</Text>
            </Pressable>

            <PrivacyPolicyModal
              visible={showPrivacy}
              onClose={() => setShowPrivacy(false)}
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  card: {
    paddingTop: 32,
    paddingBottom: 24,
    marginHorizontal: 20,
    borderRadius: 20,
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

  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },

  toggle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9F0EA1',
    paddingLeft: 12,
  },

  primaryButton: {
    backgroundColor: '#9F0EA1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9F0EA1',
  },
  secondaryButtonText: {
    color: '#9F0EA1',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9F0EA1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#9F0EA1',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  legalText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    flex: 1,
  },
  link: {
    color: '#9F0EA1',
    textDecorationLine: 'none',
  },
  privacyError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});
