import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/context/ThemeContext';

interface TitleSectionProps {
  title: string; // The main header/title
  helperEnabled?: boolean; // Show helper icon
  helperValue?: string; // Helper value shown when ? is pressed or inline
  children: React.ReactNode; // Content wrapped below the header
  onHelperPress?: () => void; // Optional press action for helper
}

// TitleSection.tsx
export default function TitleSection({
  title,
  helperEnabled = false,
  helperValue,
  onHelperPress,
  children,
}: TitleSectionProps) {
  const { theme } = useTheme(); // using theme ensures re-render on theme change

  const titleColor = theme === 'light' ? '#000' : '#fff';
  const helperColor = theme === 'light' ? '#666' : '#aaa';

  return (
    <View style={{ marginVertical: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: titleColor }}>
          {title}
        </Text>
        {helperEnabled && (
          <TouchableOpacity
            onPress={onHelperPress}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <FontAwesome name="question-circle" size={16} color={helperColor} />
            {helperValue && (
              <Text style={{ marginLeft: 6, fontSize: 14, color: helperColor }}>
                {helperValue}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Wrap children in a View with a key based on theme to force re-render */}
      <View key={theme}>{children}</View>
    </View>
  );
}
