import { PublicKey } from '@solana/web3.js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Token2022Service } from '../services/Token2022Service';
import { WalletInfo, WalletService } from '../services/WalletService';

export interface Token2022Mint {
  mint: PublicKey;
  authority: PublicKey;
  supply: number;
  decimals: number;
  transferHookEnabled: boolean;
  confidentialTransferEnabled: boolean;
}

export interface Token2022Account {
  account: PublicKey;
  mint: PublicKey;
  owner: PublicKey;
  balance: number;
}

export interface AppContextType {
  // Wallet
  walletInfo: WalletInfo | null;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  requestAirdrop: (amount: number) => Promise<void>;
  
  // Token-2022
  token2022Mints: Token2022Mint[];
  createToken2022Mint: (decimals: number, supply: number) => Promise<PublicKey>;
  enableConfidentialTransfers: (mint: PublicKey) => Promise<void>;
  performConfidentialTransfer: (from: PublicKey, to: PublicKey, amount: number) => Promise<void>;
  setMetadataPointer: (mint: PublicKey, pointer: PublicKey) => Promise<void>;
  
  // Services
  walletService: WalletService;
  token2022Service: Token2022Service | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token2022Mints, setToken2022Mints] = useState<Token2022Mint[]>([]);
  const [token2022Service, setToken2022Service] = useState<Token2022Service | null>(null);

  const walletService = new WalletService();

  useEffect(() => {
    // Initialize Token2022Service when wallet is connected
    if (walletInfo) {
      const service = new Token2022Service(walletService.getConnection());
      setToken2022Service(service);
    }
  }, [walletInfo]);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const walletInfo = await walletService.connectWallet();
      setWalletInfo(walletInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await walletService.disconnectWallet();
      setWalletInfo(null);
      setToken2022Mints([]);
      setToken2022Service(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
      console.error('Error disconnecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestAirdrop = async (amount: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await walletService.requestAirdrop(amount);
      
      // Refresh balance
      const newBalance = await walletService.getSOLBalance();
      setWalletInfo(prev => prev ? { ...prev, balance: newBalance } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request airdrop');
      console.error('Error requesting airdrop:', err);
    } finally {
      setLoading(false);
    }
  };

  const createToken2022Mint = async (decimals: number, supply: number): Promise<PublicKey> => {
    // Placeholder implementation - in real app, this would use the Token2022Service
    console.log('Creating Token-2022 mint with decimals:', decimals, 'supply:', supply);
    
    // For now, return a mock public key
    const mockMint = new PublicKey('11111111111111111111111111111111');
    
    const newMint: Token2022Mint = {
      mint: mockMint,
      authority: walletInfo?.publicKey || new PublicKey('11111111111111111111111111111111'),
      supply,
      decimals,
      transferHookEnabled: false,
      confidentialTransferEnabled: false,
    };
    
    setToken2022Mints(prev => [...prev, newMint]);
    return mockMint;
  };

  const enableConfidentialTransfers = async (mint: PublicKey): Promise<void> => {
    // Placeholder implementation
    console.log('Enabling confidential transfers for mint:', mint.toString());
    
    setToken2022Mints(prev => 
      prev.map(m => 
        m.mint.equals(mint) 
          ? { ...m, confidentialTransferEnabled: true }
          : m
      )
    );
  };

  const performConfidentialTransfer = async (from: PublicKey, to: PublicKey, amount: number): Promise<void> => {
    // Placeholder implementation
    console.log('Performing confidential transfer from:', from.toString(), 'to:', to.toString(), 'amount:', amount);
  };

  const setMetadataPointer = async (mint: PublicKey, pointer: PublicKey): Promise<void> => {
    // Placeholder implementation
    console.log('Setting metadata pointer for mint:', mint.toString(), 'pointer:', pointer.toString());
  };

  const value: AppContextType = {
    walletInfo,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    token2022Mints,
    createToken2022Mint,
    enableConfidentialTransfers,
    performConfidentialTransfer,
    setMetadataPointer,
    walletService,
    token2022Service,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 