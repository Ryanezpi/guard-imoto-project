import React, { useState } from 'react';
import { View, Text, Button, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import AddDeviceCard from '@/components/ui/AddDeviceCard';
import HelperBox from '@/components/ui/HelperBoxProps';
import { useGlobalSearchParams } from 'expo-router';

export default function DeviceNFCCardScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.deviceId ?? 'Unknown Device';
  const [nfcLinked, setNfcLinked] = useState(false);
  const [nfcTitle, setNfcTitle] = useState('');
  const [nfcDetected, setNfcDetected] = useState('');
  const [manualInput, setManualInput] = useState('');

  const handleAddNFC = () => {
    // simulate reading NFC with phone reader
    if (manualInput) {
      setNfcTitle(`NFC Card`);
      setNfcDetected(manualInput);
      setNfcLinked(true);
    } else {
      // TODO: integrate actual NFC read API if possible
      // simulate success after 5-10s delay
      setTimeout(() => {
        setNfcTitle(`NFC Card`);
        setNfcDetected('Detected NFC ID 123456');
        setNfcLinked(true);
      }, 5000);
    }
  };

  const handleUnlinkNFC = () => {
    setNfcLinked(false);
    setNfcTitle('');
    setNfcDetected('');
    setManualInput('');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {!nfcLinked ? (
          <>
            {/* Add NFC Card */}
            <AddDeviceCard
              label={`Link NFC to Device ${deviceId}`}
              onPress={handleAddNFC}
            />

            {/* Helper */}
            <HelperBox text="After tapping 'Add NFC', tap your card to the device to link. Wait approximately 5 - 10 seconds." />

            {/* Manual Input Fallback */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <TextInput
                placeholder="Or enter NFC ID manually"
                value={manualInput}
                onChangeText={setManualInput}
                placeholderTextColor={textColor}
                style={{
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 12,
                  color: textColor,
                  backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                }}
              />
              <Button
                title="Link NFC manually"
                onPress={handleAddNFC}
                disabled={!manualInput}
              />
            </View>
          </>
        ) : (
          <>
            {/* Linked NFC Display */}
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginTop: 16,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 16,
                backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
              }}
            >
              <Text
                style={{ fontWeight: 'bold', fontSize: 16, color: textColor }}
              >
                {nfcTitle}
              </Text>
              <Text style={{ fontSize: 14, color: textColor }}>
                {nfcDetected}
              </Text>

              <Button
                title="Unlink NFC"
                color="#ff4d4f"
                onPress={handleUnlinkNFC}
              />
            </View>

            <HelperBox text="Un-linking NFC will disable the device. Use the phone's NFC reader to re-link if desired." />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
