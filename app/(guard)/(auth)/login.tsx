import { ROUTES } from '@/constants/routes';
import AuthTextField from '@/components/ui/forms/AuthTextField';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/lib/firebase';
import ConfirmModal, { type AlertAction } from '@/components/ui/forms/ConfirmModal';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  type TextInput,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showLoader, hideLoader } = useLoader();
  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#272727';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#1C1C1E' : '#9ca3af';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const [attempted, setAttempted] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
  }>({ visible: false, actions: [] });

  const closeAlert = () => setAlert((prev) => ({ ...prev, visible: false }));
  const openAlert = (title: string, message: string) =>
    setAlert({
      visible: true,
      title,
      message,
      actions: [{ text: 'OK', variant: 'primary', onPress: closeAlert }],
    });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    (attempted || emailTouched) && !email.trim()
      ? 'Email is required.'
      : (attempted || emailTouched) && !emailRegex.test(email.trim())
        ? 'Enter a valid email address.'
        : undefined;
  const passwordError =
    (attempted || passwordTouched) && !password
      ? 'Password is required.'
      : undefined;

  const login = async () => {
    try {
      setAttempted(true);
      if (emailError || passwordError) return;
      setLoading(true);
      showLoader();
      setSecure(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      hideLoader();
      openAlert('Login failed', e.message ?? 'Unable to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
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
              {/* ⬇️ everything else stays exactly the same ⬇️ */}
              <Text style={[styles.title, { color: textColor }]}>Login</Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                Enter your email and password to continue
              </Text>

              {/* Email */}
              <AuthTextField
                label={
                  <Text style={[styles.label, { color: subTextColor }]}>
                    Email
                  </Text>
                }
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@email.com"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                blurOnSubmit={false}
                onBlur={() => setEmailTouched(true)}
                onSubmitEditing={() => {
                  passwordRef.current?.focus?.();
                }}
                error={emailError}
              />

              {/* Password */}
              <AuthTextField
                label={
                  <Text style={[styles.label, { color: subTextColor }]}>
                    Password
                  </Text>
                }
                secureTextEntry={secure}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={login}
                inputRef={passwordRef}
                onBlur={() => setPasswordTouched(true)}
                error={passwordError}
                rightElement={
                  <Pressable
                    onPress={() => setSecure(!secure)}
                    focusable={false}
                    accessible={false}
                  >
                    <Text style={styles.toggle}>
                      {secure ? (
                        <FontAwesome name="eye" size={18} color="#8E8E93" />
                      ) : (
                        <FontAwesome
                          name="eye-slash"
                          size={18}
                          color="#8E8E93"
                        />
                      )}
                    </Text>
                  </Pressable>
                }
              />

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
                onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD)}
              >
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push(ROUTES.AUTH.CREATE_ACCOUNT.ROOT)}
              >
                <Text style={styles.link}>
                  Don&apos;t have an account?
                  <Text style={styles.linkBold}> Create one</Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <ConfirmModal
        visible={alert.visible}
        title={alert.title}
        actions={alert.actions}
        onCancel={closeAlert}
        onDismiss={closeAlert}
      >
        {alert.message ? <Text>{alert.message}</Text> : null}
      </ConfirmModal>
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
    color: '#9F0EA1',
    paddingLeft: 12,
  },

  primaryButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#9F0EA1',
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
    color: '#9F0EA1',
    textAlign: 'center',
  },

  linkBold: {
    fontWeight: '600',
  },
});
