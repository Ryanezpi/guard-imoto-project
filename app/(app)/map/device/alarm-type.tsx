import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import TitleSection from '@/components/ui/TitleSection';
import SegmentToggle from '@/components/ui/SegmentToggle';
import HelperBox from '@/components/ui/HelperBoxProps';
import Slider from '@react-native-community/slider';

export default function AlarmTypeScreen() {
  const { theme } = useTheme();
  const bgColor = theme === 'light' ? '#f0f0f0' : '#272727';

  const [frequency, setFrequency] = useState<'continuous' | 'intermittent'>(
    'continuous'
  );

  const [trigger, setTrigger] = useState<'automatic' | 'manual'>('automatic');

  const [alarmDelay, setAlarmDelay] = useState(5);
  const [tempDelay, setTempDelay] = useState(alarmDelay);
  const [showActionButtons, setShowActionButtons] = useState(false);

  const handleDelayChange = (value: number) => {
    setTempDelay(value);
    setShowActionButtons(value !== alarmDelay);
  };

  const handleSave = () => {
    setAlarmDelay(tempDelay);
    setShowActionButtons(false);
  };

  const handleCancel = () => {
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

          <Text
            style={{
              marginTop: 8,
              fontSize: 13,
              color: '#888',
            }}
          >
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
              { label: 'Automatic', value: 'automatic' },
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
                  <Button title="Cancel" onPress={handleCancel} />
                  <View style={{ width: 8 }} />
                  <Button title="Save" onPress={handleSave} />
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
