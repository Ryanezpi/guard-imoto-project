import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/constants/routes';

export default function Walkthrough() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Walkthrough</Text>
      <Pressable onPress={() => router.replace(ROUTES.ONBOARDING.PERMISSIONS)}>
        <Text>Next → Permissions</Text>
      </Pressable>
    </View>
  );
}
