import { ROUTES } from '@/constants/routes';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const PUSH_TOKEN_KEY = '@expo_push_token';

async function storePushToken(token: string) {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

async function getStoredPushToken() {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    Alert.alert(
      'Physical device required',
      'Push notifications only work on a physical device.'
    );
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('myNotificationChannel', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      throw new Error('EAS projectId not found');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.warn('Push token error:', error);
    return null;
  }
}

export default function Permissions() {
  const router = useRouter();

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@onboarding_complete', 'true');
    router.replace(ROUTES.AUTH.LOGIN);
  };

  const handleContinue = async () => {
    try {
      /* ---------------- Push Notifications ---------------- */
      const pushToken = await registerForPushNotificationsAsync();
      const hasPush = Boolean(pushToken);

      /* ---------------- Location ---------------- */
      const locPermission = await Location.requestForegroundPermissionsAsync();

      const hasLocation = locPermission.status === 'granted';

      let hasPreciseLocation = true;

      // iOS specific
      if (Platform.OS === 'ios') {
        const iosDetails = locPermission.ios as
          | {
              accuracy?: Location.LocationAccuracy;
            }
          | undefined;

        hasPreciseLocation = iosDetails?.accuracy === Location.Accuracy.High;
      }

      if (hasPush && hasLocation && hasPreciseLocation) {
        if (pushToken) {
          const existingToken = await getStoredPushToken();

          if (existingToken !== pushToken) {
            await storePushToken(pushToken);
          }
        }

        await finishOnboarding();
        return;
      }

      Alert.alert(
        'Permissions Required',
        'Please enable Precise Location and Notification access in Settings to protect your vehicle.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: Linking.openSettings },
        ]
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      Alert.alert('Error', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: Linking.openSettings },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Ready to Secure Your Ride!</Text>
          <Text style={styles.subtitle}>
            To give you the best experience, we need a few permissions:
          </Text>
        </View>

        <View style={styles.listContainer}>
          <PermissionItem
            icon={<FontAwesome name="map-marker" size={14} color="#2563EB" />}
            title="Location access"
            description="so we can track your motorcycle, detect suspicious movement, and guide recovery if stolen."
          />

          <PermissionItem
            icon={<FontAwesome name="bell" size={14} color="#2563EB" />}
            title="Notification access"
            description="to alert you instantly about security events and system updates."
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          We respect your privacy and only use this data to protect your
          vehicle.
        </Text>

        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={finishOnboarding}>
          <Text style={styles.secondaryButtonText}>Not Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Reusable Row ---------------- */
const PermissionItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <View style={styles.itemRow}>
    <View style={styles.iconContainer}>{icon}</View>
    <View style={styles.textContainer}>
      <Text style={styles.itemDescription}>
        <Text style={styles.itemTitle}>{title}</Text> — {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
  },
  listContainer: {
    gap: 35,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 16,
    paddingTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 16,
  },
  itemDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 40,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#1C1C1E',
    marginBottom: 20,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
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
    borderColor: '#2563EB',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: '600',
  },
});
