import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'number-pad'
    | 'decimal-pad';
  editable?: boolean;
};

export default function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  editable = true,
}: AuthTextFieldProps) {
  const { theme } = useTheme();

  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const labelColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const placeholderColor = theme === 'light' ? '#9ca3af' : '#6b7280';
  const borderColor = theme === 'light' ? '#d1d5db' : '#3f3f46';
  const bgColor = theme === 'light' ? '#ffffff' : '#272727';

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        style={[
          styles.input,
          {
            borderColor,
            color: textColor,
            backgroundColor: bgColor,
            opacity: editable ? 1 : 0.7,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
