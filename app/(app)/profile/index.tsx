import { View, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <View
      style={[styles.container, theme === 'dark' ? styles.dark : styles.light]}
    >
      <Text style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
        Current theme: {theme}
      </Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dark: { backgroundColor: '#121212' },
  light: { backgroundColor: '#f5f5f5' },
});
