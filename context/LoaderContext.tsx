// LoaderContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoaderContextType {
  showLoader: () => void;
  hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType>({
  showLoader: () => {},
  hideLoader: () => {},
});

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);

  const showLoader = () => setVisible(true);
  const hideLoader = () => setVisible(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {visible && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </LoaderContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});
