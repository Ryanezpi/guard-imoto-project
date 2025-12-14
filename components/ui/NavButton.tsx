import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function NavButton({
  route,
  iconName,
  color,
}: {
  route: 'back' | Parameters<typeof router.push>[0] | { action: () => void };
  iconName: keyof typeof FontAwesome.glyphMap;
  color: string;
}) {
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    // Only execute navigation if not currently loading/navigating
    if (loading) return;
    setLoading(true);

    if (typeof route === 'string') {
      if (route === 'back') {
        router.back();
      } else {
        router.push(route);
      }
    } else if ('action' in route && typeof route.action === 'function') {
      route.action();
    }

    // Set loading to false *after* a very small delay (100ms)
    // to prevent immediate double-tap, but let the navigation
    // stack handle the main transition.
    setTimeout(() => setLoading(false), 100);
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
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});
