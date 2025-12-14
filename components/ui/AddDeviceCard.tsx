import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/context/ThemeContext';

interface AddDeviceCardProps {
  label?: string;
  onPress: () => void;
}

export default function AddDeviceCard({
  label = 'Add Device',
  onPress,
}: AddDeviceCardProps) {
  const { theme } = useTheme();

  const borderColor = theme === 'light' ? '#bbb' : '#555';
  const textColor = theme === 'light' ? '#555' : '#aaa';
  const bgColor = theme === 'light' ? '#fff' : '#1e1e1e';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: bgColor, borderColor }]}
    >
      <View style={styles.content}>
        <FontAwesome name="plus-circle" size={22} color={textColor} />
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    marginTop: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
