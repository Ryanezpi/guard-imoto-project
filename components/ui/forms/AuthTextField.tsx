import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type AuthTextFieldProps = {
  label: React.ReactNode;
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
  secureTextEntry?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  textContentType?: TextInputProps['textContentType'];
  autoCorrect?: boolean;
  inputRef?: React.Ref<TextInput>;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  onFocus?: TextInputProps['onFocus'];
  onBlur?: TextInputProps['onBlur'];
  blurOnSubmit?: TextInputProps['blurOnSubmit'];
  error?: string;
  helperText?: string;
};

export default function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  editable = true,
  secureTextEntry,
  returnKeyType,
  onSubmitEditing,
  textContentType,
  autoCorrect,
  inputRef,
  rightElement,
  containerStyle,
  inputContainerStyle,
  onFocus,
  onBlur,
  error,
  helperText,
  blurOnSubmit,
}: AuthTextFieldProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const textColor = theme === 'light' ? '#111827' : '#f9fafb';
  const labelColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const placeholderColor = theme === 'light' ? '#9ca3af' : '#6b7280';
  const borderColor = theme === 'light' ? '#b0b7c3' : '#2b2f35';
  const focusBorderColor = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const errorColor = theme === 'light' ? '#dc2626' : '#f87171';
  const helpTextColor = error ? errorColor : theme === 'light' ? '#6b7280' : '#9ca3af';

  const resolvedBorderColor = error
    ? errorColor
    : isFocused
      ? focusBorderColor
      : borderColor;
  const bgColor = theme === 'light' ? '#ffffff' : '#272727';

  const renderLabel =
    typeof label === 'string' ? (
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    ) : (
      <View style={styles.labelContainer}>{label}</View>
    );

  return (
    <View style={[styles.field, containerStyle]}>
      {renderLabel}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: resolvedBorderColor,
            backgroundColor: bgColor,
            opacity: editable ? 1 : 0.7,
          },
          inputContainerStyle,
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          blurOnSubmit={blurOnSubmit}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: textColor }]}
        />
        {rightElement ? (
          <View style={styles.rightElement}>{rightElement}</View>
        ) : null}
      </View>
      {error || helperText ? (
        <Text style={[styles.helperText, { color: helpTextColor }]}>
          {error ?? helperText}
        </Text>
      ) : null}
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
  labelContainer: {
    marginBottom: 6,
  },
  inputContainer: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  rightElement: {
    marginLeft: 6,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
});
