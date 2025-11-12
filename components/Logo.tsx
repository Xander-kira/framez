import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ size = 'medium' }: LogoProps) {
  const sizes = {
    small: { container: 32, text: 18 },
    medium: { container: 48, text: 28 },
    large: { container: 80, text: 48 },
  };

  const currentSize = sizes[size];

  return (
    <View style={[styles.container, { width: currentSize.container, height: currentSize.container }]}>
      <Text style={[styles.text, { fontSize: currentSize.text }]}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
