import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/context/ThemeContext';

interface TitleSectionProps {
  title: string;
  subtitle?: string; // 👈 NEW
  helperEnabled?: boolean;
  helperValue?: string;
  children: React.ReactNode;
  onHelperPress?: () => void;
}

export default function TitleSection({
  title,
  subtitle,
  helperEnabled = false,
  helperValue,
  onHelperPress,
  children,
}: TitleSectionProps) {
  const { theme } = useTheme();

  const titleColor = theme === 'light' ? '#000' : '#fff';
  const subtitleColor = theme === 'light' ? '#666' : '#aaa';
  const helperColor = theme === 'light' ? '#666' : '#aaa';

  return (
    <View style={{ marginVertical: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        {/* Title + Subtitle */}
        <View style={{ flexShrink: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: titleColor,
            }}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              style={{
                marginTop: 2,
                fontSize: 13,
                color: subtitleColor,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Helper */}
        {helperEnabled && (
          <TouchableOpacity
            onPress={onHelperPress}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <FontAwesome name="question-circle" size={16} color={helperColor} />
            {helperValue && (
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 14,
                  color: helperColor,
                }}
              >
                {helperValue}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View key={theme}>{children}</View>
    </View>
  );
}
