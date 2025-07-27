import { DEXService } from '@/src/services/DEXService';
import { Token2022Service } from '@/src/services/Token2022Service';
import { WalletService } from '@/src/services/WalletService';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface WalletInfo {
  publicKey: PublicKey;
  balance: number;
  connected: boolean;
}

export interface TokenBalance {
  mint: PublicKey;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price?: number;
  value?: number;
  transferHookProgramId?: PublicKey | null;
  confidentialTransferEnabled?: boolean;
  metadataPointer?: any;
}

export interface Token2022MintInfo {
  mint: PublicKey;
  decimals: number;
  supply: bigint;
  mintAuthority: PublicKey | null;
  freezeAuthority: PublicKey | null;
  transferHookProgramId: PublicKey | null;
  confidentialTransferMint: any | null;
  metadataPointer: any | null;
}

interface AppContextType {
  // Wallet
  walletInfo: WalletInfo | null;
  connectWallet: (privateKey?: string) => Promise<void>;
  disconnectWallet: () => void;
  requestAirdrop: (amount: number) => Promise<void>;
  
  // Services
  walletService: WalletService | null;
  dexService: DEXService | null;
  token2022Service: Token2022Service | null;
  
  // Token-2022 specific
  token2022Mints: Token2022MintInfo[];
  createToken2022Mint: (decimals: number, transferHookProgramId?: PublicKey) => Promise<PublicKey>;
  enableConfidentialTransfers: (mint: PublicKey, account: PublicKey) => Promise<void>;
  performConfidentialTransfer: (source: PublicKey, destination: PublicKey, amount: bigint, mint: PublicKey) => Promise<void>;
  setMetadataPointer: (mint: PublicKey, metadataPointer: any) => Promise<void>;
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletService, setWalletService] = useState<WalletService | null>(null);
  const [dexService, setDexService] = useState<DEXService | null>(null);
  const [token2022Service, setToken2022Service] = useState<Token2022Service | null>(null);
  const [token2022Mints, setToken2022Mints] = useState<Token2022MintInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize services
  useEffect(() => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    const wallet = new WalletService(connection);
    const dex = new DEXService(connection);
    const token2022 = new Token2022Service(connection);
    
    setWalletService(wallet);
    setDexService(dex);
    setToken2022Service(token2022);
  }, []);

  const connectWallet = async (privateKey?: string) => {
    if (!walletService) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const wallet = privateKey 
        ? await walletService.connectWithPrivateKey(privateKey)
        : await walletService.connect();
      
      const balance = await walletService.getBalance(wallet.publicKey);
      
      setWalletInfo({
        publicKey: wallet.publicKey,
        balance,
        connected: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
  };

  const requestAirdrop = async (amount: number) => {
    if (!walletService || !walletInfo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await walletService.requestAirdrop(walletInfo.publicKey, amount);
      
      // Refresh balance
      const newBalance = await walletService.getBalance(walletInfo.publicKey);
      setWalletInfo(prev => prev ? { ...prev, balance: newBalance } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request airdrop');
      console.error('Error requesting airdrop:', err);
    } finally {
      setLoading(false);
    }
  };

  const createToken2022Mint = async (decimals: number, transferHookProgramId?: PublicKey): Promise<PublicKey> => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Services not initialized or wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Generate a new keypair for the mint
      const mintKeypair = Keypair.generate();
      
      // Create a temporary keypair for the payer (in production, use the actual wallet)
      const payerKeypair = Keypair.generate();
      
      // Initialize the mint
      await token2022Service.initializeMint(
        payerKeypair,
        mintKeypair,
        decimals,
        walletInfo.publicKey,
        walletInfo.publicKey, // freeze authority
        transferHookProgramId || null,
        null, // confidential transfer mint
        null, // metadata pointer
      );
      
      const mintInfo: Token2022MintInfo = {
        mint: mintKeypair.publicKey,
        decimals,
        supply: BigInt(0),
        mintAuthority: walletInfo.publicKey,
        freezeAuthority: walletInfo.publicKey,
        transferHookProgramId: transferHookProgramId || null,
        confidentialTransferMint: null,
        metadataPointer: null,
      };
      
      setToken2022Mints(prev => [...prev, mintInfo]);
      
      return mintKeypair.publicKey;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create Token-2022 mint';
      setError(errorMsg);
      console.error('Error creating Token-2022 mint:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const enableConfidentialTransfers = async (mint: PublicKey, account: PublicKey) => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Services not initialized or wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a temporary keypair for the payer (in production, use the actual wallet)
      const payerKeypair = Keypair.generate();
      const authorityKeypair = Keypair.generate();
      
      // Mock confidential transfer mint configuration
      const confidentialTransferMint = {
        authority: walletInfo.publicKey,
        auto_approve_new_accounts: true,
        auditor_encryption_key: null,
      };
      
      await token2022Service.enableConfidentialTransfers(
        payerKeypair,
        account,
        mint,
        authorityKeypair,
        confidentialTransferMint as any,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to enable confidential transfers';
      setError(errorMsg);
      console.error('Error enabling confidential transfers:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const performConfidentialTransfer = async (source: PublicKey, destination: PublicKey, amount: bigint, mint: PublicKey) => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Services not initialized or wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create temporary keypairs (in production, use the actual wallet)
      const payerKeypair = Keypair.generate();
      const authorityKeypair = Keypair.generate();
      
      await token2022Service.confidentialTransfer(
        payerKeypair,
        source,
        destination,
        authorityKeypair,
        amount,
        9, // decimals
        mint,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to perform confidential transfer';
      setError(errorMsg);
      console.error('Error performing confidential transfer:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const setMetadataPointer = async (mint: PublicKey, metadataPointer: any) => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Services not initialized or wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create temporary keypairs (in production, use the actual wallet)
      const payerKeypair = Keypair.generate();
      const authorityKeypair = Keypair.generate();
      
      await token2022Service.setMetadataPointer(
        payerKeypair,
        mint,
        authorityKeypair,
        metadataPointer,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set metadata pointer';
      setError(errorMsg);
      console.error('Error setting metadata pointer:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const value: AppContextType = {
    // Wallet
    walletInfo,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    
    // Services
    walletService,
    dexService,
    token2022Service,
    
    // Token-2022 specific
    token2022Mints,
    createToken2022Mint,
    enableConfidentialTransfers,
    performConfidentialTransfer,
    setMetadataPointer,
    
    // Loading states
    loading,
    error,
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