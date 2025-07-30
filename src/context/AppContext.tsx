import { PublicKey } from '@solana/web3.js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AMMService, LiquidityQuote, PoolInfo, SwapQuote } from '../services/AMMService';
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

export interface AppContextType {
  walletInfo: WalletInfo | null;
  token2022Mints: Token2022Mint[];
  loading: boolean;
  error: string | null;
  servicesInitialized: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  requestAirdrop: (amount: number) => Promise<void>;
  createToken2022Mint: (decimals: number, supply: number) => Promise<PublicKey>;
  enableConfidentialTransfers: (mint: PublicKey) => Promise<void>;
  performConfidentialTransfer: (from: PublicKey, to: PublicKey, amount: number) => Promise<void>;
  // AMM functions
  ammService: AMMService | null;
  pools: PoolInfo[];
  getSwapQuote: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => SwapQuote | null;
  getLiquidityQuote: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number) => LiquidityQuote | null;
  executeSwap: (poolAddress: PublicKey, amountIn: number, minAmountOut: number, isTokenAToB: boolean) => Promise<string>;
  addLiquidity: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number, minLpTokens: number) => Promise<string>;
  initializePool: (tokenAMint: PublicKey, tokenBMint: PublicKey, feeRate?: number) => Promise<{ pool: PublicKey; signature: string }>;
  loadPools: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [token2022Mints, setToken2022Mints] = useState<Token2022Mint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [walletService, setWalletService] = useState<WalletService | null>(null);
  const [token2022Service, setToken2022Service] = useState<Token2022Service | null>(null);
  const [ammService, setAmmService] = useState<AMMService | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing services...');
        
        // Initialize services with connection
        const { Connection } = await import('@solana/web3.js');
        const connection = new Connection(
          'https://api.devnet.solana.com',
          'confirmed'
        );
        console.log('Connection created successfully');
        
        const walletSvc = new WalletService();
        console.log('WalletService created successfully');
        
        const token2022Svc = new Token2022Service(connection);
        console.log('Token2022Service created successfully');
        
        const ammProgramId = new PublicKey('11111111111111111111111111111111');
        console.log('AMM Program ID:', ammProgramId.toString());
        
        const ammSvc = new AMMService(connection, ammProgramId);
        console.log('AMMService created successfully');

        setWalletService(walletSvc);
        setToken2022Service(token2022Svc);
        setAmmService(ammSvc);
        setServicesInitialized(true);
        
        console.log('All services initialized successfully');
      } catch (err) {
        console.error('Error initializing services:', err);
        setError(`Failed to initialize services: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    initializeServices();
  }, []);

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    console.log('Wallet service available:', !!walletService);
    
    if (!walletService) {
      const errorMsg = 'Wallet service not initialized. Please wait for services to load.';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling walletService.connectWallet()...');
      const walletData = await walletService.connectWallet();
      console.log('Wallet connected successfully:', walletData);
      setWalletInfo(walletData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect wallet';
      console.error('Error connecting wallet:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
    setError(null);
  };

  const requestAirdrop = async (amount: number) => {
    if (!walletService || !walletInfo) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await walletService.requestAirdrop(amount);
      
      // Refresh balance
      if (walletInfo?.publicKey) {
        const newBalance = await walletService.getSOLBalance(walletInfo.publicKey);
        setWalletInfo(prev => prev ? { ...prev, balance: newBalance } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request airdrop');
      console.error('Error requesting airdrop:', err);
    } finally {
      setLoading(false);
    }
  };

  const createToken2022Mint = async (decimals: number, supply: number): Promise<PublicKey> => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Services not initialized or wallet not connected');
    }

    try {
      // In a real implementation, this would create an actual Token-2022 mint
      // For now, return a mock public key
      const mockMint = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
      
      const newMint: Token2022Mint = {
        mint: mockMint,
        authority: walletInfo.publicKey,
        supply,
        decimals,
        transferHookEnabled: false,
        confidentialTransferEnabled: false,
      };
      
      setToken2022Mints(prev => [...prev, newMint]);
      return mockMint;
    } catch (error) {
      console.error('Error creating Token-2022 mint:', error);
      throw error;
    }
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

  // AMM Functions
  const getSwapQuote = (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean): SwapQuote | null => {
    if (!ammService) return null;

    const pool = pools.find(p => p.pool.equals(poolAddress));
    if (!pool) return null;

    const reserveIn = isTokenAToB ? pool.tokenAReserves : pool.tokenBReserves;
    const reserveOut = isTokenAToB ? pool.tokenBReserves : pool.tokenAReserves;

    return ammService.calculateSwapQuote(amountIn, reserveIn, reserveOut, pool.feeRate);
  };

  const getLiquidityQuote = (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number): LiquidityQuote | null => {
    if (!ammService) return null;

    const pool = pools.find(p => p.pool.equals(poolAddress));
    if (!pool) return null;

    return ammService.calculateLiquidityQuote(tokenAAmount, tokenBAmount, pool);
  };

  const executeSwap = async (poolAddress: PublicKey, amountIn: number, minAmountOut: number, isTokenAToB: boolean): Promise<string> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // In a real implementation, you would need the user's keypair
      // For now, we'll simulate the transaction
      console.log('Executing swap:', { poolAddress: poolAddress.toString(), amountIn, minAmountOut, isTokenAToB });
      
      // Simulate transaction signature
      const mockSignature = 'mock_signature_' + Date.now();
      
      // Add notification for successful swap
      // This would be integrated with the notification system
      console.log('Swap executed successfully:', mockSignature);
      
      return mockSignature;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  };

  const addLiquidity = async (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number, minLpTokens: number): Promise<string> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // In a real implementation, you would need the user's keypair
      console.log('Adding liquidity:', { poolAddress: poolAddress.toString(), tokenAAmount, tokenBAmount, minLpTokens });
      
      // Simulate transaction signature
      const mockSignature = 'mock_liquidity_signature_' + Date.now();
      
      console.log('Liquidity added successfully:', mockSignature);
      
      return mockSignature;
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  };

  const initializePool = async (tokenAMint: PublicKey, tokenBMint: PublicKey, feeRate: number = 30): Promise<{ pool: PublicKey; signature: string }> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // In a real implementation, you would need the user's keypair
      console.log('Initializing pool:', { tokenAMint: tokenAMint.toString(), tokenBMint: tokenBMint.toString(), feeRate });
      
      // Simulate pool creation
      const mockPool = new PublicKey('Pool' + Date.now().toString().padStart(44, '1'));
      const mockSignature = 'mock_pool_signature_' + Date.now();
      
      console.log('Pool initialized successfully:', mockPool.toString());
      
      return { pool: mockPool, signature: mockSignature };
    } catch (error) {
      console.error('Error initializing pool:', error);
      throw error;
    }
  };

  const loadPools = async () => {
    if (!ammService) return;

    try {
      // Load mock pools for now - using valid base58 public keys
      const mockPools: PoolInfo[] = [
        {
          pool: new PublicKey('11111111111111111111111111111111'),
          tokenAMint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          tokenBMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
          tokenAVault: new PublicKey('11111111111111111111111111111112'),
          tokenBVault: new PublicKey('11111111111111111111111111111113'),
          lpMint: new PublicKey('11111111111111111111111111111114'),
          feeRate: 30,
          totalLiquidity: 1000000,
          tokenAReserves: 500000,
          tokenBReserves: 1000,
          isActive: true,
        },
        {
          pool: new PublicKey('11111111111111111111111111111115'),
          tokenAMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
          tokenBMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
          tokenAVault: new PublicKey('11111111111111111111111111111116'),
          tokenBVault: new PublicKey('11111111111111111111111111111117'),
          lpMint: new PublicKey('11111111111111111111111111111118'),
          feeRate: 25,
          totalLiquidity: 2000000,
          tokenAReserves: 1000000,
          tokenBReserves: 5000,
          isActive: true,
        },
      ];

      setPools(mockPools);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  useEffect(() => {
    if (ammService) {
      loadPools();
    }
  }, [ammService]);

  const value: AppContextType = {
    walletInfo,
    token2022Mints,
    loading,
    error,
    servicesInitialized,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    createToken2022Mint,
    enableConfidentialTransfers,
    performConfidentialTransfer,
    ammService,
    pools,
    getSwapQuote,
    getLiquidityQuote,
    executeSwap,
    addLiquidity,
    initializePool,
    loadPools,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 