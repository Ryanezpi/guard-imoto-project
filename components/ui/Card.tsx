import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

interface DynamicCardProps {
  name: string;
  nameTextBold?: boolean;

  value?: string;
  onChange?: (value: string) => void;
  subText?: string | number;
  subTextColor?: string;

  /** PREFIX OPTIONS */
  prefixIcon?: keyof typeof FontAwesome.glyphMap;
  prefixElement?: React.ReactNode;
  prefixSize?: number;
  prefixColor?: string;

  nameFontSize?: number;
  nameFontFamily?: string;
  editable?: boolean;

  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;

  suffixIcon?: keyof typeof FontAwesome.glyphMap | null;
  suffixSize?: number;
  suffixColor?: string;

  expandable?: boolean;
  expanded?: boolean;
  customBgColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export default function DynamicCard({
  name,
  value,
  onChange,
  subText,
  subTextColor,
  nameTextBold: subTextBold = false,
  prefixIcon,
  prefixElement,
  prefixSize = 18,
  prefixColor,
  nameFontSize = 16,
  nameFontFamily = 'System',
  editable = false,
  toggle = false,
  toggleValue = false,
  onToggle,
  suffixIcon,
  suffixSize = 12,
  suffixColor,
  expandable = false,
  expanded: expandedProp,
  customBgColor,
  onPress,
  children,
}: DynamicCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<boolean>(false);

  const isExpanded = expandedProp ?? expanded;

  const defaultBg = theme === 'light' ? '#fff' : '#1e1e1e';
  const pressedColor = theme === 'light' ? '#f0f0f0' : '#333';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const bgColor = customBgColor ?? defaultBg;
  const prefixFinalColor = prefixColor ?? textColor;
  const suffixFinalColor = suffixColor ?? (theme === 'light' ? '#999' : '#aaa');

  const handlePress = () => {
    if (expandable) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(!isExpanded);
    }
    if (onPress) {
      onPress();
    }
  };

  const renderPrefix = () => {
    if (prefixElement) {
      return <View style={styles.prefixWrapper}>{prefixElement}</View>;
    }

    if (prefixIcon) {
      return (
        <View style={styles.prefixWrapper}>
          <FontAwesome
            name={prefixIcon}
            size={prefixSize}
            color={prefixFinalColor}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: bgColor, paddingBottom: isExpanded ? 12 : 0 },
        pressed && !editable && !toggle && { backgroundColor: pressedColor },
      ]}
      onPress={handlePress}
      disabled={editable || toggle}
    >
      <View style={styles.row}>
        {renderPrefix()}

        <View style={styles.textColumn}>
          <Text
            style={{
              fontSize: nameFontSize,
              fontFamily: nameFontFamily,
              color: textColor,
              fontWeight: subTextBold ? 'bold' : 'normal',
            }}
          >
            {name}
          </Text>

          {editable ? (
            <TextInput
              value={value}
              onChangeText={onChange}
              editable={editable}
              style={[
                styles.input,
                {
                  color: textColor,
                  borderBottomColor: theme === 'light' ? '#ccc' : '#555',
                },
              ]}
              placeholderTextColor="#999"
            />
          ) : value !== undefined ? (
            <Text style={{ fontSize: nameFontSize * 0.85, color: textColor }}>
              {value}
            </Text>
          ) : subText !== undefined ? (
            <Text
              style={{
                fontSize: nameFontSize * 0.85,
                color: subTextColor || textColor,
              }}
            >
              {subText}
            </Text>
          ) : null}
        </View>

        <View style={[styles.suffixContainer, toggle && { minWidth: 50 }]}>
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggle}
              trackColor={{ false: '#ccc', true: '#4e8cff' }}
              thumbColor="#fff"
            />
          ) : expandable ? (
            <FontAwesome
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={suffixSize}
              color={suffixFinalColor}
            />
          ) : (
            !editable &&
            suffixIcon && (
              <FontAwesome
                name={suffixIcon}
                size={suffixSize}
                color={suffixFinalColor}
              />
            )
          )}
        </View>
      </View>

      {/* Expanded content inside the same card */}
      {isExpanded && children && (
        <View style={styles.expandedContent}>{children}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden', // prevent child from overflowing
  },
  expandedContent: {
    marginLeft: 24,
    marginTop: 8,
    paddingBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
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
    flexShrink: 1,
  },

  suffixContainer: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  prefixWrapper: {
    marginRight: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
