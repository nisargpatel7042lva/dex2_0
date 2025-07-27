import { Connection, clusterApiUrl } from '@solana/web3.js';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { DEXService } from '../services/DEXService';
import { Token2022Service } from '../services/Token2022Service';
import { WalletInfo, WalletService } from '../services/WalletService';

interface AppContextType {
  // Services
  walletService: WalletService;
  token2022Service: Token2022Service;
  dexService: DEXService;
  
  // State
  walletInfo: WalletInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connectWallet: (privateKey?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  requestAirdrop: (amount?: number) => Promise<void>;
  clearError: () => void;
  
  // Connection
  connection: Connection;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [connection] = useState(() => new Connection(clusterApiUrl('devnet')));
  const [walletService] = useState(() => new WalletService(connection));
  const [token2022Service] = useState(() => new Token2022Service(connection));
  const [dexService] = useState(() => new DEXService(connection));
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (privateKey?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const info = await walletService.connectWallet(privateKey);
      setWalletInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await walletService.disconnectWallet();
      setWalletInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
      console.error('Error disconnecting wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAirdrop = async (amount: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const signature = await walletService.requestAirdrop(amount);
      console.log('Airdrop successful:', signature);
      
      // Update wallet info
      const updatedInfo = await walletService.getWalletInfo();
      if (updatedInfo) {
        setWalletInfo(updatedInfo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request airdrop');
      console.error('Error requesting airdrop:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Update wallet info periodically
  useEffect(() => {
    if (!walletInfo) return;

    const interval = setInterval(async () => {
      try {
        const updatedInfo = await walletService.getWalletInfo();
        if (updatedInfo) {
          setWalletInfo(updatedInfo);
        }
      } catch (err) {
        console.error('Error updating wallet info:', err);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [walletInfo, walletService]);

  const value: AppContextType = {
    walletService,
    token2022Service,
    dexService,
    walletInfo,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    clearError,
    connection,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 