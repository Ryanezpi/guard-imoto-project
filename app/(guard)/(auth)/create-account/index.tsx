import { ROUTES } from '@/constants/routes';
import AuthTextField from '@/components/ui/forms/AuthTextField';
import { useCreateAccountDraft } from '@/context/CreateAccountContext';
import { useTheme } from '@/context/ThemeContext';
import { checkEmailAvailability } from '@/services/auth.service';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateAccount() {
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#272727';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });

  const { draft, setDraft, resetDraft } = useCreateAccountDraft();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Validation rules
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^09\d{9}$/;

    const valid =
      draft.firstName.trim().length > 0 &&
      draft.lastName.trim().length > 0 &&
      emailRegex.test(draft.email) &&
      phoneRegex.test(draft.phone) &&
      draft.emailAvailable === true;

    setIsValid(valid);
  }, [draft]);

  useEffect(() => {
    resetDraft();
  }, [resetDraft]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^09\d{9}$/;
  const firstNameError =
    (attempted || touched.firstName) && !draft.firstName.trim()
      ? 'First name is required.'
      : undefined;
  const lastNameError =
    (attempted || touched.lastName) && !draft.lastName.trim()
      ? 'Last name is required.'
      : undefined;
  const emailFieldError =
    (attempted || touched.email) && !draft.email.trim()
      ? 'Email is required.'
      : (attempted || touched.email) && !emailRegex.test(draft.email.trim())
        ? 'Enter a valid email address.'
        : emailError
          ? emailError
          : draft.emailAvailable === false
            ? 'Email is already registered.'
            : undefined;
  const phoneError =
    (attempted || touched.phone) && !draft.phone.trim()
      ? 'Phone number is required.'
      : (attempted || touched.phone) && !phoneRegex.test(draft.phone.trim())
        ? 'Enter a valid 11-digit PH mobile number (09XXXXXXXXX).'
        : undefined;

  async function handleEmailCheck(email: string) {
    if (!email) return;

    setCheckingEmail(true);
    setEmailError(null);

    try {
      const available = await checkEmailAvailability(email);
      setDraft({ emailAvailable: available, emailCheckedValue: email });
    } catch (err: any) {
      setDraft({ emailAvailable: null, emailCheckedValue: '' });
      setEmailError(err.message || 'Unable to check email');
    } finally {
      setCheckingEmail(false);
    }
  }

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
              { backgroundColor: cardColor, paddingBottom: 24 + keyboardHeight },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: textColor }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              Tell us about yourself
            </Text>

            {/* First Name */}
            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  First name <Text style={{ color: 'red' }}>*</Text>
                </Text>
              }
              placeholder="John"
              value={draft.firstName}
              onChangeText={(v) => setDraft({ firstName: v })}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, firstName: true }))
              }
              error={firstNameError}
            />

            {/* Last Name */}
            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  Last name <Text style={{ color: 'red' }}>*</Text>
                </Text>
              }
              placeholder="Doe"
              value={draft.lastName}
              onChangeText={(v) => setDraft({ lastName: v })}
              onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
              error={lastNameError}
            />

            {/* Email */}
            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  Email <Text style={{ color: 'red' }}>*</Text>
                </Text>
              }
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@email.com"
              value={draft.email}
              onChangeText={(v) => {
                setDraft({ email: v, emailAvailable: null, emailCheckedValue: '' });

                if (typingTimeout.current) clearTimeout(typingTimeout.current);

                typingTimeout.current = setTimeout(() => {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (
                    emailRegex.test(v) &&
                    !(draft.emailCheckedValue === v && draft.emailAvailable === true)
                  ) {
                    handleEmailCheck(v);
                  }
                }, 500);
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              rightElement={
                checkingEmail ? (
                  <ActivityIndicator size="small" color="#9F0EA1" />
                ) : draft.emailAvailable === true ? (
                  <Text style={{ color: 'green' }}>✓</Text>
                ) : draft.emailAvailable === false ? (
                  <Text style={{ color: 'red' }}>✕</Text>
                ) : null
              }
              error={emailFieldError}
            />

            <AuthTextField
              label={
                <Text style={[styles.label, { color: subTextColor }]}>
                  Phone number <Text style={{ color: 'red' }}>*</Text>
                </Text>
              }
              keyboardType="phone-pad"
              placeholder="09XXxxxxxxx"
              value={draft.phone}
              onChangeText={(v) => setDraft({ phone: v })}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              error={phoneError}
            />

            {/* Next */}
            <Pressable
              style={[styles.primaryButton, { opacity: isValid ? 1 : 0.5 }]}
              disabled={!isValid}
              onPress={() => {
                setAttempted(true);
                if (!isValid) return;
                router.push(ROUTES.AUTH.CREATE_ACCOUNT.PASSWORD);
              }}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                resetDraft();
                setEmailError(null);
                router.back();
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
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
  buttonPressed: {
    opacity: 0.9,
  },
});
