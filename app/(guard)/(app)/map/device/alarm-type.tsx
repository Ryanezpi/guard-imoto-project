import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import TitleSection from '@/components/ui/TitleSection';
import SegmentToggle from '@/components/ui/SegmentToggle';
import HelperBox from '@/components/ui/HelperBoxProps';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/context/AuthContext';
import { useGlobalSearchParams } from 'expo-router';
import {
  patchDeviceAlarm,
  type AlarmConfigBody,
} from '@/services/user.service';
import { useDevices } from '@/context/DeviceContext';

export default function AlarmTypeScreen() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id ?? '';
  const { refreshDevices } = useDevices();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [frequency, setFrequency] = useState<'continuous' | 'intermittent'>(
    'continuous'
  );
  const [trigger, setTrigger] = useState<'auto' | 'manual'>('auto');
  const [alarmDelay, setAlarmDelay] = useState(5);
  const [tempDelay, setTempDelay] = useState(alarmDelay);
  const [saving, setSaving] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const { devices } = useDevices();
  const device = devices.find((d) => d.device_id === deviceId);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!device || initialized) return;

    console.log('⚡ initializing alarm state from device:', device);

    setFrequency(device.relay1_alarm_type ?? 'continuous');
    setTrigger(device.relay1_trigger_mode ?? 'auto');
    setAlarmDelay(device.relay1_delay_sec ?? 5);
    setTempDelay(device.relay1_delay_sec ?? 5);

    setInitialized(true);
  }, [device, initialized]);

  const updateAlarmConfig = useCallback(
    async (config: AlarmConfigBody) => {
      if (!idToken || !deviceId) return;
      console.log('🔄 Updating alarm config:', config);

      try {
        setSaving(true);
        await patchDeviceAlarm(idToken, deviceId, config);
        console.log('✅ Patch successful, refreshing devices…');
        await refreshDevices(); // <--- ensure global state is up-to-date
      } catch (e: any) {
        console.error('❌ Patch error:', e);
        Alert.alert(
          'Error',
          e.message || 'Failed to update alarm configuration.'
        );
      } finally {
        setSaving(false);
      }
    },
    [idToken, deviceId, refreshDevices]
  );

  useEffect(() => {
    if (!initialized) return; // wait until device state loaded
    console.log('⚡ useEffect fired', { frequency, trigger, alarmDelay });

    const body: AlarmConfigBody = {
      relay1_alarm_type: frequency,
      relay1_interval_sec: frequency === 'intermittent' ? 3 : null,
      relay1_trigger_mode: trigger,
      relay1_delay_sec: trigger === 'manual' ? alarmDelay : null,
    };

    updateAlarmConfig(body);
  }, [frequency, trigger, alarmDelay, updateAlarmConfig, initialized]);

  const handleDelayChange = (value: number) => {
    setTempDelay(value);
    setShowActionButtons(value !== alarmDelay);
  };

  const handleSaveDelay = async () => {
    setAlarmDelay(tempDelay);
    setShowActionButtons(false);

    const body: AlarmConfigBody = {
      relay1_alarm_type: frequency,
      relay1_interval_sec: frequency === 'intermittent' ? 3 : null,
      relay1_trigger_mode: trigger,
      relay1_delay_sec: tempDelay,
    };

    await updateAlarmConfig(body);
  };

  const handleCancelDelay = () => {
    setTempDelay(alarmDelay);
    setShowActionButtons(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <View style={{ padding: 16 }}>
        {/* ALERT FREQUENCY */}
        <TitleSection
          title="Alert Frequency"
          subtitle="Choose the ringing mode of your siren."
        >
          <SegmentToggle
            value={frequency}
            onChange={setFrequency}
            options={[
              { label: 'Continuous', value: 'continuous' },
              { label: 'Intermittent', value: 'intermittent' },
            ]}
          />
          <Text style={{ marginTop: 8, fontSize: 13, color: '#888' }}>
            {frequency === 'continuous'
              ? 'Siren will ring continuously without stopping.'
              : 'Siren rings every 3-5 seconds at intervals.'}
          </Text>
        </TitleSection>

        {/* ALERT TRIGGER */}
        <TitleSection
          title="Alert Trigger"
          subtitle="Choose how the siren is activated."
        >
          <SegmentToggle
            value={trigger}
            onChange={setTrigger}
            options={[
              { label: 'Automatic', value: 'auto' },
              { label: 'Manual', value: 'manual' },
            ]}
          />

          {trigger === 'manual' && (
            <View
              style={{
                backgroundColor: theme === 'light' ? '#fff' : '#1f1f1f',
                padding: 16,
                borderRadius: 8,
                minHeight: 72,
                elevation: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                marginVertical: 6,
                overflow: 'hidden',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 8,
                  color: theme === 'light' ? '#000' : '#fff',
                }}
              >
                Alarm Delay: {tempDelay}s
              </Text>

              <Slider
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={tempDelay}
                onValueChange={handleDelayChange}
                minimumTrackTintColor="#4e8cff"
                maximumTrackTintColor="#ccc"
                thumbTintColor="#4e8cff"
              />

              {showActionButtons && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 12,
                  }}
                >
                  <Button title="Cancel" onPress={handleCancelDelay} />
                  <View style={{ width: 8 }} />
                  <Button
                    title={saving ? 'Saving...' : 'Save'}
                    onPress={handleSaveDelay}
                    disabled={saving}
                  />
                </View>
              )}
            </View>
          )}
        </TitleSection>

        {/* HELPER */}
        <HelperBox text="Activate the anti-theft siren if the motorcycle is touched by a stranger." />
      </View>
    </SafeAreaView>
  );
}
