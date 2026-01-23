// TelemetryModal.tsx
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GpsTelemetry } from './GpsTelemetry';
import { GyroTelemetry } from './GyroTelemetry';
import { RfidTelemetry } from './RfidTelemetry';
import { DetectionTelemetry } from './DetectionTelemetry';
import { TelemetryType } from '@/app/(guard)/(app)/map/device-settings';

interface TelemetryModalProps {
  visible: boolean;
  type: TelemetryType;
  deviceId: string;
  idToken: string;
  realtime: boolean;
  onClose: () => void;
}
export function TelemetryModal({
  visible,
  type,
  deviceId,
  idToken,
  realtime,
  onClose,
}: TelemetryModalProps) {
  const { theme } = useTheme();

  if (!type) return null;

  // ---- Theme-derived colors (single source of truth)
  const bgColor = theme === 'light' ? '#ffffff' : '#1d1d1d';
  const textColor = theme === 'light' ? '#111111' : '#f5f5f5';
  const borderColor = theme === 'light' ? '#e0e0e0' : '#2a2a2a';
  const mutedTextColor = theme === 'light' ? '#999' : '#aaa';

  const commonProps = { deviceId, idToken, realtime };

  const renderBody = () => {
    switch (type) {
      case 'gps':
        return <GpsTelemetry {...commonProps} />;
      case 'gyro':
        return <GyroTelemetry {...commonProps} />;
      case 'rfid':
        return <RfidTelemetry {...commonProps} />;
      case 'detections':
        return <DetectionTelemetry {...commonProps} />;
      default:
        return (
          <Text style={{ color: mutedTextColor }}>Unknown telemetry type</Text>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {type.toUpperCase()} Telemetry
            </Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: mutedTextColor, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={[styles.content, { borderTopColor: borderColor }]}>
            {renderBody()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16, borderTopWidth: 1 },
});
