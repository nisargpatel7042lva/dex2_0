import { useApp } from '@/src/context/AppContext';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';

export function AppNavigationGuard({ children }: { children: React.ReactNode }) {
  const { walletInfo } = useApp();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
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
  }, [walletInfo, segments, router]);

  return <>{children}</>;
} 