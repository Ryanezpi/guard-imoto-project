import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface DevicePrefixProps {
  color: string;
  size?: number;
  borderWidth?: number;
}

export default function DevicePrefix({
  color,
  size = 18,
  borderWidth = 2,
}: DevicePrefixProps) {
  const { theme } = useTheme();

  const borderColor = theme === 'light' ? '#e8e6e6ff' : '#fff';

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth,
          borderColor,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: 'center',
  },
});
