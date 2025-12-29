import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import AddDeviceCard from '@/components/ui/AddDeviceCard';
import HelperBox from '@/components/ui/HelperBoxProps';
import { useGlobalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  getDeviceNFCs,
  linkNFC,
  unlinkNFC,
  type NFCItem,
} from '@/services/user.service';

export default function DeviceNFCCardScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id ?? '';
  const deviceColor = params.device_color ?? '#2fa500';

  const [loading, setLoading] = useState(true);
  const [nfc, setNfc] = useState<NFCItem | null>(null); // single NFC
  const [manualInput, setManualInput] = useState('');
  const [linking, setLinking] = useState(false);

  const fetchNFC = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const res = await getDeviceNFCs(idToken!, deviceId);
      setNfc(res && res.length > 0 ? res[0] : null); // take the first (only) tag
    } catch (e: any) {
      console.error('Failed to fetch NFC', e);
      Alert.alert('Error', `Failed to fetch NFC: ${e.message || e}`);
      setNfc(null);
    } finally {
      setLoading(false);
    }
  }, [deviceId, idToken]);

  useEffect(() => {
    fetchNFC();
  }, [fetchNFC]);

  const handleLinkNFC = async (nfcId: string) => {
    if (!nfcId) return;
    try {
      setLinking(true);
      await linkNFC(idToken!, deviceId, nfcId);
      await fetchNFC();
      setManualInput('');
    } catch (e: any) {
      console.error('Failed to link NFC', e);
      Alert.alert('Error', `Failed to link NFC: ${e.message || e}`);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkNFC = async (nfcId: string) => {
    try {
      await unlinkNFC(idToken!, nfcId);
      setNfc(null);
    } catch (e: any) {
      console.error('Failed to unlink NFC', e);
      Alert.alert('Error', `Failed to unlink NFC: ${e.message || e}`);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={deviceColor} />
        ) : nfc ? (
          // Show existing NFC
          <View
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 16,
              marginVertical: 6,
              backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
            }}
          >
            <Text style={{ fontWeight: 'bold', color: textColor }}>
              Tag UID: {nfc.tag_uid}
            </Text>
            <Text style={{ color: textColor }}>ID: {nfc.id}</Text>
            <Text style={{ color: textColor }}>
              Paired At:{' '}
              {nfc.paired_at ? new Date(nfc.paired_at).toLocaleString() : 'N/A'}
            </Text>
            <Button
              title="Unlink"
              color="#ff4d4f"
              onPress={() => handleUnlinkNFC(nfc.tag_uid!)}
            />
          </View>
        ) : (
          <>
            {/* Add NFC */}
            <AddDeviceCard
              label={`Link NFC to Device`}
              onPress={() => {
                if (manualInput) {
                  handleLinkNFC(manualInput);
                } else {
                  Alert.alert(
                    'Info',
                    'Scan an NFC with your phone reader or enter manually.'
                  );
                }
              }}
            />
            <HelperBox text="After tapping 'Add NFC', tap your card to the device to link. Wait a few seconds for it to register." />

            {/* Manual Input */}
            <View
              style={{ flexDirection: 'column', gap: 12, marginVertical: 12 }}
            >
              <TextInput
                placeholder="Or enter NFC ID manually"
                value={manualInput}
                onChangeText={setManualInput}
                placeholderTextColor={textColor}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 12,
                  color: textColor,
                  backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                }}
              />
              <Button
                title={linking ? 'Linking...' : 'Link NFC manually'}
                onPress={() => handleLinkNFC(manualInput)}
                disabled={!manualInput || linking}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
