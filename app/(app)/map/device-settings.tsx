import DynamicCard from '@/components/ui/Card';
import DevicePrefix from '@/components/ui/DevicePrefix';
import ConfirmModal from '@/components/ui/forms/ConfirmModal';
import TitleSection from '@/components/ui/TitleSection';
import { DEVICE_COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/context/ThemeContext';
import { router, useGlobalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DeviceState = {
  name: string;
  color: string;
  enabled: boolean;
  sensors: {
    gyroscope: boolean;
    gps: boolean;
  };
  alerts: {
    sms: boolean;
    vibration: boolean;
    movement: boolean;
    tremors: boolean;
    lowBattery: boolean;
  };
  relays: {
    siren: boolean;
    ignition: boolean;
  };
};

export default function DeviceSettingsScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.deviceId ?? 'Unknown Device';
  const deviceColor = params.prefixColor ?? '#4e8cff';

  const [device, setDevice] = useState<DeviceState>({
    name: deviceId,
    color: deviceColor,
    enabled: true,
    sensors: { gyroscope: false, gps: false },
    alerts: {
      sms: false,
      vibration: false,
      movement: false,
      tremors: false,
      lowBattery: false,
    },
    relays: { siren: false, ignition: false },
  });

  const [draft, setDraft] = useState(device);
  const [showEditModal, setShowEditModal] = useState(false);
  const sirenTimeoutRef = useRef<number | null>(null);

  const openEditModal = () => {
    setDraft(device);
    setShowEditModal(true);
  };

  // Auto-off siren after 10s
  useEffect(() => {
    if (!device.relays.siren) {
      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
        sirenTimeoutRef.current = null;
      }
      return;
    }

    sirenTimeoutRef.current = setTimeout(() => {
      setDevice((d) => ({ ...d, relays: { ...d.relays, siren: false } }));
      sirenTimeoutRef.current = null;
    }, 10_000);

    return () => {
      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
        sirenTimeoutRef.current = null;
      }
    };
  }, [device.relays.siren]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ConfirmModal
        visible={showEditModal}
        title="Edit Device"
        onCancel={() => {
          setDraft(device);
          setShowEditModal(false);
        }}
        onConfirm={() => {
          setDevice(draft);
          setShowEditModal(false);
        }}
      >
        <Text
          style={{
            fontSize: 14,
            marginBottom: 4,
            color: theme === 'light' ? '#555' : '#aaa',
          }}
        >
          Device Name
        </Text>
        <TextInput
          value={draft.name}
          onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
            color: theme === 'light' ? '#000' : '#fff',
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {DEVICE_COLORS.map((c) => {
            const selected = draft.color === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setDraft((d) => ({ ...d, color: c }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? theme === 'light'
                      ? '#000'
                      : '#fff'
                    : '#ccc',
                }}
              >
                {selected && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: c === '#000000' ? '#fff' : '#000',
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <DynamicCard
          name="Enable Device"
          prefixIcon="power-off"
          toggle
          toggleValue={draft.enabled}
          onToggle={(v) => setDraft((d) => ({ ...d, enabled: v }))}
        />
      </ConfirmModal>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* DEVICE SETTINGS */}
        <TitleSection title="Device Settings">
          <DynamicCard
            name={device.name}
            nameTextBold
            subText={device.enabled ? 'Enabled' : 'Disabled'}
            subTextColor={device.enabled ? '#2fa500ff' : '#ff3b30ff'}
            prefixElement={<DevicePrefix color={device.color} />}
            suffixIcon="edit"
            onPress={openEditModal}
          />

          <DynamicCard
            name="Battery"
            prefixIcon="battery"
            subText="100%"
            suffixIcon="chevron-right"
            onPress={() => router.navigate(ROUTES.MAP.DEVICE.BATTERY)}
          />

          <DynamicCard
            name="Gyroscope Sensor"
            prefixIcon="balance-scale"
            toggle
            toggleValue={device.sensors.gyroscope}
            onToggle={(v) =>
              setDevice((d) => ({
                ...d,
                sensors: { ...d.sensors, gyroscope: v },
              }))
            }
          />

          <DynamicCard
            name="GPS Tracking"
            prefixIcon="map-marker"
            toggle
            toggleValue={device.sensors.gps}
            onToggle={(v) =>
              setDevice((d) => ({ ...d, sensors: { ...d.sensors, gps: v } }))
            }
          />

          <DynamicCard
            name="SMS Alerts"
            prefixIcon="envelope"
            toggle
            toggleValue={device.alerts.sms}
            onToggle={(v) =>
              setDevice((d) => ({ ...d, alerts: { ...d.alerts, sms: v } }))
            }
          />

          <DynamicCard
            name="Relay Channel 1 (Siren)"
            prefixIcon="bullhorn"
            toggle
            toggleValue={device.relays.siren}
            onToggle={(v) =>
              setDevice((d) => ({ ...d, relays: { ...d.relays, siren: v } }))
            }
          />

          <DynamicCard
            name="Relay Channel 2 (Ignition)"
            prefixIcon="bolt"
            toggle
            toggleValue={device.relays.ignition}
            onToggle={(v) =>
              setDevice((d) => ({ ...d, relays: { ...d.relays, ignition: v } }))
            }
          />

          <DynamicCard
            name="Link NFC Tag"
            prefixIcon="qrcode"
            suffixIcon="chevron-right"
            onPress={() =>
              router.navigate({
                pathname: ROUTES.MAP.DEVICE.NFC,
                params: { deviceId },
              })
            }
          />
        </TitleSection>

        {/* ALERTS */}
        <TitleSection
          title="Alerts"
          subtitle="Configure when and how you are notified."
        >
          {(['vibration', 'movement', 'tremors', 'lowBattery'] as const).map(
            (key) => (
              <DynamicCard
                key={key}
                name={
                  key === 'vibration'
                    ? 'Vibration Alerts'
                    : key === 'movement'
                    ? 'Movement Detection'
                    : key === 'tremors'
                    ? 'Repeated Tremors'
                    : 'Low Device Battery'
                }
                prefixIcon={
                  key === 'vibration'
                    ? 'exclamation-triangle'
                    : key === 'movement'
                    ? 'arrows'
                    : key === 'tremors'
                    ? 'warning'
                    : 'battery-quarter'
                }
                toggle
                toggleValue={device.alerts[key]}
                onToggle={(v) =>
                  setDevice((d) => ({
                    ...d,
                    alerts: { ...d.alerts, [key]: v },
                  }))
                }
              />
            )
          )}
        </TitleSection>

        {/* OVERRIDE / TESTING */}
        <TitleSection
          title="Override & Testing"
          subtitle="Manual testing and forced actions."
        >
          <DynamicCard
            name="Test Siren Relay"
            prefixIcon="bullhorn"
            toggle
            toggleValue={device.relays.siren}
            onToggle={async (v) => {
              setDevice((d) => ({ ...d, relays: { ...d.relays, siren: v } }));
              try {
                if (v) {
                  // await testRelay(deviceId, 'siren_on');
                } else {
                  // await testRelay(deviceId, 'siren_off');
                }
              } catch (e) {
                Alert.alert('Error', `Failed to test siren relay: ${e}`);
                setDevice((d) => ({
                  ...d,
                  relays: { ...d.relays, siren: !v },
                }));
              }
            }}
          />

          <DynamicCard
            name="Test Ignition Relay"
            prefixIcon="bolt"
            toggle
            toggleValue={device.relays.ignition}
            onToggle={async (v) => {
              setDevice((d) => ({
                ...d,
                relays: { ...d.relays, ignition: v },
              }));
              try {
                if (v) {
                  // await testRelay(deviceId, 'ignition_on');
                } else {
                  // await testRelay(deviceId, 'ignition_off');
                }
              } catch (e) {
                Alert.alert('Error', `Failed to test ignition relay: ${e}`);
                setDevice((d) => ({
                  ...d,
                  relays: { ...d.relays, ignition: !v },
                }));
              }
            }}
          />

          <DynamicCard
            name="Alarm Type"
            prefixIcon="exclamation-circle"
            suffixIcon="chevron-right"
            onPress={() => router.navigate(ROUTES.MAP.DEVICE.ALARM_TYPE)}
          />
        </TitleSection>

        {/* DANGER */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              flex: 1,
              height: 1,
              marginLeft: 12,
              marginRight: 12,
              marginBottom: 12,
              backgroundColor: textColor,
            }}
          />
        </View>
        <DynamicCard
          key={theme + 'unpair'}
          name="Unpair Device"
          prefixIcon="sign-out"
          prefixColor="#ff4d4f"
          onPress={() => console.warn('Unpair device')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
