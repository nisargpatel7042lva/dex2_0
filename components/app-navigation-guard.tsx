import { useAuth } from '@/components/auth/auth-provider';
import { useApp } from '@/src/context/AppContext';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';

export function AppNavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { walletInfo } = useApp();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    const currentSegment = segments[0];
    
    // If not authenticated or no wallet, show sign-in
    if ((!isAuthenticated || !walletInfo) && currentSegment !== 'sign-in') {
      router.replace('/sign-in');
      return;
    }

    // If authenticated and has wallet, show main app
    if (isAuthenticated && walletInfo && currentSegment !== '(tabs)') {
      router.replace('/(tabs)');
      return;
    }
  }, [isAuthenticated, walletInfo, segments, router]);

  return <>{children}</>;
} 