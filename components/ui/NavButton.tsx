import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function NavButton({
  route,
  iconName,
  color,
}: {
  route: string | any;
  iconName: keyof typeof FontAwesome.glyphMap;
  color: string;
}) {
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    if (loading) return; // ignore repeated taps
    setLoading(true);
    router.push(route);
    // optionally, reset loading after a small delay
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.iconContainer}
      android_ripple={{ color: '#ccc', borderless: true }}
      disabled={loading}
    >
      <FontAwesome name={iconName} size={18} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    height: '100%',
    padding: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
