import { useApp } from '@/src/context/AppContext';
import { useRouter, useSegments } from 'expo-router';
import React, { useState, useEffect } from 'react';

export function AppNavigationGuard({ children }: { children: React.ReactNode }) {
  const { walletInfo, servicesInitialized } = useApp();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for services to be initialized before allowing navigation
    if (servicesInitialized) {
      setIsReady(true);
    }
  }, [servicesInitialized]);

  React.useEffect(() => {
    // Only navigate if services are initialized and app is ready
    if (!isReady) return;

    const currentSegment = segments[0];
    
    // If no wallet connected, show sign-in
    if (!walletInfo && currentSegment !== 'sign-in') {
      router.replace('/sign-in');
      return;
    }

    // If wallet is connected, show main app
    if (walletInfo && currentSegment !== '(tabs)') {
      router.replace('/(tabs)');
      return;
    }
  }, [walletInfo, segments, router, isReady]);

  // Don't render children until ready
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
} 