import DynamicCard from '@/components/ui/Card';
import DevicePrefix from '@/components/ui/DevicePrefix';
import ConfirmModal from '@/components/ui/forms/ConfirmModal';
import TitleSection from '@/components/ui/TitleSection';
import { DEVICE_COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getDeviceTelemetrySummary,
  patchDeviceConfig,
  unlinkDevice,
} from '@/services/user.service';
import { router, useGlobalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TelemetryModal } from '@/components/ui/TelemetryModal';

type TelemetrySummary = {
  gps?: {
    lat: number;
    lng: number;
    accuracy: number | null;
    recorded_at: string;
  };
  gyro?: {
    x: number;
    y: number;
    z: number;
    recorded_at: string;
  };
  rfid?: {
    tag_uid: string;
    recorded_at: string;
  };
  detections_24h: number;
};

export type TelemetryType = 'gps' | 'gyro' | 'rfid' | 'detections' | null;

type DeviceState = {
  name: string;
  serial?: string;
  color: string;
  enabled: boolean;
  pubnub_channel?: string;
  sensors: {
    gyroscope: boolean;
    gps: boolean;
  };

  sms_alerts_enabled: boolean;
  rfid_alerts: boolean;
  gps_alerts: boolean;
  gyro_alerts: boolean;

  relays: {
    siren: {
      enabled: boolean;
      alarmType: 'continuous' | 'intermittent';
      triggerMode: 'manual' | 'auto';
      intervalSec: number | null;
      delaySec: number | null;
    };
    relay1_override: boolean;

    ignition: boolean;
    relay2_override: boolean;
  };
};

function mapApiDeviceToState(api: any): DeviceState {
  return {
    name: api.device_name ?? api.serial_number,
    serial: api.serial_number,
    color: api.device_color ?? '#E53935',
    enabled: api.paired,
    pubnub_channel: api.pubnub_channel ?? undefined,
    sensors: {
      gyroscope: api.gyroscope_enabled ?? false,
      gps: api.gps_enabled ?? false,
    },

    sms_alerts_enabled: api.sms_alerts_enabled ?? true,
    gps_alerts: api.gps_alerts ?? true,
    gyro_alerts: api.gyro_alerts ?? true,
    rfid_alerts: api.rfid_alerts ?? true,

    relays: {
      siren: {
        enabled: api.relay1_enabled ?? false,
        alarmType: api.relay1_alarm_type ?? 'continuous',
        triggerMode: api.relay1_trigger_mode ?? 'auto',
        intervalSec: api.relay1_interval_sec ?? null,
        delaySec: api.relay1_delay_sec ?? null,
      },
      relay1_override: api.relay1_override ?? false,

      ignition: api.relay2_enabled ?? false,
      relay2_override: api.relay2_override ?? false,
    },
  };
}

function mapStateToPatchConfig(state: DeviceState) {
  return {
    device_name: state.name,
    device_color: state.color,
    paired: state.enabled,

    // Sensors
    gyroscope_enabled: state.sensors.gyroscope,
    gps_enabled: state.sensors.gps,

    // Relay 1 (Siren)
    relay1_enabled: state.relays.siren.enabled,
    relay1_override: state.relays.relay1_override,
    relay1_alarm_type: state.relays.siren.enabled
      ? state.relays.siren.alarmType
      : null,
    relay1_interval_sec: state.relays.siren.enabled
      ? state.relays.siren.intervalSec
      : null,
    relay1_trigger_mode: state.relays.siren.enabled
      ? state.relays.siren.triggerMode
      : null,
    relay1_delay_sec: state.relays.siren.enabled
      ? state.relays.siren.delaySec
      : null,

    // Relay 2 (Ignition)
    relay2_enabled: state.relays.ignition,
    relay2_override: state.relays.relay2_override,

    sms_alerts_enabled: state.sms_alerts_enabled,
    gyro_alerts: state.gyro_alerts,
    gps_alerts: state.gps_alerts,
    rfid_alerts: state.rfid_alerts,
  };
}

export default function DeviceSettingsScreen() {
  const { showLoader, hideLoader } = useLoader();
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { refreshDevices } = useDevices();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id;

  const { devices } = useDevices();
  const [intervalSec] = useState(60);
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [draft, setDraft] = useState<DeviceState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);

  const updateDraft = (updater: (d: DeviceState) => DeviceState) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  };
  const [telemetryModal, setTelemetryModal] = useState<{
    type: 'gps' | 'gyro' | 'rfid' | 'detections' | null;
  }>({ type: null });

  const openTelemetryModal = (type: TelemetryType) => {
    setTelemetryModal({ type });
  };

  const loadTelemetry = useCallback(async () => {
    try {
      const res = await getDeviceTelemetrySummary(idToken!, deviceId!);
      setTelemetry(res || []);
    } catch (e) {
      console.error('[TELEMETRY]', e);
    }
  }, [deviceId, idToken]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        showLoader();
        await loadTelemetry();
      } finally {
        if (mounted) hideLoader();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [hideLoader, loadTelemetry, showLoader]);

  const openEditModal = () => {
    setDraft(structuredClone(device));
    setShowEditModal(true);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await loadTelemetry();
      await refreshDevices();
    } finally {
      setRefreshing(false);
    }
  };

  function diffPatch(
    prev: DeviceState,
    next: DeviceState
  ): Record<string, any> {
    const patch: Record<string, any> = {};

    const addIfChanged = (key: string, a: any, b: any) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        patch[key] = b;
      }
    };

    // Sensors
    addIfChanged(
      'gyroscope_enabled',
      prev.sensors.gyroscope,
      next.sensors.gyroscope
    );
    addIfChanged('gps_enabled', prev.sensors.gps, next.sensors.gps);

    // Alerts
    addIfChanged(
      'sms_alerts_enabled',
      prev.sms_alerts_enabled,
      next.sms_alerts_enabled
    );
    addIfChanged('gps_alerts', prev.gps_alerts, next.gps_alerts);
    addIfChanged('gyro_alerts', prev.gyro_alerts, next.gyro_alerts);
    addIfChanged('rfid_alerts', prev.rfid_alerts, next.rfid_alerts);

    // Relay 1
    addIfChanged(
      'relay1_enabled',
      prev.relays.siren.enabled,
      next.relays.siren.enabled
    );
    addIfChanged(
      'relay1_override',
      prev.relays.relay1_override,
      next.relays.relay1_override
    );

    if (next.relays.siren.enabled) {
      addIfChanged(
        'relay1_alarm_type',
        prev.relays.siren.alarmType,
        next.relays.siren.alarmType
      );
      addIfChanged(
        'relay1_interval_sec',
        prev.relays.siren.intervalSec,
        next.relays.siren.intervalSec
      );
      addIfChanged(
        'relay1_trigger_mode',
        prev.relays.siren.triggerMode,
        next.relays.siren.triggerMode
      );
      addIfChanged(
        'relay1_delay_sec',
        prev.relays.siren.delaySec,
        next.relays.siren.delaySec
      );
    }

    // Relay 2
    addIfChanged('relay2_enabled', prev.relays.ignition, next.relays.ignition);
    addIfChanged(
      'relay2_override',
      prev.relays.relay2_override,
      next.relays.relay2_override
    );

    return patch;
  }

  useEffect(() => {
    if (!devices || !deviceId) return;

    const apiDevice = devices.find((d) => d.device_id === deviceId);
    if (!apiDevice) return;

    const mapped = mapApiDeviceToState(apiDevice);
    setDevice(mapped);
    setDraft(mapped);
  }, [devices, deviceId]);

  const updateAndSync = (updater: (d: DeviceState) => DeviceState) => {
    setDevice((prev) => {
      if (!prev) return prev;

      const snapshot = structuredClone(prev);
      const next = updater(prev);

      const patch = diffPatch(snapshot, next);
      if (Object.keys(patch).length === 0) return next;

      (async () => {
        try {
          showLoader();
          await patchDeviceConfig(idToken!, deviceId!, patch).finally(
            () => hideLoader
          );
          await refreshDevices();
        } catch (e: any) {
          setDevice(snapshot);
          Alert.alert('Sync failed', e.message);
        }
      })();

      return next;
    });
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!idToken || !deviceId) return;

      try {
        await loadTelemetry();
        await refreshDevices();
        console.log('Interval device data Refreshed');
        // update device state here
      } catch (err) {
        console.error('Failed to fetch interval data', err);
      }
    }, intervalSec * 2000);

    return () => clearInterval(interval);
  }, [intervalSec, deviceId, idToken, refreshDevices, loadTelemetry]);

  if (!device || !draft) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text>Loading device…</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <TelemetryModal
        visible={!!telemetryModal.type}
        type={telemetryModal.type as TelemetryType}
        deviceId={deviceId!}
        idToken={idToken!}
        realtime={false}
        onClose={() => setTelemetryModal({ type: null })}
      />

      <ConfirmModal
        visible={showEditModal}
        title="Edit Device"
        onCancel={() => {
          setDraft(device);
          setShowEditModal(false);
        }}
        onConfirm={async () => {
          try {
            showLoader();
            const payload = mapStateToPatchConfig(draft);
            await patchDeviceConfig(idToken!, deviceId!, payload);
            await loadTelemetry();
            await refreshDevices().then(hideLoader);
            setDevice(draft);
            setShowEditModal(false);
          } catch (e: any) {
            hideLoader();
            Alert.alert('Update failed', e.message);
          } finally {
            hideLoader();
          }
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
          onChangeText={(v) => updateDraft((d) => ({ ...d, name: v }))}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
            color: theme === 'light' ? '#000' : '#fff',
          }}
        />
        <Text
          style={{
            fontSize: 14,
            marginBottom: 4,
            color: theme === 'light' ? '#555' : '#aaa',
          }}
        >
          Device Color
        </Text>
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
                onPress={() => updateDraft((d) => ({ ...d, color: c }))}
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
          onToggle={(v) => updateDraft((d) => ({ ...d, enabled: v }))}
        />
      </ConfirmModal>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === 'light' ? '#000' : '#fff'}
          />
        }
      >
        <TitleSection title="Sensor Data">
          {/* GPS */}
          <DynamicCard
            name="GPS"
            prefixIcon="map-marker"
            subText={
              telemetry?.gps
                ? `Last fix • ${new Date(telemetry.gps.recorded_at).toLocaleTimeString()}`
                : 'No data'
            }
            suffixText={
              telemetry?.gps?.accuracy
                ? `±${telemetry.gps.accuracy}m`
                : undefined
            }
            onPress={() => openTelemetryModal('gps')}
          />

          {/* Gyro */}
          <DynamicCard
            name="Gyroscope"
            prefixIcon="balance-scale"
            subText={
              telemetry?.gyro
                ? `Last movement • ${new Date(telemetry.gyro.recorded_at).toLocaleTimeString()}`
                : 'No data'
            }
            suffixText={
              telemetry?.gyro
                ? Math.sqrt(
                    telemetry.gyro.x ** 2 +
                      telemetry.gyro.y ** 2 +
                      telemetry.gyro.z ** 2
                  ).toFixed(2)
                : undefined
            }
            onPress={() => openTelemetryModal('gyro')}
          />

          {/* RFID */}
          <DynamicCard
            name="RFID"
            prefixIcon="qrcode"
            subText={
              telemetry?.rfid
                ? `Last scan • ${telemetry.rfid.tag_uid}`
                : 'No scans yet'
            }
            onPress={() => openTelemetryModal('rfid')}
          />

          {/* Alerts */}
          <DynamicCard
            name="Detections (24h)"
            prefixIcon="warning"
            subText={`${telemetry?.detections_24h ?? 0} events`}
            onPress={() => openTelemetryModal('detections')}
          />
        </TitleSection>

        {/* DEVICE SETTINGS */}
        <TitleSection title="Device Settings">
          <DynamicCard
            name={device.name + ' - ' + device.serial}
            nameTextBold
            subText={device.enabled ? 'Enabled' : 'Disabled'}
            subTextColor={device.enabled ? '#2fa500ff' : '#ff3b30ff'}
            prefixElement={<DevicePrefix color={device.color} />}
            suffixIcon="edit"
            onPress={openEditModal}
          />

          <DynamicCard
            name="Link NFC Tag"
            prefixIcon="qrcode"
            suffixIcon="chevron-right"
            onPress={() =>
              router.navigate({
                pathname: ROUTES.MAP.DEVICE.NFC,
                params: {
                  device_id: deviceId,
                  device_color: device.color,
                },
              })
            }
          />

          <DynamicCard
            name="Gyroscope Sensor"
            prefixIcon="balance-scale"
            toggle
            toggleValue={device.sensors.gyroscope}
            onToggle={(v) =>
              updateAndSync((d) => ({
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
              updateAndSync((d) => ({
                ...d,
                sensors: { ...d.sensors, gps: v },
              }))
            }
          />

          <DynamicCard
            name="Relay Channel 1 (Siren)"
            prefixIcon="bullhorn"
            toggle
            toggleValue={device.relays.siren.enabled}
            onToggle={(v) =>
              updateAndSync((d) => ({
                ...d,
                relays: {
                  ...d.relays,
                  siren: {
                    ...d.relays.siren,
                    enabled: v,
                  },
                },
              }))
            }
          />

          <DynamicCard
            name="Relay Channel 2 (Ignition)"
            prefixIcon="bolt"
            toggle
            toggleValue={device.relays.ignition}
            onToggle={(v) =>
              updateAndSync((d) => ({
                ...d,
                relays: { ...d.relays, ignition: v },
              }))
            }
          />
        </TitleSection>

        <TitleSection
          title="Alerts"
          subtitle="Configure when and how you are notified."
        >
          {(['gyro_alerts', 'gps_alerts', 'rfid_alerts'] as const).map(
            (key) => (
              <DynamicCard
                key={key}
                name={
                  key === 'rfid_alerts'
                    ? 'RFID Alerts'
                    : key === 'gps_alerts'
                      ? 'GPS Alerts'
                      : 'Gyro Alerts'
                }
                prefixIcon={
                  key === 'rfid_alerts'
                    ? 'warning'
                    : key === 'gps_alerts'
                      ? 'map'
                      : 'arrows'
                }
                toggle
                toggleValue={device[key]}
                onToggle={(v) =>
                  updateAndSync((d) => ({
                    ...d,
                    [key]: v, // directly update flat field
                  }))
                }
              />
            )
          )}
          <DynamicCard
            name="SMS Alerts"
            prefixIcon="envelope"
            toggle
            toggleValue={device.sms_alerts_enabled}
            onToggle={(v) =>
              updateAndSync((d) => ({ ...d, sms_alerts_enabled: v }))
            }
          />
        </TitleSection>

        {/* OVERRIDE / TESTING */}
        <TitleSection
          title="Override & Testing"
          subtitle="Manual testing and forced actions."
        >
          <DynamicCard
            name="Alarm Type"
            prefixIcon="exclamation-circle"
            suffixIcon="chevron-right"
            onPress={() =>
              router.navigate({
                pathname: ROUTES.MAP.DEVICE.ALARM_TYPE,
                params: {
                  device_id: deviceId,
                  device_color: device.color,
                },
              })
            }
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
          onPress={() => {
            showLoader();
            unlinkDevice(idToken!, deviceId!)
              .catch((e) => {
                Alert.alert('Error', `Failed to unpair device: ${e}`);
              })
              .then(() => {
                hideLoader();
                loadTelemetry();
                refreshDevices();
                router.back();
              });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
