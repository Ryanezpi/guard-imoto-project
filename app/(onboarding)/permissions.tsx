import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '@/constants/routes';

export default function Permissions() {
  const router = useRouter();

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@onboarding_complete', 'true');
    router.replace(ROUTES.AUTH.LOGIN);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Permissions Screen</Text>
      <Pressable onPress={finishOnboarding}>
        <Text>Finish Onboarding → Login</Text>
      </Pressable>
    </View>
  );
}
