import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '../context/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
