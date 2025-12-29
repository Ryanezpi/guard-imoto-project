import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import HelperBox from '@/components/ui/HelperBoxProps';
import Slider from '@react-native-community/slider';
import { useAuth } from '@/context/AuthContext';
import { useDevices } from '@/context/DeviceContext';
import { patchDeviceConfig } from '@/services/user.service';
import { useGlobalSearchParams } from 'expo-router';

type BatteryState = {
  battery_saver_enabled: boolean;
  battery_saver_threshold: number;
};

export default function DeviceBatterySettings() {
  const { theme } = useTheme();
  const { idToken } = useAuth();
  const { devices, refreshDevices } = useDevices();
  const params = useGlobalSearchParams() as Record<string, string | undefined>;
  const deviceId = params.device_id;
  const deviceColor = params.device_color || '#E53935';

  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [batteryState, setBatteryState] = useState<BatteryState>({
    battery_saver_enabled: false,
    battery_saver_threshold: 20,
  });
  const [tempThreshold, setTempThreshold] = useState(20);
  const [showActionButtons, setShowActionButtons] = useState(false);

  // Initialize from devices context
  useEffect(() => {
    const apiDevice = devices.find((d) => d.device_id === deviceId);
    if (!apiDevice) return;

    setBatteryState({
      battery_saver_enabled: !!apiDevice.battery_saver_enabled,
      battery_saver_threshold: apiDevice.battery_saver_threshold ?? 20,
    });
    setTempThreshold(apiDevice.battery_saver_threshold ?? 20);
  }, [devices, deviceId]);

  const updateAndSync = async (
    updater: (state: BatteryState) => BatteryState
  ) => {
    setBatteryState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);

      (async () => {
        try {
          await patchDeviceConfig(idToken!, deviceId!, {
            battery_saver_enabled: next.battery_saver_enabled,
            battery_saver_threshold: next.battery_saver_threshold,
          });
          await refreshDevices();
        } catch (e: any) {
          Alert.alert(
            'Sync failed',
            e.message || 'Could not update battery settings.'
          );
          setBatteryState(prev);
        }
      })();

      return next;
    });
  };

  const handleSliderChange = (value: number) => {
    setTempThreshold(value);
    setShowActionButtons(value !== batteryState.battery_saver_threshold);
  };

  const handleSave = () => {
    updateAndSync((prev) => ({
      ...prev,
      battery_saver_threshold: tempThreshold,
    }));
    setShowActionButtons(false);
  };

  const handleCancel = () => {
    setTempThreshold(batteryState.battery_saver_threshold);
    setShowActionButtons(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TitleSection title="Battery Settings">
          <DynamicCard
            name="Enable Auto Battery Saving"
            prefixIcon="battery-half"
            toggle
            toggleValue={batteryState.battery_saver_enabled}
            onToggle={(v) =>
              updateAndSync((prev) => ({
                ...prev,
                battery_saver_enabled: v,
              }))
            }
          />

          <HelperBox
            text={
              'GuardiMoto will automatically switch to battery-saving ' +
              "mode at the voltage chosen to preserve your device's battery. " +
              'Once the battery level rises above the chosen threshold, ' +
              'GuardiMoto will automatically return to normal mode.'
            }
          />

          {batteryState.battery_saver_enabled && (
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
                Battery-saving Threshold: {tempThreshold}%
              </Text>

              <Slider
                minimumValue={10}
                maximumValue={100}
                step={1}
                value={tempThreshold}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={deviceColor}
                maximumTrackTintColor="#ccc"
                thumbTintColor={deviceColor}
              />

              {showActionButtons && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: 12,
                  }}
                >
                  <Button title="Cancel" onPress={handleCancel} />
                  <View style={{ width: 8 }} />
                  <Button title="Save" onPress={handleSave} />
                </View>
              )}
            </View>
          )}
        </TitleSection>
      </ScrollView>
    </SafeAreaView>
  );
}
