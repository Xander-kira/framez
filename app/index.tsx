import { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthProvider';
import { SplashScreen } from '../components/SplashScreen';

export default function Index() {
  const { session } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <Redirect href={session ? '/(app)' : '/(auth)/login'} />;
}
