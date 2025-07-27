import { useApp } from '@/src/context/AppContext';
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

export function AuthProvider({ children }: PropsWithChildren) {
  const { disconnectWallet, walletInfo } = useApp();

  const value: AuthState = useMemo(
    () => ({
      signIn: async () => {
        // Wallet is already connected via WalletService.connectWallet()
        // Just mark as authenticated
        console.log('User authenticated');
      },
      signOut: async () => await disconnectWallet(),
      isAuthenticated: walletInfo !== null,
      isLoading: false,
    }),
    [walletInfo, disconnectWallet],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
