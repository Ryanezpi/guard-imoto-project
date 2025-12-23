import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function CreateAccount() {
  const router = useRouter();
  const { theme } = useTheme();

  const bgColor = theme === 'light' ? '#ffffff' : '#272727';
  const cardColor = theme === 'light' ? '#ffffff' : '#1f1f1f';
  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const subTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [isValid, setIsValid] = useState(false);

  // Validation rules
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const valid =
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      emailRegex.test(form.email);
    setIsValid(valid);
  }, [form]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Tell us about yourself
        </Text>

        {/* First Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>
            First name
          </Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="John"
            placeholderTextColor={subTextColor}
            value={form.firstName}
            onChangeText={(v) => setForm({ ...form, firstName: v })}
          />
        </View>

        {/* Last Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: subTextColor }]}>Last name</Text>
          <TextInput
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
            Email address
          </Text>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@email.com"
            placeholderTextColor={subTextColor}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
        </View>

        {/* Next */}
        <Pressable
          style={[styles.primaryButton, { opacity: isValid ? 1 : 0.5 }]}
          disabled={!isValid}
          onPress={() =>
            router.push({
              pathname: '/(auth)/create-account/password',
              params: form,
            })
          }
        >
          <Text style={styles.primaryButtonText}>Next</Text>
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

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
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

  buttonPressed: {
    opacity: 0.9,
  },
});
