import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
// import AddDeviceCard from '@/components/ui/AddDeviceCard';
import HelperBox from '@/components/ui/HelperBoxProps';
import { useGlobalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  getDeviceNFCs,
  linkNFC,
  unlinkNFC,
  type NFCItem,
} from '@/services/user.service';
import { useLoader } from '@/context/LoaderContext';

export default function DeviceNFCCardScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id ?? '';
  const deviceColor = params.device_color ?? '#2fa500';

  const [loading, setLoading] = useState(true);
  const [nfcs, setNfcs] = useState<NFCItem[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [linking, setLinking] = useState(false);

  const fetchNFCs = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      showLoader();
      const res = await getDeviceNFCs(idToken!, deviceId);
      setNfcs(res ?? []);
    } catch (e: any) {
      console.error('Failed to fetch NFCs', e);
      Alert.alert('Error', `Failed to fetch NFCs: ${e.message || e}`);
      setNfcs([]);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }, [deviceId, hideLoader, idToken, showLoader]);

  useEffect(() => {
    fetchNFCs();
  }, [fetchNFCs]);

  const handleLinkNFC = async (nfcId: string) => {
    if (!nfcId) return;
    try {
      setLinking(true);
      await linkNFC(idToken!, deviceId, nfcId);
      await fetchNFCs();
      setManualInput('');
    } catch (e: any) {
      console.error('Failed to link NFC', e);
      Alert.alert('Error', `Failed to link NFC: ${e.message || e}`);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkNFC = async (tagUid: string) => {
    try {
      showLoader();
      await unlinkNFC(idToken!, tagUid);

      // optimistic UI update
      setNfcs((prev) => prev.filter((n) => n.tag_uid !== tagUid));
    } catch (e: any) {
      console.error('Failed to unlink NFC', e);
      Alert.alert('Error', `Failed to unlink NFC: ${e.message || e}`);
    } finally {
      hideLoader();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={deviceColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {nfcs.length > 0 && (
          <View style={{ gap: 12 }}>
            {nfcs.map((nfc) => (
              <View
                key={nfc.id}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: textColor }}>
                  Tag UID: {nfc.tag_uid}
                </Text>
                <Text style={{ color: textColor }}>ID: {nfc.id}</Text>
                <Text style={{ color: textColor }}>
                  Paired At:{' '}
                  {nfc.paired_at
                    ? new Date(nfc.paired_at).toLocaleString()
                    : 'N/A'}
                </Text>

                <Pressable
                  onPress={() => handleUnlinkNFC(nfc.tag_uid!)}
                  style={{
                    marginTop: 12,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: '#ff4d4f',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Unlink NFC
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Add NFC */}
        <View style={{ marginTop: 24, gap: 12 }}>
          <TextInput
            placeholder="Enter NFC ID manually"
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

          <HelperBox text="You can link multiple NFC tags to this device." />

          <Pressable
            onPress={() => handleLinkNFC(manualInput)}
            disabled={!manualInput || linking}
            style={{
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: '#2563EB',
              opacity: !manualInput || linking ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {linking ? 'Linking...' : 'Link another NFC'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
