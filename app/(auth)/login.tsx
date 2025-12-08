import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login</Text>
      <Pressable onPress={() => router.replace('/(app)/map')}>
        <Text>Go to Dashboard</Text>
      </Pressable>
    </View>
  );
}
