import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import { checkEmailAvailability } from '@/services/auth.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateAccount() {
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#272727';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const params = useLocalSearchParams<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (!params.firstName) return;

    setForm({
      firstName: params.firstName,
      lastName: params.lastName ?? '',
      email: params.email ?? '',
      phone: params.phone ?? '',
    });

    hydratedRef.current = true;
  }, [params.email, params.firstName, params.lastName, params.phone]);

  // Validation rules
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^09\d{9}$/;

    const valid =
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      emailRegex.test(form.email) &&
      phoneRegex.test(form.phone) &&
      emailAvailable === true;

    setIsValid(valid);
  }, [form, emailAvailable]);

  async function handleEmailCheck(email: string) {
    if (!email) return;

    setCheckingEmail(true);
    setEmailError(null);

    try {
      const available = await checkEmailAvailability(email);
      setEmailAvailable(available);
    } catch (err: any) {
      setEmailAvailable(null);
      setEmailError(err.message || 'Unable to check email');
    } finally {
      setCheckingEmail(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={[styles.card, { backgroundColor: cardColor }]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              Create account
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              Tell us about yourself
            </Text>

            {/* First Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                First name <Text style={{ color: 'red' }}>*</Text>
              </Text>
              <TextInput
                autoCapitalize="sentences"
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="John"
                placeholderTextColor={subTextColor}
                value={form.firstName}
                onChangeText={(v) => setForm({ ...form, firstName: v })}
              />
            </View>

            {/* Last Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                Last name <Text style={{ color: 'red' }}>*</Text>
              </Text>
              <TextInput
                autoCapitalize="sentences"
                style={[styles.input, { borderColor, color: textColor }]}
                placeholder="Doe"
                placeholderTextColor={subTextColor}
                value={form.lastName}
                onChangeText={(v) => setForm({ ...form, lastName: v })}
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                Email <Text style={{ color: 'red' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,

                  {
                    borderColor:
                      emailError || emailAvailable === false
                        ? 'red'
                        : borderColor,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputInner, { color: textColor }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@email.com"
                  placeholderTextColor={subTextColor}
                  value={form.email}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, email: v }));
                    setEmailAvailable(null);

                    if (typingTimeout.current)
                      clearTimeout(typingTimeout.current);

                    typingTimeout.current = setTimeout(() => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (emailRegex.test(v)) {
                        handleEmailCheck(v);
                      }
                    }, 500);
                  }}
                />
                {checkingEmail && (
                  <ActivityIndicator size="small" color="#9F0EA1" />
                )}
                {!checkingEmail && emailAvailable === true && (
                  <Text style={{ color: 'green', marginRight: 6 }}>✓</Text>
                )}
                {!checkingEmail && emailAvailable === false && (
                  <Text style={{ color: 'red', marginRight: 6 }}>✕</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: subTextColor }]}>
                Phone number
              </Text>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                keyboardType="phone-pad"
                placeholder="09XXxxxxxxx"
                placeholderTextColor={subTextColor}
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
              />
            </View>

            {/* Next */}
            <Pressable
              style={[styles.primaryButton, { opacity: isValid ? 1 : 0.5 }]}
              disabled={!isValid}
              onPress={() =>
                router.push({
                  pathname: ROUTES.AUTH.CREATE_ACCOUNT.PASSWORD,
                  params: form,
                })
              }
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                });
                setEmailAvailable(null);
                setEmailError(null);
                router.back();
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
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
    flex: 1,
    paddingTop: 32,
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

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },

  inputInner: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 8,
  },
});
