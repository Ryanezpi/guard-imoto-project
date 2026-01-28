import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Option<T extends string> = {
  label: string;
  value: T;
};

interface SegmentToggleProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export default function SegmentToggle<T extends string>({
  value,
  options,
  onChange,
}: SegmentToggleProps<T>) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const bgColor = isLight ? '#9F0EA1' : '#B874DB';

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: isLight ? '#e5e5e5' : '#1f1f1f',
        borderRadius: 12,
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: active ? bgColor : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: '600',
                color: active ? '#fff' : isLight ? '#000' : '#aaa',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
