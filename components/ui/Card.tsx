import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, Text, Pressable, View, Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface DynamicCardProps {
  name: string;
  subText?: string | number;
  subTextBold?: boolean;
  prefixIcon: keyof typeof FontAwesome.glyphMap;
  prefixSize?: number;
  prefixColor?: string;
  nameFontSize?: number;
  nameFontFamily?: string;
  suffixIcon?: keyof typeof FontAwesome.glyphMap | null;
  suffixSize?: number;
  suffixColor?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  customBgColor?: string; // optional background override
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

export default function DynamicCard({
  name,
  subText,
  subTextBold = false,
  prefixIcon,
  prefixSize = 18,
  prefixColor,
  nameFontSize = 16,
  nameFontFamily = 'System',
  suffixIcon = 'chevron-right',
  suffixSize = 12,
  suffixColor,
  toggle = false,
  toggleValue = false,
  customBgColor,
  onToggle,
  onPress,
}: DynamicCardProps) {
  const { theme } = useTheme();

  // Base colors based on theme
  const defaultBg = theme === 'light' ? '#fff' : '#1e1e1e';
  const pressedColor = theme === 'light' ? '#f0f0f0' : '#333';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const defaultPrefixColor = prefixColor ?? textColor;
  const defaultSuffixColor =
    suffixColor ?? (theme === 'light' ? '#999' : '#aaa');

  // Use custom background if provided, otherwise theme default
  const bgColor = customBgColor ?? defaultBg;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bgColor },
        pressed && !toggle && { backgroundColor: pressedColor },
      ]}
      android_ripple={{ color: '#ddd', borderless: false }}
      onPress={!toggle ? onPress : undefined}
    >
      <View style={styles.row}>
        <FontAwesome
          name={prefixIcon}
          size={prefixSize}
          color={defaultPrefixColor}
          style={styles.prefixIcon}
        />

        {/* Text column */}
        <View style={styles.textColumn}>
          <Text
            style={{
              fontSize: nameFontSize,
              fontFamily: nameFontFamily,
              color: textColor,
              fontWeight: 'bold', // Main title always bold
            }}
          >
            {name}
          </Text>
          {subText !== undefined && (
            <Text
              style={{
                fontSize: nameFontSize * 0.85,
                color: textColor,
                fontWeight: subTextBold ? 'bold' : 'normal',
              }}
            >
              {subText}
            </Text>
          )}
        </View>

        <View style={styles.suffixContainer}>
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggle}
              trackColor={{ false: '#ccc', true: '#4e8cff' }}
              thumbColor={'#fff'}
            />
          ) : (
            suffixIcon && (
              <FontAwesome
                name={suffixIcon}
                size={suffixSize}
                color={defaultSuffixColor}
              />
            )
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    minHeight: 56,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  prefixIcon: {
    marginRight: 12,
    width: 32,
    height: 32,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  suffixContainer: {
    width: 40,
    aspectRatio: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
