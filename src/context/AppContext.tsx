import { TokenImageService } from '@/src/services/TokenImageService';
import { TransferHookAMMService } from '@/src/services/TransferHookAMMService';
import { TransferHookService } from '@/src/services/TransferHookService';
import { PublicKey } from '@solana/web3.js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AMMService, LiquidityQuote, PoolInfo, SwapQuote } from '../services/AMMService';
import { JupiterQuote, JupiterService } from '../services/JupiterService';
import { QRCodeService } from '../services/QRCodeService';
import { Token2022Service } from '../services/Token2022Service';
import { TokenLaunchConfig, TokenLaunchResult, TokenLaunchService } from '../services/TokenLaunchService';
import { WalletInfo, WalletService } from '../services/WalletService';

export interface Token2022Mint {
  mint: PublicKey;
  authority: PublicKey;
  supply: number;
  decimals: number;
  transferHookEnabled: boolean;
  confidentialTransferEnabled: boolean;
}

export interface TransferHookTokenConfig {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  totalSupply: number;
  hookFee: number;
}

export interface TransferHookPoolConfig {
  tokenAMint: string;
  tokenBMint: string;
  feeRate: number;
  hookFeeRate: number;
}

export interface TransferHookTokenResult {
  mint: PublicKey;
  signature: string;
  hookProgramId: PublicKey;
}

export interface TransferHookPoolResult {
  pool: PublicKey;
  signature: string;
}

export interface AppContextType {
  walletInfo: WalletInfo | null;
  token2022Mints: Token2022Mint[];
  loading: boolean;
  error: string | null;
  servicesInitialized: boolean;
  token2022Service: Token2022Service | null;
  tokenLaunchService: TokenLaunchService | null;
  jupiterService: JupiterService | null;
  qrCodeService: QRCodeService | null;
  walletService: WalletService | null;
  tokenImageService: TokenImageService | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  requestAirdrop: (amount: number) => Promise<void>;
  createToken2022Mint: (decimals: number, supply: number) => Promise<PublicKey>;
  enableConfidentialTransfers: (mint: PublicKey) => Promise<void>;
  performConfidentialTransfer: (from: PublicKey, to: PublicKey, amount: number) => Promise<void>;
  // Token Launch functions
  createTokenLaunch: (config: TokenLaunchConfig) => Promise<TokenLaunchResult>;
  // Transfer Hook functions
  createTransferHookToken: (config: TransferHookTokenConfig) => Promise<TransferHookTokenResult>;
  createTransferHookPool: (config: TransferHookPoolConfig) => Promise<TransferHookPoolResult>;
  transferWithHook: (source: PublicKey, destination: PublicKey, mint: PublicKey, amount: number, hookData?: Buffer) => Promise<string>;
  // Jupiter Swap functions
  getJupiterQuote: (inputMint: string, outputMint: string, amount: string, slippageBps?: number) => Promise<JupiterQuote>;
  executeJupiterSwap: (quote: JupiterQuote, wrapUnwrapSOL?: boolean) => Promise<string>;
  getSupportedTokens: () => Promise<any[]>;
  getTokenPrice: (mint: string) => Promise<number>;
  // QR Code functions
  generateAddressQRCode: (address: string) => Promise<string>;
  generateTransactionQRCode: (signature: string) => Promise<string>;
  generateExplorerQRCode: (signature: string, network?: 'mainnet' | 'devnet' | 'testnet') => Promise<string>;
  // AMM functions
  ammService: AMMService | null;
  pools: PoolInfo[];
  getSwapQuote: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => SwapQuote | null;
  getLiquidityQuote: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number) => LiquidityQuote | null;
  executeSwap: (poolAddress: PublicKey, amountIn: number, minAmountOut: number, isTokenAToB: boolean) => Promise<string>;
  addLiquidity: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number, minLpTokens: number) => Promise<string>;
  initializePool: (tokenAMint: PublicKey, tokenBMint: PublicKey, feeRate?: number) => Promise<{ pool: PublicKey; signature: string }>;
  loadPools: () => Promise<void>;
  getTokenBalances: () => Promise<any[]>;
  // Token Image functions
  getTokenImageUrl: (address: string) => Promise<string | null>;
  getTokenMetadata: (address: string) => Promise<any | null>;
  getFallbackIcon: (symbol: string) => string;
  getTokenColor: (symbol: string) => string;
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
  const [tokenLaunchService, setTokenLaunchService] = useState<TokenLaunchService | null>(null);
  const [jupiterService, setJupiterService] = useState<JupiterService | null>(null);
  const [qrCodeService, setQrCodeService] = useState<QRCodeService | null>(null);
  const [ammService, setAmmService] = useState<AMMService | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [transferHookService, setTransferHookService] = useState<TransferHookService | null>(null);
  const [transferHookAMMService, setTransferHookAMMService] = useState<TransferHookAMMService | null>(null);
  const [tokenImageService, setTokenImageService] = useState<TokenImageService | null>(null);

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

        const tokenLaunchSvc = new TokenLaunchService(connection);
        console.log('TokenLaunchService created successfully');
        
        const jupiterSvc = new JupiterService();
        console.log('JupiterService created successfully');
        
        const qrCodeSvc = new QRCodeService();
        console.log('QRCodeService created successfully');
        
        const ammProgramId = new PublicKey('11111111111111111111111111111111');
        console.log('AMM Program ID:', ammProgramId.toString());
        
        const ammSvc = new AMMService(connection, ammProgramId);
        console.log('AMMService created successfully');

        const tokenImageSvc = new TokenImageService();
        console.log('TokenImageService created successfully');

        setWalletService(walletSvc);
        setToken2022Service(token2022Svc);
        setTokenLaunchService(tokenLaunchSvc);
        setJupiterService(jupiterSvc);
        setQrCodeService(qrCodeSvc);
        setAmmService(ammSvc);
        setTokenImageService(tokenImageSvc);
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
    if (!walletService) {
      throw new Error('Wallet service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('=== CALLING CONNECT WALLET ===');
      const info = await walletService.connectWallet();
      console.log('Wallet connected successfully:', info);
      setWalletInfo(info);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    if (walletService) {
      walletService.disconnectWallet();
    }
    setWalletInfo(null);
  };

  const requestAirdrop = async (amount: number) => {
    if (!walletService || !walletInfo) {
      throw new Error('Wallet not connected');
    }

    try {
      await walletService.requestAirdrop(amount);
      // Refresh wallet info to get updated balance
      const updatedInfo = await walletService.getWalletInfo();
      if (updatedInfo) {
        setWalletInfo(updatedInfo);
      }
    } catch (err) {
      console.error('Error requesting airdrop:', err);
      throw err;
    }
  };

  const createTokenLaunch = async (config: TokenLaunchConfig): Promise<TokenLaunchResult> => {
    if (!tokenLaunchService || !walletInfo) {
      throw new Error('Token launch service not initialized or wallet not connected');
    }

    try {
      // Create a keypair for the payer (in real app, this would be the user's keypair)
      const { Keypair } = await import('@solana/web3.js');
      const payerKeypair = Keypair.generate(); // This should be the user's actual keypair
      
      const result = await tokenLaunchService.createToken(payerKeypair, config);
      return result;
    } catch (err) {
      console.error('Error creating token launch:', err);
      throw err;
    }
  };

  const createToken2022Mint = async (decimals: number, supply: number): Promise<PublicKey> => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Token2022 service not initialized or wallet not connected');
    }

    try {
      const { Keypair } = await import('@solana/web3.js');
      const payerKeypair = Keypair.generate(); // This should be the user's actual keypair
      
      const mint = await token2022Service.initializeMint(payerKeypair, decimals, supply);
      return mint;
    } catch (err) {
      console.error('Error creating Token-2022 mint:', err);
      throw err;
    }
  };

  const enableConfidentialTransfers = async (mint: PublicKey): Promise<void> => {
    // This would require advanced Token-2022 extensions
    console.log('Confidential transfers not implemented in this version');
  };

  const performConfidentialTransfer = async (from: PublicKey, to: PublicKey, amount: number): Promise<void> => {
    // This would require advanced Token-2022 extensions
    console.log('Confidential transfers not implemented in this version');
  };

  // Transfer Hook functions
  const createTransferHookToken = async (config: TransferHookTokenConfig): Promise<TransferHookTokenResult> => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Token2022 service not initialized or wallet not connected');
    }

    try {
      const { Keypair } = await import('@solana/web3.js');
      const payerKeypair = Keypair.generate();
      
      // Create mint with Transfer Hook using the service
      const mint = await token2022Service.initializeMintWithTransferHook(
        payerKeypair,
        config.decimals,
        config.totalSupply,
        {
          programId: new PublicKey('11111111111111111111111111111111'), // Mock hook program
          authority: payerKeypair.publicKey,
        }
      );
      
      return {
        mint,
        signature: 'mock_signature_' + Date.now(),
        hookProgramId: new PublicKey('11111111111111111111111111111111'),
      };
    } catch (err) {
      console.error('Error creating Transfer Hook token:', err);
      throw err;
    }
  };

  const createTransferHookPool = async (config: TransferHookPoolConfig): Promise<TransferHookPoolResult> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      const { Keypair } = await import('@solana/web3.js');
      const payerKeypair = Keypair.generate();
      
      const result = await ammService.initializePool(
        payerKeypair,
        new PublicKey(config.tokenAMint),
        new PublicKey(config.tokenBMint),
        config.feeRate
      );
      
      return {
        pool: result.pool,
        signature: result.signature,
      };
    } catch (err) {
      console.error('Error creating Transfer Hook pool:', err);
      throw err;
    }
  };

  const transferWithHook = async (
    source: PublicKey,
    destination: PublicKey,
    mint: PublicKey,
    amount: number,
    hookData?: Buffer
  ): Promise<string> => {
    if (!token2022Service || !walletInfo) {
      throw new Error('Token2022 service not initialized or wallet not connected');
    }

    try {
      const { Keypair } = await import('@solana/web3.js');
      const payerKeypair = Keypair.generate();
      
      // Mock transfer with hook
      const signature = 'mock_transfer_' + Date.now();
      console.log('Transfer with hook executed:', { source: source.toString(), destination: destination.toString(), mint: mint.toString(), amount });
      
      return signature;
    } catch (err) {
      console.error('Error transferring with hook:', err);
      throw err;
    }
  };
  // Jupiter Swap functions
  const getJupiterQuote = async (
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<JupiterQuote> => {
    if (!jupiterService) {
      throw new Error('Jupiter service not initialized');
    }

    try {
      return await jupiterService.getQuote(inputMint, outputMint, amount, slippageBps);
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      throw error;
    }
  };

  const executeJupiterSwap = async (
    quote: JupiterQuote,
    wrapUnwrapSOL: boolean = true
  ): Promise<string> => {
    if (!jupiterService || !walletInfo) {
      throw new Error('Jupiter service or wallet not initialized');
    }

    try {
      // Get the swap transaction from Jupiter
      const swapTransaction = await jupiterService.executeSwap(
        quote,
        walletInfo.publicKey.toString(),
        wrapUnwrapSOL
      );

      // The swap transaction is returned as a base64 encoded string
      // We need to deserialize it and send it through the wallet
      if (walletService) {
        const { Transaction } = await import('@solana/web3.js');
        const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
        
        // Send the transaction through the wallet
        const signature = await walletService.sendTransaction(transaction);
        console.log('Jupiter swap executed successfully:', signature);
        return signature;
      }

      throw new Error('Wallet service not available');
    } catch (error) {
      console.error('Error executing Jupiter swap:', error);
      throw error;
    }
  };

  const getSupportedTokens = async (): Promise<any[]> => {
    if (!jupiterService) {
      throw new Error('Jupiter service not initialized');
    }

    try {
      return await jupiterService.getSupportedTokens();
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      return [];
    }
  };

  const getTokenPrice = async (mint: string): Promise<number> => {
    if (!jupiterService) {
      throw new Error('Jupiter service not initialized');
    }

    try {
      return await jupiterService.getTokenPrice(mint);
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  };

  const getJupiterTokenMetadata = async (mint: string): Promise<any> => {
    if (!jupiterService) {
      throw new Error('Jupiter service not initialized');
    }

    try {
      return await jupiterService.getTokenMetadata(mint);
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return null;
    }
  };

  // QR Code functions
  const generateAddressQRCode = async (address: string): Promise<string> => {
    if (!qrCodeService) {
      throw new Error('QR code service not initialized');
    }

    try {
      return await qrCodeService.generateAddressQRCode(address);
    } catch (err) {
      console.error('Error generating address QR code:', err);
      throw err;
    }
  };

  const generateTransactionQRCode = async (signature: string): Promise<string> => {
    if (!qrCodeService) {
      throw new Error('QR code service not initialized');
    }

    try {
      return await qrCodeService.generateTransactionQRCode(signature);
    } catch (err) {
      console.error('Error generating transaction QR code:', err);
      throw err;
    }
  };

  const generateExplorerQRCode = async (
    signature: string,
    network: 'mainnet' | 'devnet' | 'testnet' = 'devnet'
  ): Promise<string> => {
    if (!qrCodeService) {
      throw new Error('QR code service not initialized');
    }

    try {
      return await qrCodeService.generateExplorerQRCode(signature, network);
    } catch (err) {
      console.error('Error generating explorer QR code:', err);
      throw err;
    }
  };

  // AMM functions - simplified for now
  const getSwapQuote = (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean): SwapQuote | null => {
    if (!ammService) return null;
    
    // Mock implementation for now
    return {
      amountIn,
      amountOut: amountIn * 0.95, // Mock 5% fee
      fee: amountIn * 0.05,
      priceImpact: 0.1,
      slippage: 0.5,
    };
  };

  const getLiquidityQuote = (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number): LiquidityQuote | null => {
    if (!ammService) return null;
    
    // Mock implementation for now
    return {
      tokenAAmount,
      tokenBAmount,
      lpTokensToMint: Math.sqrt(tokenAAmount * tokenBAmount),
      share: 0.1,
    };
  };

  const executeSwap = async (poolAddress: PublicKey, amountIn: number, minAmountOut: number, isTokenAToB: boolean): Promise<string> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // Mock swap for now
      const mockSignature = 'mock_swap_' + Date.now();
      console.log('Mock swap executed:', { poolAddress: poolAddress.toString(), amountIn, minAmountOut, isTokenAToB });
      return mockSignature;
    } catch (err) {
      console.error('Error executing swap:', err);
      throw err;
    }
  };

  const addLiquidity = async (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number, minLpTokens: number): Promise<string> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // Mock liquidity addition for now
      const mockSignature = 'mock_liquidity_' + Date.now();
      console.log('Mock liquidity added:', { poolAddress: poolAddress.toString(), tokenAAmount, tokenBAmount, minLpTokens });
      return mockSignature;
    } catch (err) {
      console.error('Error adding liquidity:', err);
      throw err;
    }
  };

  const initializePool = async (tokenAMint: PublicKey, tokenBMint: PublicKey, feeRate: number = 30): Promise<{ pool: PublicKey; signature: string }> => {
    if (!ammService || !walletInfo) {
      throw new Error('AMM service not initialized or wallet not connected');
    }

    try {
      // Mock pool initialization for now
      const mockPool = new PublicKey('Pool' + Date.now().toString().padStart(44, '1'));
      const mockSignature = 'mock_pool_' + Date.now();
      console.log('Mock pool initialized:', { tokenAMint: tokenAMint.toString(), tokenBMint: tokenBMint.toString(), feeRate });
      return { pool: mockPool, signature: mockSignature };
    } catch (err) {
      console.error('Error initializing pool:', err);
      throw err;
    }
  };

  const loadPools = async () => {
    if (!ammService) return;

    try {
      // Mock pools for now
      const mockPools: PoolInfo[] = [
        {
          pool: new PublicKey('11111111111111111111111111111111'),
          tokenAMint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          tokenBMint: new PublicKey('So11111111111111111111111111111111111111112'),
          tokenAVault: new PublicKey('11111111111111111111111111111112'),
          tokenBVault: new PublicKey('11111111111111111111111111111113'),
          lpMint: new PublicKey('11111111111111111111111111111114'),
          feeRate: 30,
          totalLiquidity: 1000000,
          tokenAReserves: 500000,
          tokenBReserves: 1000,
          isActive: true,
          supportsTransferHooks: true,
        },
      ];
      setPools(mockPools);
    } catch (err) {
      console.error('Error loading pools:', err);
    }
  };

  const getTokenBalances = async (): Promise<any[]> => {
    if (!walletService || !walletInfo) {
      throw new Error('Wallet service not initialized or wallet not connected');
    }

    try {
      return await walletService.getTokenBalances(walletInfo.publicKey);
    } catch (error) {
      console.error('Error getting token balances:', error);
      return [];
    }
  };

  // Token Image functions
  const getTokenImageUrl = async (address: string): Promise<string | null> => {
    if (!tokenImageService) {
      throw new Error('Token image service not initialized');
    }
    try {
      return await tokenImageService.getTokenImageUrl(address);
    } catch (err) {
      console.error('Error getting token image URL:', err);
      return null;
    }
  };

  const getTokenMetadata = async (address: string): Promise<any | null> => {
    if (!tokenImageService) {
      throw new Error('Token image service not initialized');
    }
    try {
      return await tokenImageService.getTokenMetadata(address);
    } catch (err) {
      console.error('Error getting token metadata:', err);
      return null;
    }
  };

  const getFallbackIcon = (symbol: string): string => {
    if (!tokenImageService) {
      return 'ellipse';
    }
    return tokenImageService.getFallbackIcon(symbol);
  };

  const getTokenColor = (symbol: string): string => {
    if (!tokenImageService) {
      return '#6366f1';
    }
    return tokenImageService.getTokenColor(symbol);
  };

  const contextValue: AppContextType = {
    walletInfo,
    token2022Mints,
    loading,
    error,
    servicesInitialized,
    token2022Service,
    tokenLaunchService,
    jupiterService,
    qrCodeService,
    walletService,
    tokenImageService,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    createToken2022Mint,
    enableConfidentialTransfers,
    performConfidentialTransfer,
    createTokenLaunch,
    createTransferHookToken,
    createTransferHookPool,
    transferWithHook,
    getJupiterQuote,
    executeJupiterSwap,
    getSupportedTokens,
    getTokenPrice,
    generateAddressQRCode,
    generateTransactionQRCode,
    generateExplorerQRCode,
    ammService,
    pools,
    getSwapQuote,
    getLiquidityQuote,
    executeSwap,
    addLiquidity,
    initializePool,
    loadPools,
    getTokenBalances,
    getTokenImageUrl,
    getTokenMetadata,
    getFallbackIcon,
    getTokenColor,
  };
  return (
    <AppContext.Provider value={contextValue}>
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