import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  children,
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useTheme();

  const bg = theme === 'light' ? '#fff' : '#1f1f1f';
  const text = theme === 'light' ? '#000' : '#fff';

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#00000066',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '90%',
            backgroundColor: bg,
            borderRadius: 12,
            padding: 16,
          }}
        >
          {title && (
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 12,
                color: text,
              }}
            >
              {title}
            </Text>
          )}

          {children}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              marginTop: 16,
            }}
          >
            <TouchableOpacity onPress={onCancel}>
              <Text
                style={{
                  color: '#999',
                  fontSize: 16,
                  marginRight: 16,
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm}>
              <Text
                style={{
                  color: '#4e8cff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
