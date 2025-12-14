import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import DynamicCard from '@/components/ui/Card';
import TitleSection from '@/components/ui/TitleSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import HelperBox from '@/components/ui/HelperBoxProps';
import Slider from '@react-native-community/slider';

export default function DeviceBatterySettings({
  deviceColor,
  deviceId,
}: {
  deviceColor: string;
  deviceId: string;
}) {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [autoBattery, setAutoBattery] = useState(false);
  const [voltageLevel, setVoltageLevel] = useState(20); // default battery-saving threshold
  const [tempVoltage, setTempVoltage] = useState(voltageLevel);
  const [showActionButtons, setShowActionButtons] = useState(false);

  const handleSliderChange = (value: number) => {
    setTempVoltage(value);
    setShowActionButtons(value !== voltageLevel); // show save/cancel only if changed
  };

  const handleSave = () => {
    setVoltageLevel(tempVoltage);
    setShowActionButtons(false);
  };

  const handleCancel = () => {
    setTempVoltage(voltageLevel);
    setShowActionButtons(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: bgColor }}
      edges={['bottom', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TitleSection title="Battery Settings">
          {/* Auto Battery Saving Toggle */}
          <DynamicCard
            name="Enable Auto Battery Saving"
            prefixIcon="battery-half"
            toggle
            toggleValue={autoBattery}
            onToggle={setAutoBattery}
          />

          <HelperBox
            text={
              'GuardiMoto will automatically switch to battery-saving ' +
              "mode at the voltage chosen to preserve your device's battery. " +
              'Once the battery level rises above the chosen threshold, ' +
              'GuardiMoto will automatically return to normal mode.'
            }
          />

          {/* Slider for Voltage Threshold */}
          {autoBattery && (
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
                Battery-saving Threshold: {tempVoltage}%
              </Text>

              <Slider
                minimumValue={10}
                maximumValue={100}
                step={1}
                value={tempVoltage}
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
