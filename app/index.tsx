import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  // Redirects are handled in app/_layout.tsx to avoid flicker/loops.
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // match your light theme splash
    justifyContent: 'center',
    alignItems: 'center',
  },
});
