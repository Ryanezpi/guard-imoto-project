// import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';

const CustomDeviceMarker = ({
  device,
  onPress,
}: {
  device: any;
  onPress: () => void;
}) => {
  // fallback color or deterministic color
  // const color = device.device_color || '#E53935';

  return (
    <Marker
      coordinate={{
        latitude: parseFloat(device.latest_lat),
        longitude: parseFloat(device.latest_lng),
      }}
      onPress={onPress}
    />
  );
};

// const styles = StyleSheet.create({
//   markerContainer: {
//     padding: 6,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     minWidth: 36,
//     minHeight: 36,
//   },
//   markerText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 14,
//   },
// });

export default CustomDeviceMarker;
