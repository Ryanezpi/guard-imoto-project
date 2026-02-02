import DateTimePill from '@/components/ui/DateTimePill';
import ConfirmModal, {
  type AlertAction,
} from '@/components/ui/forms/ConfirmModal';
import HelperBox from '@/components/ui/HelperBoxProps';
import TitleSection from '@/components/ui/TitleSection';
import { useAuth } from '@/context/AuthContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getDeviceNFCs,
  linkNFC,
  unlinkNFC,
  type NFCItem,
} from '@/services/user.service';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useGlobalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeviceNFCCardScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { showLoader, hideLoader } = useLoader();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const muted = theme === 'light' ? '#6b7280' : '#9ca3af';
  const cardBg = theme === 'light' ? '#fff' : '#1f1f1f';
  const border = theme === 'light' ? '#e5e7eb' : '#333';
  const primary = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const danger = theme === 'light' ? '#ef4444' : '#f87171';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id ?? '';
  const deviceColor = params.device_color ?? '#2fa500';

  const [loading, setLoading] = useState(true);
  const [nfcs, setNfcs] = useState<NFCItem[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<NFCItem | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
  }>({ visible: false, actions: [] });

  const closeAlert = useCallback(
    () => setAlert((prev) => ({ ...prev, visible: false })),
    []
  );
  const openAlert = useCallback(
    (title: string, message: string, actions?: AlertAction[]) =>
      setAlert({
        visible: true,
        title,
        message,
        actions: actions ?? [
          { text: 'OK', variant: 'primary', onPress: closeAlert },
        ],
      }),
    [closeAlert]
  );

  const fetchNFCs = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const res = await getDeviceNFCs(idToken!, deviceId);
      setNfcs(res ?? []);
    } catch (e: any) {
      console.log('Failed to fetch NFCs', e);
      openAlert('Error', `Failed to fetch NFCs: ${e.message || e}`);
      setNfcs([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, idToken, openAlert]);

  useEffect(() => {
    fetchNFCs();
  }, [fetchNFCs]);

  const handleLinkNFC = async (nfcId: string) => {
    if (!nfcId) return;
    showLoader();
    try {
      setLinking(true);
      await linkNFC(idToken!, deviceId, nfcId);
      await fetchNFCs();
      setManualInput('');
    } catch (e: any) {
      console.log('Failed to link NFC', e);
      openAlert('Error', `Failed to link NFC: ${e.message || e}`);
    } finally {
      setLinking(false);
      hideLoader();
    }
  };

  const handleUnlinkNFC = async (tagUid: string) => {
    try {
      setUnlinking(true);
      showLoader();
      await unlinkNFC(idToken!, tagUid);

      // optimistic UI update
      setNfcs((prev) => prev.filter((n) => n.tag_uid !== tagUid));
    } catch (e: any) {
      console.log('Failed to unlink NFC', e);
      openAlert('Error', `Failed to unlink NFC: ${e.message || e}`);
    } finally {
      setUnlinking(false);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <TitleSection
            title="Linked NFC Tags"
            subtitle={`${nfcs.length} linked to this device`}
          >
            {nfcs.length === 0 ? (
              <HelperBox
                variant="warning"
                text="No NFC tags linked yet. Add a tag below to authorize scans for this device."
              />
            ) : (
              <View style={{ gap: 12 }}>
                {nfcs.map((nfc) => (
                  <View
                    key={nfc.id}
                    style={{
                      borderWidth: 1,
                      borderColor: border,
                      borderRadius: 12,
                      padding: 14,
                      backgroundColor: cardBg,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: `${deviceColor}22`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FontAwesome
                            name="id-card"
                            size={14}
                            color={deviceColor}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              fontWeight: '800',
                              color: textColor,
                              fontSize: 15,
                            }}
                            numberOfLines={1}
                          >
                            {nfc.tag_uid || 'Unknown Tag UID'}
                          </Text>
                          <Text
                            style={{
                              color: muted,
                              fontSize: 12,
                              fontWeight: '600',
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            Record ID: {nfc.id}
                          </Text>
                        </View>
                      </View>

                      <View />
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <DateTimePill value={nfc.paired_at} label="Paired" />
                    </View>

                    <View
                      style={{
                        marginTop: 12,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Pressable
                        onPress={() => setUnlinkTarget(nfc)}
                        disabled={!nfc.tag_uid}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: danger,
                          opacity: !nfc.tag_uid ? 0.6 : 1,
                        }}
                      >
                        <Text
                          style={{
                            color: danger,
                            fontSize: 14,
                            fontWeight: '800',
                          }}
                        >
                          Unlink
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TitleSection>

          <View style={{ height: 14 }} />

          <TitleSection
            title="Link a Tag"
            subtitle="Enter a Tag UID to authorize scans for this device"
          >
            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ color: muted, fontSize: 12, fontWeight: '700' }}>
                  Tag UID
                </Text>
                <TextInput
                  placeholder="e.g. Abc123"
                  value={manualInput}
                  onChangeText={setManualInput}
                  placeholderTextColor={muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: border,
                    borderRadius: 12,
                    padding: 12,
                    color: textColor,
                    backgroundColor: cardBg,
                  }}
                />
              </View>

              <HelperBox
                variant="warning"
                text="You can link multiple NFC tags to this device. Unknown tags will show as unauthorized in RFID telemetry."
              />

              <Pressable
                onPress={() => handleLinkNFC(manualInput.trim())}
                disabled={!manualInput.trim() || linking}
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: primary,
                  opacity: !manualInput.trim() || linking ? 0.6 : 1,
                }}
              >
                <Text
                  style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}
                >
                  {linking ? 'Linking...' : 'Link Tag'}
                </Text>
              </Pressable>
            </View>
          </TitleSection>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={!!unlinkTarget}
        title="Unlink NFC tag?"
        actions={[
          {
            text: 'Cancel',
            variant: 'cancel',
            onPress: () => setUnlinkTarget(null),
          },
          {
            text: unlinking ? 'Unlinking...' : 'Unlink',
            variant: 'destructive',
            onPress: async () => {
              if (!unlinkTarget?.tag_uid || unlinking) return;
              const tagUid = unlinkTarget.tag_uid;
              setUnlinkTarget(null);
              await handleUnlinkNFC(tagUid);
            },
          },
        ]}
        onCancel={() => setUnlinkTarget(null)}
        onDismiss={() => setUnlinkTarget(null)}
      >
        <Text style={{ color: muted, marginTop: 4 }}>
          This will remove the tag from the device allowlist. Future scans from
          this tag will be marked as unauthorized.
        </Text>
        {unlinkTarget?.tag_uid ? (
          <Text style={{ color: textColor, fontWeight: '800', marginTop: 10 }}>
            Tag UID: {unlinkTarget.tag_uid}
          </Text>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        visible={alert.visible}
        title={alert.title}
        actions={alert.actions}
        onCancel={closeAlert}
        onDismiss={closeAlert}
      >
        {alert.message ? <Text>{alert.message}</Text> : null}
      </ConfirmModal>
    </SafeAreaView>
  );
}
