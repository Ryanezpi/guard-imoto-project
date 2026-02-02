import PrivacyPolicyModal from '@/components/ui/PrivacyPolicyModal';
import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Walkthrough() {
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Welcome to GuardiMoto!</Text>

        {/* Logo - Replace 'path-to-your-logo' with your actual local asset */}
        <Image
          source={require('@/assets/icons/main-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Subtitle */}
        <Text style={styles.subtitle}>Smart security for your motorcycle</Text>
      </View>

      {/* Footer Area */}
      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => router.replace(ROUTES.ONBOARDING.PERMISSIONS)}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>

        <Text style={styles.legalText}>
          By proceeding further, you agree to our
          <Text
            style={styles.link}
            onPress={() => setShowPrivacy(true)}
          >
            {' '}
            privacy policy{' '}
          </Text>
          and provide your consent.
        </Text>
      </View>
      <PrivacyPolicyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800', // Extra bold
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    width: 124,
    height: 124,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#9F0EA1', // The purple from your image
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  link: {
    color: '#9F0EA1',
    textDecorationLine: 'none',
  },
});
