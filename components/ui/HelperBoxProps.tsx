import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface HelperBoxProps {
  text: string;
  iconName?: keyof typeof FontAwesome.glyphMap; // optional prefix icon
  suffixIcon?: keyof typeof FontAwesome.glyphMap; // optional fixed suffix icon
  iconColor?: string; // optional color override for prefix icon
  suffixColor?: string; // optional color override for suffix icon
}

export default function HelperBox({
  text,
  iconName = 'info-circle',
  iconColor,
  suffixColor,
}: HelperBoxProps) {
  const { theme } = useTheme();
  const borderColor = theme === 'light' ? '#ccc' : '#555';
  const textColor = theme === 'light' ? '#333' : '#eee';
  const finalIconColor = iconColor ?? (theme === 'light' ? '#888' : '#aaa');

  return (
    <View style={[styles.container, { borderColor }]}>
      {/* Content row */}
      <View style={styles.content}>
        {iconName && (
          <FontAwesome
            name={iconName}
            size={18}
            color={finalIconColor}
            style={styles.prefixIcon}
          />
        )}
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  prefixIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  suffixIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
});
