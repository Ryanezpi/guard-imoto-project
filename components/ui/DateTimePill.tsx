import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type DateTimePillProps = {
  value?: string | number | Date | null;
  size?: 'sm' | 'md';
  label?: string;
};

const formatDateTime = (value?: string | number | Date | null) => {
  if (!value) return 'Unknown';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return (
    date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString()
  );
};

export default function DateTimePill({
  value,
  size = 'sm',
  label,
}: DateTimePillProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const bg = isLight ? '#e5e7eb' : '#1f2937';
  const border = isLight ? '#d1d5db' : '#3f3f46';
  const text = isLight ? '#374151' : '#e5e7eb';
  const labelText = isLight ? '#6b7280' : '#9ca3af';
  const isSmall = size === 'sm';

  return (
    <View style={styles.row}>
      {label ? (
        <Text
          style={{
            color: labelText,
            fontSize: isSmall ? 11 : 12,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.pill,
          {
            backgroundColor: bg,
            borderColor: border,
            paddingVertical: isSmall ? 4 : 6,
          },
        ]}
      >
        <Text
          style={{
            color: text,
            fontSize: isSmall ? 11 : 12,
            fontWeight: '600',
          }}
        >
          {formatDateTime(value)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
});
