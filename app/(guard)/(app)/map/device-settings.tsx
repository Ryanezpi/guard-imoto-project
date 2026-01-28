import DynamicCard from '@/components/ui/Card';
import { DeviceCard } from '@/components/ui/DeviceCard';
import ConfirmModal, {
  type AlertAction,
} from '@/components/ui/forms/ConfirmModal';
import TitleSection from '@/components/ui/TitleSection';
import HelperBox from '@/components/ui/HelperBoxProps';
import { DEVICE_COLORS } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { useLoader } from '@/context/LoaderContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getDeviceTelemetrySummary,
  getDeviceNFCs,
  getMyAlerts,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type VehicleType,
  type UpsertVehicleBody,
  patchDeviceConfig,
  unlinkDevice,
} from '@/services/user.service';
import { router, useGlobalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AuthTextField from '@/components/ui/forms/AuthTextField';

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

const VEHICLE_TYPES: VehicleType[] = [
  'motorbike',
  'motorcycle',
  'bike',
  'car',
  'scooter',
  'truck',
  'van',
  'other',
];

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
  const { idToken, user } = useAuth();
  const { refreshDevices } = useDevices();

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';
  const textColor = theme === 'light' ? '#000' : '#fff';
  const warningBg = theme === 'light' ? '#FEF3C7' : '#3A2E14';
  const warningText = theme === 'light' ? '#92400E' : '#FCD34D';
  const primaryColor = theme === 'light' ? '#9F0EA1' : '#C06BD6';
  const iconMuted = theme === 'light' ? '#6b7280' : '#9ca3af';
  const datePillBg = theme === 'light' ? '#e5e7eb' : '#2a2a2a';
  const datePillText = theme === 'light' ? '#374151' : '#d1d5db';

  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id;

  const { devices } = useDevices();
  const [intervalSec] = useState(60);
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [draft, setDraft] = useState<DeviceState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [nfcCount, setNfcCount] = useState<number | undefined>(undefined);
  const [nfcLoading, setNfcLoading] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [vehicleTypeModalVisible, setVehicleTypeModalVisible] = useState(false);
  const [vehicleDraft, setVehicleDraft] = useState<UpsertVehicleBody>({
    type: 'motorbike',
  });

  const updateDraft = (updater: (d: DeviceState) => DeviceState) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  };
  const [telemetryModal, setTelemetryModal] = useState<{
    type: 'gps' | 'gyro' | 'rfid' | 'detections' | null;
  }>({ type: null });
  const [alert, setAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    actions: AlertAction[];
  }>({ visible: false, actions: [] });
  const [relayConfirm, setRelayConfirm] = useState<{
    visible: boolean;
    channel: 1 | 2;
    nextValue: boolean;
  }>({ visible: false, channel: 1, nextValue: false });
  const [unpairConfirmVisible, setUnpairConfirmVisible] = useState(false);

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

  const requestRelayConfirm = useCallback(
    (channel: 1 | 2, nextValue: boolean) => {
      setRelayConfirm({ visible: true, channel, nextValue });
    },
    []
  );
  const closeRelayConfirm = useCallback(
    () => setRelayConfirm((prev) => ({ ...prev, visible: false })),
    []
  );
  const closeUnpairConfirm = useCallback(
    () => setUnpairConfirmVisible(false),
    []
  );

  const openTelemetryModal = (type: TelemetryType) => {
    setTelemetryModal({ type });
  };

  const loadTelemetry = useCallback(async () => {
    try {
      if (!idToken || !deviceId) return;
      const res = await getDeviceTelemetrySummary(idToken!, deviceId!);
      setTelemetry(res || []);
    } catch (e) {
      console.error('[TELEMETRY]', e);
    }
  }, [deviceId, idToken]);

  const loadAlerts = useCallback(async () => {
    try {
      if (!idToken || !deviceId) return;
      const res = await getMyAlerts(idToken);
      const unresolved =
        res?.alerts?.filter(
          (a: any) => a.device_id === deviceId && !a.resolved
        ) ?? [];
      setUnresolvedCount(unresolved.length);
    } catch (e) {
      console.error('[ALERTS]', e);
    }
  }, [deviceId, idToken]);

  const loadNfcCount = useCallback(async () => {
    try {
      if (!idToken || !deviceId) return;
      setNfcLoading(true);
      const res = await getDeviceNFCs(idToken, deviceId);
      setNfcCount(res?.length ?? 0);
    } catch (e) {
      console.error('[NFC]', e);
      setNfcCount(undefined);
    } finally {
      setNfcLoading(false);
    }
  }, [deviceId, idToken]);

  const isVehicleEmpty = useCallback((v: Vehicle | null) => {
    if (!v) return true;
    const hasAny =
      Boolean(v.nickname) ||
      Boolean(v.make) ||
      Boolean(v.model) ||
      Boolean(v.year) ||
      Boolean(v.color) ||
      Boolean(v.license_plate) ||
      Boolean(v.vin) ||
      Boolean(v.image_url) ||
      (v.type && v.type !== 'motorbike');
    return !hasAny;
  }, []);

  const loadVehicle = useCallback(async () => {
    try {
      if (!idToken || !deviceId) return;
      setVehicleLoading(true);
      const res = await getVehicle(idToken, deviceId);
      // Treat "empty" vehicles (all-null metadata) as unbound.
      setVehicle(isVehicleEmpty(res) ? null : (res as Vehicle));
    } catch (e) {
      console.error('[VEHICLE]', e);
      setVehicle(null);
    } finally {
      setVehicleLoading(false);
    }
  }, [deviceId, idToken, isVehicleEmpty]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        showLoader();
        await loadTelemetry();
        await loadAlerts();
        await loadNfcCount();
        await loadVehicle();
      } finally {
        if (mounted) hideLoader();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    hideLoader,
    loadAlerts,
    loadTelemetry,
    loadNfcCount,
    loadVehicle,
    showLoader,
  ]);

  const openEditModal = () => {
    setDraft(structuredClone(device));
    setShowEditModal(true);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await loadTelemetry();
      await loadAlerts();
      await loadNfcCount();
      await loadVehicle();
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
    let snapshot: DeviceState;
    let nextState: DeviceState;
    let patch: Record<string, any> = {};

    setDevice((prev) => {
      if (!prev) return prev;

      snapshot = structuredClone(prev);
      nextState = updater(prev);
      patch = diffPatch(snapshot, nextState);

      return nextState;
    });

    setTimeout(async () => {
      if (!Object.keys(patch).length) return;

      try {
        showLoader();
        await patchDeviceConfig(idToken!, deviceId!, patch);
        await refreshDevices();
      } catch (e: any) {
        setDevice(snapshot!);
        openAlert('Sync failed', e.message);
      } finally {
        hideLoader();
      }
    }, 0);
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

  const summaryDevice = {
    device_id: deviceId ?? '',
    device_name: device.name,
    serial_number: device.serial ?? '',
    device_color: device.color,
    paired: device.enabled,
    relay1_enabled: device.relays.siren.enabled,
    relay2_enabled: device.relays.ignition,
    gps_alerts: device.gps_alerts,
    gyro_alerts: device.gyro_alerts,
    rfid_alerts: device.rfid_alerts,
    sms_alerts_enabled: device.sms_alerts_enabled,
  };

  const renderSensorIcon = (
    icon: keyof typeof FontAwesome.glyphMap,
    color: string
  ) => (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FontAwesome name={icon} size={14} color={color} />
    </View>
  );

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }) + ` ${new Date(value).toLocaleTimeString()}`;

  const renderTimestampRow = (label: string, recordedAt?: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ color: iconMuted, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
      {recordedAt ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: datePillBg,
          }}
        >
          <Text
            style={{ color: datePillText, fontSize: 12, fontWeight: '600' }}
          >
            {formatDateTime(recordedAt)}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const openVehicleModal = () => {
    const current = vehicle;
    setVehicleDraft({
      type: current?.type ?? 'motorbike',
      nickname: current?.nickname ?? '',
      make: current?.make ?? '',
      model: current?.model ?? '',
      year: current?.year ?? undefined,
      color: current?.color ?? '',
      license_plate: current?.license_plate ?? '',
      vin: current?.vin ?? '',
      image_url: current?.image_url ?? '',
    });
    setVehicleModalVisible(true);
  };

  const sanitizeVehicleDraft = (
    draft: UpsertVehicleBody
  ): UpsertVehicleBody => {
    const cleaned: UpsertVehicleBody = {};
    const t = String(draft.type ?? 'motorbike') as VehicleType;
    cleaned.type = (VEHICLE_TYPES.includes(t) ? t : 'motorbike') as VehicleType;

    const trimOrNull = (v: unknown) => {
      const s = String(v ?? '').trim();
      return s.length ? s : null;
    };

    cleaned.nickname = trimOrNull(draft.nickname);
    cleaned.make = trimOrNull(draft.make);
    cleaned.model = trimOrNull(draft.model);
    cleaned.color = trimOrNull(draft.color);
    cleaned.license_plate = trimOrNull(draft.license_plate);
    cleaned.vin = trimOrNull(draft.vin);
    cleaned.image_url = trimOrNull(draft.image_url);

    if (
      draft.year === undefined ||
      draft.year === null ||
      draft.year === ('' as any)
    ) {
      cleaned.year = null;
    } else {
      const n = Number(draft.year);
      cleaned.year = Number.isFinite(n) ? Math.trunc(n) : null;
    }

    return cleaned;
  };

  const vehicleTypeLabel = (t?: VehicleType | null) => {
    const v = (t ?? 'motorbike') as string;
    const spaced = v.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };
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
            openAlert('Update failed', e.message);
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

      <ConfirmModal
        visible={relayConfirm.visible}
        title={`Confirm Relay Channel ${relayConfirm.channel}`}
        fullWidthActions={true}
        onCancel={closeRelayConfirm}
        onDismiss={closeRelayConfirm}
        actions={[
          { text: 'Cancel', variant: 'cancel', onPress: closeRelayConfirm },
          {
            text: relayConfirm.nextValue ? 'Enable' : 'Disable',
            variant: relayConfirm.nextValue ? 'primary' : 'destructive',
            onPress: () => {
              const { channel, nextValue } = relayConfirm;
              closeRelayConfirm();

              if (channel === 1) {
                updateAndSync((d) => ({
                  ...d,
                  relays: {
                    ...d.relays,
                    siren: { ...d.relays.siren, enabled: nextValue },
                  },
                }));
              } else {
                updateAndSync((d) => ({
                  ...d,
                  relays: { ...d.relays, ignition: nextValue },
                }));
              }
            },
          },
        ]}
      >
        <Text style={{ color: iconMuted, marginTop: 6, lineHeight: 18 }}>
          {relayConfirm.channel === 1
            ? 'Relay Channel 1 controls the siren output. Enabling it may activate the siren depending on your device configuration.'
            : 'Relay Channel 2 controls the ignition output. Enabling it may affect your vehicle ignition depending on wiring.'}
        </Text>
        <View style={{ marginTop: 10 }}>
          <HelperBox
            variant="warning"
            iconName="exclamation-triangle"
            text="To prevent accidental changes, please confirm before applying."
          />
        </View>
      </ConfirmModal>

      <ConfirmModal
        visible={vehicleModalVisible}
        title={vehicle ? 'Edit Vehicle' : 'Add Vehicle (Optional)'}
        onCancel={() => setVehicleModalVisible(false)}
        onDismiss={() => setVehicleModalVisible(false)}
        fullWidthActions={true}
        actions={[
          {
            text: 'Cancel',
            variant: 'cancel',
            onPress: () => setVehicleModalVisible(false),
          },
          ...(vehicle
            ? [
                {
                  text: 'Remove',
                  variant: 'destructive' as const,
                  onPress: async () => {
                    if (!idToken || !deviceId) return;
                    try {
                      showLoader();
                      await deleteVehicle(idToken, deviceId);
                      setVehicle(null);
                      setVehicleModalVisible(false);
                    } catch (e: any) {
                      openAlert(
                        'Remove failed',
                        e.message || 'Failed to delete vehicle.'
                      );
                    } finally {
                      hideLoader();
                    }
                  },
                },
              ]
            : []),
          {
            text: 'Save',
            variant: 'primary',
            onPress: async () => {
              if (!idToken || !deviceId) return;
              try {
                showLoader();
                const body = sanitizeVehicleDraft(vehicleDraft);

                if (body.year && (body.year < 1950 || body.year > 2100)) {
                  throw new Error('Year must be between 1950 and 2100.');
                }

                const saved = vehicle
                  ? await updateVehicle(idToken, deviceId, body)
                  : await createVehicle(idToken, deviceId, body);

                setVehicle(saved);
                setVehicleModalVisible(false);
              } catch (e: any) {
                openAlert(
                  'Save failed',
                  e.message || 'Failed to save vehicle.'
                );
              } finally {
                hideLoader();
              }
            },
          },
        ]}
      >
        <View style={{ marginTop: 8 }}>
          <HelperBox
            variant="warning"
            iconName="info-circle"
            text="Optional: Add vehicle details to personalize your device. This is not required for tracking."
          />

          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: iconMuted, fontSize: 13, fontWeight: '600' }}>
              Type
            </Text>
            <Pressable
              onPress={() => setVehicleTypeModalVisible(true)}
              style={{
                marginTop: 8,
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: theme === 'light' ? '#d1d5db' : '#3f3f46',
                paddingHorizontal: 14,
                backgroundColor: theme === 'light' ? '#ffffff' : '#272727',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{ color: textColor, fontSize: 16, fontWeight: '600' }}
              >
                {vehicleTypeLabel(vehicleDraft.type as VehicleType)}
              </Text>
              <FontAwesome
                name="chevron-down"
                size={12}
                color={theme === 'light' ? '#6b7280' : '#9ca3af'}
              />
            </Pressable>
          </View>
          <AuthTextField
            label="Nickname"
            placeholder="My Bike"
            value={String(vehicleDraft.nickname ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, nickname: v }))
            }
            autoCapitalize="words"
          />
          <AuthTextField
            label="Make"
            placeholder="Honda"
            value={String(vehicleDraft.make ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, make: v }))
            }
            autoCapitalize="words"
          />
          <AuthTextField
            label="Model"
            placeholder="Click 125i"
            value={String(vehicleDraft.model ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, model: v }))
            }
            autoCapitalize="words"
          />
          <AuthTextField
            label="Year"
            placeholder="2024"
            value={
              vehicleDraft.year === null || vehicleDraft.year === undefined
                ? ''
                : String(vehicleDraft.year)
            }
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({
                ...prev,
                year: v ? Number(v) : undefined,
              }))
            }
            keyboardType="number-pad"
            autoCapitalize="none"
          />
          <AuthTextField
            label="Color"
            placeholder="Black"
            value={String(vehicleDraft.color ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, color: v }))
            }
            autoCapitalize="words"
          />
          <AuthTextField
            label="License Plate"
            placeholder="ABC-1234"
            value={String(vehicleDraft.license_plate ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, license_plate: v }))
            }
            autoCapitalize="characters"
          />
          <AuthTextField
            label="VIN"
            placeholder="(optional)"
            value={String(vehicleDraft.vin ?? '')}
            onChangeText={(v) =>
              setVehicleDraft((prev) => ({ ...prev, vin: v }))
            }
            autoCapitalize="characters"
          />
        </View>
      </ConfirmModal>

      <ConfirmModal
        visible={vehicleTypeModalVisible}
        title="Select Vehicle Type"
        onCancel={() => setVehicleTypeModalVisible(false)}
        onDismiss={() => setVehicleTypeModalVisible(false)}
        fullWidthActions={true}
        actions={[
          ...VEHICLE_TYPES.map((t) => ({
            text: vehicleTypeLabel(t),
            variant: (t === vehicleDraft.type
              ? 'primary'
              : 'default') as AlertAction['variant'],
            onPress: () => {
              setVehicleDraft((prev) => ({ ...prev, type: t }));
              setVehicleTypeModalVisible(false);
            },
          })),
          {
            text: 'Cancel',
            variant: 'cancel' as AlertAction['variant'],
            onPress: () => setVehicleTypeModalVisible(false),
          },
        ]}
      >
        <Text style={{ color: iconMuted, marginTop: 6, lineHeight: 18 }}>
          Type is stored in lowercase for the API but displayed in sentence case.
        </Text>
      </ConfirmModal>

      <ConfirmModal
        visible={unpairConfirmVisible}
        title="Unpair device?"
        onCancel={closeUnpairConfirm}
        onDismiss={closeUnpairConfirm}
        fullWidthActions={true}
        actions={[
          { text: 'Cancel', variant: 'cancel', onPress: closeUnpairConfirm },
          {
            text: 'Unpair',
            variant: 'destructive',
            onPress: async () => {
              if (!idToken || !deviceId) return;
              closeUnpairConfirm();
              try {
                showLoader();
                await unlinkDevice(idToken, deviceId);
                await loadTelemetry();
                await refreshDevices();
                router.back();
              } catch (e: any) {
                openAlert(
                  'Unpair failed',
                  e?.message || 'Failed to unpair device.'
                );
              } finally {
                hideLoader();
              }
            },
          },
        ]}
      >
        <HelperBox
          variant="warning"
          iconName="exclamation-triangle"
          text="This is a destructive action. The device will be reset to a system-owned/unpaired state."
        />
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: iconMuted, fontWeight: '700' }}>
            Device: {device?.name ?? '—'}
          </Text>
          <Text style={{ color: iconMuted, marginTop: 2 }}>
            Serial: {device?.serial ?? '—'}
          </Text>
        </View>
      </ConfirmModal>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      >
        <TitleSection
          title="Device Summary"
          subtitle="Quick overview of status, relays, alerts, and linked NFC tags."
        >
          <DeviceCard
            device={summaryDevice}
            disablePress
            unresolvedCount={unresolvedCount}
            nfcCount={nfcLoading ? undefined : nfcCount}
            showEditButton
            onEditPress={openEditModal}
          />
        </TitleSection>

        <TitleSection
          title="Vehicle (Optional)"
          subtitle="Optional: add vehicle details to personalize this device."
        >
          {vehicleLoading ? (
            <View
              style={{
                backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme === 'light' ? '#e5e7eb' : '#333',
                padding: 14,
              }}
            >
              <Text style={{ color: iconMuted, fontWeight: '700' }}>
                Loading vehicle…
              </Text>
            </View>
          ) : vehicle ? (
            <View
              style={{
                backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme === 'light' ? '#e5e7eb' : '#333',
                padding: 14,
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
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      color: textColor,
                      fontWeight: '800',
                      fontSize: 15,
                    }}
                    numberOfLines={1}
                  >
                    {vehicle.nickname ||
                      [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
                      'Vehicle'}
                  </Text>
                  <Text
                    style={{
                      color: iconMuted,
                      fontSize: 12,
                      fontWeight: '600',
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {vehicle.type}
                    {vehicle.year ? ` • ${vehicle.year}` : ''}
                    {vehicle.license_plate ? ` • ${vehicle.license_plate}` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={openVehicleModal}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: primaryColor,
                  }}
                >
                  <Text style={{ color: primaryColor, fontWeight: '800' }}>
                    Edit
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <HelperBox
                variant="warning"
                iconName="info-circle"
                text="Optional: Add vehicle details (type, make, plate) to personalize your device."
              />
              <DynamicCard
                name="Add Vehicle"
                prefixIcon="car"
                suffixIcon="chevron-right"
                onPress={openVehicleModal}
              />
            </View>
          )}
        </TitleSection>

        <TitleSection
          title="Sensor Data"
          subtitle="Latest readings and detections. Tap a row to view history."
        >
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: iconMuted, fontSize: 12, lineHeight: 16 }}>
              GPS shows last known location and accuracy. Gyro shows motion
              spikes (higher means stronger impact). RFID shows last scanned tag
              UID.
            </Text>
          </View>
          {/* GPS */}
          <DynamicCard
            name="GPS"
            prefixElement={renderSensorIcon('map-marker', primaryColor)}
            subTextElement={renderTimestampRow(
              'Last fix',
              telemetry?.gps?.recorded_at
            )}
            suffixElement={
              telemetry?.gps ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: `${primaryColor}22`,
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: primaryColor,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {telemetry.gps.accuracy
                      ? `±${telemetry.gps.accuracy}m`
                      : `${telemetry.gps.lat.toFixed(3)}, ${telemetry.gps.lng.toFixed(3)}`}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      theme === 'light' ? '#ef444422' : '#ef444433',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    No Fix
                  </Text>
                </View>
              )
            }
            onPress={() => openTelemetryModal('gps')}
          />

          {/* Gyro */}
          <DynamicCard
            name="Gyroscope"
            prefixElement={renderSensorIcon('bullseye', '#E53935')}
            subTextElement={renderTimestampRow(
              'Last movement',
              telemetry?.gyro?.recorded_at
            )}
            suffixElement={
              telemetry?.gyro ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: '#E5393522',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#E53935',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {Math.sqrt(
                      telemetry.gyro.x ** 2 +
                        telemetry.gyro.y ** 2 +
                        telemetry.gyro.z ** 2
                    ).toFixed(2)}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      theme === 'light' ? '#ef444422' : '#ef444433',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    No Data
                  </Text>
                </View>
              )
            }
            onPress={() => openTelemetryModal('gyro')}
          />

          {/* RFID */}
          <DynamicCard
            name="RFID"
            prefixElement={renderSensorIcon('id-card', '#8E24AA')}
            subTextElement={renderTimestampRow(
              'Last scan',
              telemetry?.rfid?.recorded_at
            )}
            suffixElement={
              telemetry?.rfid ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: '#8E24AA22',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#8E24AA',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {telemetry.rfid.tag_uid}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      theme === 'light' ? '#ef444422' : '#ef444433',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    No Scan
                  </Text>
                </View>
              )
            }
            onPress={() => openTelemetryModal('rfid')}
          />

          {/* Alerts */}
          <DynamicCard
            name="Detections (24h)"
            prefixElement={renderSensorIcon('bell', primaryColor)}
            subText={`${telemetry?.detections_24h ?? 0} events`}
            suffixElement={
              unresolvedCount > 0 ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor:
                      theme === 'light' ? '#ef444422' : '#ef444433',
                    marginRight: 6,
                  }}
                >
                  <Text
                    style={{
                      color: '#ef4444',
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {unresolvedCount} unresolved
                  </Text>
                </View>
              ) : (
                <Text style={{ color: iconMuted, fontSize: 12 }}>
                  No unresolved
                </Text>
              )
            }
            onPress={() => openTelemetryModal('detections')}
          />
        </TitleSection>

        {/* DEVICE SETTINGS */}
        <TitleSection
          title="Device Settings"
          subtitle="Core configuration for sensors, relays, and NFC linking."
        >
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
            onToggle={(v) => requestRelayConfirm(1, v)}
          />

          <DynamicCard
            name="Relay Channel 2 (Ignition)"
            prefixIcon="bolt"
            toggle
            toggleValue={device.relays.ignition}
            onToggle={(v) => requestRelayConfirm(2, v)}
          />
        </TitleSection>

        <TitleSection
          title="Alerts"
          subtitle="Choose which events create alerts. Requires notifications enabled."
        >
          {!user?.notifications_enabled ? (
            <View
              style={{
                backgroundColor: warningBg,
                padding: 12,
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: warningText, fontWeight: '700' }}>
                Notifications are disabled
              </Text>
              <Text style={{ color: warningText, marginTop: 4 }}>
                Alerts are hidden. Enable notifications to receive device alerts
                and configure alert settings.
              </Text>
              <View style={{ marginTop: 10 }}>
                <DynamicCard
                  name="Enable Notifications"
                  prefixIcon="bell"
                  suffixIcon="chevron-right"
                  onPress={() => router.navigate(ROUTES.APP.SETTINGS)}
                />
              </View>
            </View>
          ) : (
            <>
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
            </>
          )}
        </TitleSection>

        {/* OVERRIDE / TESTING */}
        <TitleSection
          title="Alarm Settings"
          subtitle="Siren behavior configuration for relay channel 1."
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
          onPress={() => setUnpairConfirmVisible(true)}
        />
      </ScrollView>

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
