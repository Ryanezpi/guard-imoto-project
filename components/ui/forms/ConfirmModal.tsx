import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  type TextProps,
  Keyboard,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type AlertAction = {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'cancel' | 'destructive' | 'default';
};

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  actions?: AlertAction[];
  onDismiss?: () => void;
  fullWidthActions?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  children,
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  actions,
  onDismiss,
  fullWidthActions = false,
}: ConfirmModalProps) {
  const { theme } = useTheme();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const bg = theme === 'light' ? '#fff' : '#1f1f1f';
  const text = theme === 'light' ? '#111827' : '#f9fafb';
  const border = theme === 'light' ? '#e5e7eb' : '#333';
  const overlay = theme === 'light' ? '#00000066' : '#00000088';
  const primary = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const cancelTextColor = theme === 'light' ? '#6b7280' : '#9ca3af';
  const destructive = '#ef4444';

  const resolvedActions = actions ?? [];
  const hasActions = resolvedActions.length > 0;
  const useStacked = fullWidthActions || resolvedActions.length > 2;
  const handleCancel = onCancel ?? onDismiss ?? (() => {});
  const handleConfirm = onConfirm ?? (() => {});

  const isTextElement = (
    node: React.ReactNode
  ): node is React.ReactElement<TextProps> =>
    React.isValidElement(node) && node.type === Text;

  const hasChildren = (
    node: React.ReactNode
  ): node is React.ReactElement<{ children?: React.ReactNode }> =>
    React.isValidElement<{ children?: React.ReactNode }>(node);

  const tintText = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) return node;
    if (isTextElement(node)) {
      return React.cloneElement(node, {
        style: [{ color: text }, node.props.style],
      });
    }
    if (hasChildren(node)) {
      return React.cloneElement(node, {
        children: React.Children.map(node.props.children, tintText),
      });
    }
    return node;
  };

  const buttonStyle = (variant?: AlertAction['variant']) => {
    if (variant === 'primary') {
      return { backgroundColor: primary, borderColor: primary };
    }
    if (variant === 'destructive') {
      return { backgroundColor: destructive, borderColor: destructive };
    }
    return { backgroundColor: 'transparent', borderColor: border };
  };

  const buttonTextColor = (variant?: AlertAction['variant']) => {
    if (variant === 'primary' || variant === 'destructive') return '#fff';
    if (variant === 'cancel') return cancelTextColor;
    return text;
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss ?? handleCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: overlay,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '92%',
            maxWidth: 420,
            maxHeight: SCREEN_HEIGHT * 0.8, // 🔑 hard cap
            backgroundColor: bg,
            borderRadius: 12,
            overflow: 'hidden', // 🔑 prevents bleed
            borderWidth: 1,
            borderColor: border,
          }}
        >
          {/* HEADER */}
          {title && (
            <View style={{ padding: 16, paddingBottom: 8 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: text,
                }}
              >
                {title}
              </Text>
            </View>
          )}

          {/* SCROLLABLE CONTENT */}
          {children ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 16,
                // Keep the modal size stable; just add scrollable space when the keyboard is up.
                paddingBottom: 16 + keyboardHeight,
              }}
              showsVerticalScrollIndicator={false}
            >
              {tintText(children)}
            </ScrollView>
          ) : null}

          {/* FOOTER */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: hasActions ? 'stretch' : 'center',
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: border,
              gap: hasActions ? 10 : 0,
            }}
          >
            {hasActions ? (
              <View
                style={{
                  flexDirection: useStacked ? 'column' : 'row',
                  justifyContent: useStacked ? 'flex-start' : 'flex-end',
                  gap: 10,
                  width: fullWidthActions ? '100%' : undefined,
                }}
              >
                {resolvedActions.map((action, idx) => (
                  <TouchableOpacity
                    key={`${action.text}-${idx}`}
                    onPress={action.onPress}
                    style={{
                      width: useStacked ? '100%' : 120,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      borderWidth: 1,
                      alignItems: 'center',
                      ...buttonStyle(action.variant),
                    }}
                  >
                    <Text
                      style={{
                        color: buttonTextColor(action.variant),
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <>
                {/*
                  Fixed button width for consistent sizing across titles
                  without stretching to container width.
                */}
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{
                    width: 120,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: border,
                    marginRight: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: cancelTextColor,
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={{
                    width: 120,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: primary,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                  >
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
