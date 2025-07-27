import { useApp } from '@/src/context/AppContext';
import { useMutation } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Context = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('useAuth must be wrapped in a <AuthProvider />');
  }

  return value;
}

function useSignInMutation() {
  const { connectWallet } = useApp();

  return useMutation({
    mutationFn: async () => {
      await connectWallet();
    },
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { disconnectWallet, walletInfo } = useApp();
  const signInMutation = useSignInMutation();

  const value: AuthState = useMemo(
    () => ({
      signIn: async () => await signInMutation.mutateAsync(),
      signOut: async () => await disconnectWallet(),
      isAuthenticated: walletInfo !== null,
      isLoading: signInMutation.isPending,
    }),
    [walletInfo, disconnectWallet, signInMutation],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
