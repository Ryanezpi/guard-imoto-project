import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

declare global {
  var __toggleProfileEdit: (() => void) | undefined;
  var __isProfileEditing: boolean | undefined;
  var __hasProfileChanges: boolean | undefined;
}

export function HeaderEditButton() {
  const { theme } = useTheme();
  const titleColor = theme === 'light' ? '#000' : '#fff';
  const primary = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const border = theme === 'light' ? '#e5e7eb' : '#333';
  const mutedText = theme === 'light' ? '#6b7280' : '#9ca3af';
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globalThis.__isProfileEditing !== undefined) {
        setIsEditing(globalThis.__isProfileEditing);
      }
      if (globalThis.__hasProfileChanges !== undefined) {
        setHasChanges(globalThis.__hasProfileChanges);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const label = isEditing ? (hasChanges ? 'Save' : 'Cancel') : 'Edit';
  const isPrimary = isEditing && hasChanges;

  return (
    <Pressable
      onPress={() => globalThis.__toggleProfileEdit?.()}
      style={[
        styles.container,
        {
          backgroundColor: isPrimary ? primary : 'transparent',
          borderColor: isPrimary ? primary : border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isPrimary ? '#fff' : isEditing ? mutedText : titleColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
