
import { DecreaseLiquidityParams, IncreaseLiquidityParams, LiquidityPosition, Token2022LiquidityService, Token2022PoolConfig } from '@/src/services/Token2022LiquidityService';
import { TokenImageService } from '@/src/services/TokenImageService';
import { TransferHookAMMService } from '@/src/services/TransferHookAMMService';
import { TransferHookService } from '@/src/services/TransferHookService';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { DevnetConfig } from '../../constants/devnet-config';
import { AMMService, LiquidityQuote, PoolInfo, SwapQuote } from '../services/AMMService';
import { JupiterQuote, JupiterService } from '../services/JupiterService';
import { QRCodeService } from '../services/QRCodeService';
import { RaydiumService } from '../services/RaydiumService';
import { Token2022Service } from '../services/Token2022Service';
import TokenLaunchDataService, { TokenLaunchData } from '../services/TokenLaunchDataService';
import { TokenLaunchConfig, TokenLaunchResult, TokenLaunchService } from '../services/TokenLaunchService';
import TokenPriceService from '../services/TokenPriceService';
import TransactionService, { TransactionData } from '../services/TransactionService';
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
  dexService: any | null; // Add missing dexService
  transferHookAMMService: TransferHookAMMService | null;
  // Real-time data services
  tokenPriceService: TokenPriceService | null;
  transactionService: TransactionService | null;
  tokenLaunchDataService: TokenLaunchDataService | null;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
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
  getJupiterTokenMetadata?: (mint: string) => Promise<any>;
  // QR Code functions
  generateAddressQRCode: (address: string) => Promise<string>;
  generateTransactionQRCode: (signature: string) => Promise<string>;
  generateExplorerQRCode: (signature: string, network?: 'mainnet' | 'devnet' | 'testnet') => Promise<string>;
  // Token-2022 Liquidity functions
  token2022LiquidityService: Token2022LiquidityService | null;
  getUserLiquidityPositions: (userPublicKey: PublicKey) => Promise<LiquidityPosition[]>;
  getToken2022PoolInfo: (poolAddress: PublicKey) => Promise<Token2022PoolConfig | null>;
  increaseLiquidity: (params: IncreaseLiquidityParams, poolConfig: Token2022PoolConfig) => Promise<string>;
  decreaseLiquidity: (params: DecreaseLiquidityParams, poolConfig: Token2022PoolConfig) => Promise<string>;
  calculateOptimalLiquidity: (amount0: string, amount1: string, tickLower: number, tickUpper: number, currentTick: number) => string;
  // AMM functions
  ammService: AMMService | null;
  pools: PoolInfo[];
  getSwapQuote: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => SwapQuote | null;
  getLiquidityQuote: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number) => LiquidityQuote | null;
  executeSwap: (poolAddress: PublicKey, amountIn: number, minAmountOut: number, isTokenAToB: boolean) => Promise<string>;
  addLiquidity: (poolAddress: PublicKey, tokenAAmount: number, tokenBAmount: number, minLpTokens: number) => Promise<string>;
  // Real-time data functions
  getRealTimeTokenPrice: (mint: string) => Promise<number>;
  getRealTimeSOLPrice: () => Promise<number>;
  convertSOLToUSD: (solAmount: number) => Promise<number>;
  convertUSDToSOL: (usdAmount: number) => Promise<number>;
  getRecentTransactions: (limit?: number) => Promise<TransactionData[]>;
  getRecentTokenLaunches: (limit?: number) => Promise<TokenLaunchData[]>;
  initializePool: (tokenAMint: PublicKey, tokenBMint: PublicKey, feeRate?: number) => Promise<{ pool: PublicKey; signature: string }>;
  loadPools: () => Promise<void>;
  getTokenBalances: () => Promise<any[]>;
  // Jupiter-driven quoting/execution by pool (real integration)
  getSwapQuoteAsync?: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => Promise<SwapQuote | null>;
  executeSwapOnJupiter?: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean, slippageBps?: number) => Promise<string>;
  // Raydium
  executeSwapOnRaydium?: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => Promise<string>;
  getSwapQuoteOnRaydium?: (poolAddress: PublicKey, amountIn: number, isTokenAToB: boolean) => Promise<SwapQuote | null>;
  router?: 'jupiter' | 'raydium';
  setRouter?: (r: 'jupiter' | 'raydium') => void;
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
  const [token2022LiquidityService, setToken2022LiquidityService] = useState<Token2022LiquidityService | null>(null);
  const [tokenLaunchService, setTokenLaunchService] = useState<TokenLaunchService | null>(null);
  const [jupiterService, setJupiterService] = useState<JupiterService | null>(null);
  const [qrCodeService, setQrCodeService] = useState<QRCodeService | null>(null);
  const [ammService, setAmmService] = useState<AMMService | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [transferHookService, setTransferHookService] = useState<TransferHookService | null>(null);
  const [transferHookAMMService, setTransferHookAMMService] = useState<TransferHookAMMService | null>(null);
  const [tokenImageService, setTokenImageService] = useState<TokenImageService | null>(null);
  const [dexService, setDexService] = useState<any | null>(null);
  const [raydiumService, setRaydiumService] = useState<RaydiumService | null>(null);
  const [router, setRouter] = useState<'jupiter' | 'raydium'>('jupiter');
  // Real-time data services
  const [tokenPriceService, setTokenPriceService] = useState<TokenPriceService | null>(null);
  const [transactionService, setTransactionService] = useState<TransactionService | null>(null);
  const [tokenLaunchDataService, setTokenLaunchDataService] = useState<TokenLaunchDataService | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔄 Starting services initialization...');
        
        // Initialize services with connection
        console.log('✅ Web3.js imported successfully');
        
        const connection = new Connection(
          DevnetConfig.RPC_ENDPOINT,
          'confirmed'
        );
        console.log('✅ Connection created');
        
        console.log('🔄 Creating WalletService...');
        const walletSvc = new WalletService();
        console.log('✅ WalletService created');
        
        console.log('🔄 Creating Token2022Service...');
        const token2022Svc = new Token2022Service(connection, walletSvc);
        console.log('✅ Token2022Service created');
        
        console.log('🔄 Creating Token2022LiquidityService...');
        const token2022LiquiditySvc = new Token2022LiquidityService(connection);
        console.log('✅ Token2022LiquidityService created');
        
        console.log('🔄 Creating TokenLaunchService...');
        const tokenLaunchSvc = new TokenLaunchService(connection, walletSvc);
        console.log('✅ TokenLaunchService created');
        
        console.log('🔄 Creating JupiterService...');
        const jupiterSvc = new JupiterService();
        console.log('✅ JupiterService created');
        
        console.log('🔄 Creating QRCodeService...');
        const qrCodeSvc = new QRCodeService();
        console.log('✅ QRCodeService created');
        
        console.log('🔄 Creating AMMService...');
        const ammProgramId = new PublicKey('11111111111111111111111111111112'); // System Program ID (mock)
        const ammSvc = new AMMService(connection, ammProgramId);
        console.log('✅ AMMService created');
        
        console.log('🔄 Creating TokenImageService...');
        const tokenImageSvc = new TokenImageService();
        console.log('✅ TokenImageService created');

        console.log('🔄 Creating RaydiumService...');
        const raydiumSvc = new RaydiumService(connection);
        console.log('✅ RaydiumService created');

        console.log('🔄 Creating TokenPriceService...');
        const tokenPriceSvc = new TokenPriceService();
        console.log('✅ TokenPriceService created');

        console.log('🔄 Creating TransactionService...');
        const transactionSvc = new TransactionService(connection);
        console.log('✅ TransactionService created');

        console.log('🔄 Creating TokenLaunchDataService...');
        const tokenLaunchDataSvc = new TokenLaunchDataService(connection);
        console.log('✅ TokenLaunchDataService created');

        console.log('🔄 Setting services in state...');
        setWalletService(walletSvc);
        setToken2022Service(token2022Svc);
        setToken2022LiquidityService(token2022LiquiditySvc);
        setTokenLaunchService(tokenLaunchSvc);
        setJupiterService(jupiterSvc);
        setQrCodeService(qrCodeSvc);
        setAmmService(ammSvc);
        setTokenImageService(tokenImageSvc);
        setRaydiumService(raydiumSvc);
        setTokenPriceService(tokenPriceSvc);
        setTransactionService(transactionSvc);
        setTokenLaunchDataService(tokenLaunchDataSvc);
        
        console.log('🔄 Setting servicesInitialized to true...');
        setServicesInitialized(true);
        console.log('✅ All services initialized successfully!');
      } catch (err) {
        console.error('❌ Error initializing services:', err);
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
      const info = await walletService.connectWallet();
      setWalletInfo(info);
      
      // Ensure the wallet service is properly connected for all dependent services
      console.log('✅ Wallet connected successfully, wallet service is now ready for transactions');
      
      // Log the connection status for debugging
      console.log('Wallet connection status:', {
        isConnected: walletService.isWalletConnected(),
        publicKey: walletService.getPublicKey()?.toString(),
        authToken: walletService.getAuthToken() ? 'Present' : 'Missing'
      });
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reconnectWallet = async () => {
    if (!walletService) {
      throw new Error('Wallet service not initialized');
    }

    setLoading(true);
    setError(null);

    try {
      const info = await walletService.reconnectWallet();
      setWalletInfo(info);
    } catch (err) {
      console.error('Error reconnecting wallet:', err);
      setError(`Failed to reconnect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // Helper function to ensure wallet is ready for transactions
  const ensureWalletReady = async () => {
    if (!walletService) {
      throw new Error('Wallet service not initialized');
    }
    
    if (!walletInfo) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }
    
    if (!walletService.isWalletConnected()) {
      throw new Error('Wallet service is not connected. Please connect your wallet first.');
    }
    
    // Try to ensure wallet is ready for transactions
    try {
      await walletService.ensureWalletReady();
    } catch (error) {
      console.error('Wallet not ready for transactions:', error);
      throw new Error('Wallet is not ready for transactions. Please try reconnecting your wallet.');
    }
  };

  const createTokenLaunch = async (config: TokenLaunchConfig): Promise<TokenLaunchResult> => {
    if (!tokenLaunchService || !walletInfo || !walletService) {
      throw new Error('Token launch service not initialized or wallet not connected');
    }

    // Ensure wallet is ready before proceeding
    await ensureWalletReady();

    try {
      console.log('Creating token launch with wallet:', walletInfo.publicKey.toString());
      console.log('Wallet service connection status:', walletService.isWalletConnected());
      
      // Use the user's actual wallet for signing
      const result = await tokenLaunchService.createTokenWithWallet(walletInfo.publicKey, config);
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
    if (!token2022Service || !walletInfo || !walletService) {
      throw new Error('Token2022 service not initialized or wallet not connected');
    }

    // Ensure wallet is ready before proceeding
    await ensureWalletReady();

    try {
      console.log('Creating Transfer Hook token with wallet:', walletInfo.publicKey.toString());
      console.log('Wallet service connection status:', walletService.isWalletConnected());
      
      // Use the user's actual wallet for signing
      const result = await token2022Service.initializeMintWithTransferHookAndWallet(
        walletInfo.publicKey,
        config.decimals,
        config.totalSupply,
        {
          programId: DevnetConfig.TRANSFER_HOOKS.FEE_COLLECTION, // Use valid devnet hook program
          authority: walletInfo.publicKey,
        }
      );
      
      return {
        mint: result.mint,
        signature: result.signature,
        hookProgramId: DevnetConfig.TRANSFER_HOOKS.FEE_COLLECTION,
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
      const payerKeypair = Keypair.generate();
      
      // Mock transfer with hook
      const signature = 'mock_transfer_' + Date.now();
      
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
        const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
        
        // Send the transaction through the wallet
        const signature = await walletService.sendTransaction(transaction);
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

  // Helper: fetch token decimals via Jupiter token metadata, fallback to 9
  const getTokenDecimals = async (mint: string): Promise<number> => {
    try {
      const meta = await getJupiterTokenMetadata(mint);
      if (meta && (meta.decimals ?? meta.decimals === 0)) return meta.decimals;
    } catch {}
    return 9;
  };

  // Real quote using Jupiter by pool
  const getSwapQuoteAsync = async (
    poolAddress: PublicKey,
    amountIn: number,
    isTokenAToB: boolean,
  ): Promise<SwapQuote | null> => {
    if (!jupiterService) return null;
    try {
      const pool = pools.find((p) => p.pool.equals(poolAddress));
      if (!pool) return null;
      const inputMint = (isTokenAToB ? pool.tokenAMint : pool.tokenBMint).toString();
      const outputMint = (isTokenAToB ? pool.tokenBMint : pool.tokenAMint).toString();
      const decimals = await getTokenDecimals(inputMint);
      const rawAmount = Math.max(0, Math.floor(amountIn * Math.pow(10, decimals)));
      const quote = await jupiterService.getQuote(inputMint, outputMint, String(rawAmount), 50, undefined, true);
      const outDecimals = await getTokenDecimals(outputMint);
      const amountOut = Number(quote.outAmount) / Math.pow(10, outDecimals);
      const priceImpactPct = quote.priceImpactPct ?? 0; // 0.01 => 1%
      return {
        amountIn,
        amountOut,
        fee: 0, // Jupiter includes fees in route; detailed breakdown requires extra processing
        priceImpact: Number((priceImpactPct * 100).toFixed(4)),
        slippage: 0.5,
      };
    } catch (error) {
      console.error('Error getting Jupiter quote by pool:', error);
      return null;
    }
  };

  // Execute swap using Jupiter by pool
  const executeSwapOnJupiter = async (
    poolAddress: PublicKey,
    amountIn: number,
    isTokenAToB: boolean,
    slippageBps: number = 50,
  ): Promise<string> => {
    if (!jupiterService || !walletInfo || !walletService) {
      throw new Error('Services or wallet not initialized');
    }
    const pool = pools.find((p) => p.pool.equals(poolAddress));
    if (!pool) throw new Error('Pool not found');
    const inputMint = (isTokenAToB ? pool.tokenAMint : pool.tokenBMint).toString();
    const outputMint = (isTokenAToB ? pool.tokenBMint : pool.tokenAMint).toString();
    const decimals = await getTokenDecimals(inputMint);
    const rawAmount = Math.max(0, Math.floor(amountIn * Math.pow(10, decimals)));
    const quote = await jupiterService.getQuote(inputMint, outputMint, String(rawAmount), slippageBps, undefined, true);
    // Reuse existing helper to execute and send
    const swapTxB64 = await jupiterService.getSwapTransaction(quote, walletInfo.publicKey.toString(), true);
    const tx = Transaction.from(Buffer.from(swapTxB64, 'base64'));
    const sig = await walletService.sendTransaction(tx);
    return sig;
  };

  // Raydium adapters (placeholders)
  const getSwapQuoteOnRaydium = async (
    poolAddress: PublicKey,
    amountIn: number,
    isTokenAToB: boolean,
  ): Promise<SwapQuote | null> => {
    if (!raydiumService) {
      console.warn('⚠️ Raydium service not initialized, falling back to Jupiter');
      return await getSwapQuoteAsync(poolAddress, amountIn, isTokenAToB);
    }

    try {
      console.log('🔄 Getting Raydium quote...');
      const raydiumQuote = await raydiumService.getQuote(poolAddress, amountIn, isTokenAToB);
      
      // Convert Raydium quote to SwapQuote format
      const swapQuote: SwapQuote = {
        amountIn: amountIn,
        amountOut: raydiumQuote.amountOut,
        fee: raydiumQuote.fee,
        priceImpact: raydiumQuote.priceImpact,
        slippage: raydiumQuote.slippage,
      };
      
      console.log('✅ Raydium quote received:', swapQuote);
      return swapQuote;
    } catch (error) {
      console.error('❌ Raydium quote failed, falling back to Jupiter:', error);
      return await getSwapQuoteAsync(poolAddress, amountIn, isTokenAToB);
    }
  };

  const executeSwapOnRaydium = async (
    poolAddress: PublicKey,
    amountIn: number,
    isTokenAToB: boolean,
  ): Promise<string> => {
    if (!raydiumService || !walletInfo) {
      console.warn('⚠️ Raydium service not initialized or wallet not connected, falling back to Jupiter');
      return await executeSwapOnJupiter(poolAddress, amountIn, isTokenAToB, 50);
    }

    try {
      console.log('🔄 Executing Raydium swap...');
      const params = {
        poolAddress,
        amountIn,
        directionAToB: isTokenAToB,
        slippageTolerance: 50,
        userPublicKey: walletInfo.publicKey
      };
      
      const signature = await raydiumService.executeSwap(params);
      console.log('✅ Raydium swap executed:', signature);
      return signature;
    } catch (error) {
      console.error('❌ Raydium swap failed, falling back to Jupiter:', error);
      return await executeSwapOnJupiter(poolAddress, amountIn, isTokenAToB, 50);
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
    network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet'
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
          pool: new PublicKey('11111111111111111111111111111112'),
          tokenAMint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          tokenBMint: new PublicKey('So11111111111111111111111111111111111111112'),
          tokenAVault: new PublicKey('11111111111111111111111111111113'),
          tokenBVault: new PublicKey('11111111111111111111111111111114'),
          lpMint: new PublicKey('11111111111111111111111111111115'),
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

  // Token2022 Liquidity functions
  const getUserLiquidityPositions = async (userPubkey: PublicKey): Promise<any[]> => {
    // TODO: Implement when we have user position tracking
    // For now return empty array
    console.log('Getting liquidity positions for user:', userPubkey.toString());
    return [];
  };

  const getToken2022PoolInfo = async (poolId: PublicKey): Promise<any> => {
    if (!token2022LiquidityService) {
      throw new Error('Token2022LiquidityService not initialized');
    }

    try {
      return await token2022LiquidityService.getPoolInfo(poolId);
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  };

  const increaseLiquidity = async (
    params: IncreaseLiquidityParams,
    poolConfig: Token2022PoolConfig
  ): Promise<string> => {
    if (!token2022LiquidityService || !walletService || !walletInfo) {
      throw new Error('Token2022LiquidityService not initialized or wallet not connected');
    }

    try {
      const transaction = await token2022LiquidityService.increaseLiquidity(
        params,
        walletInfo.publicKey,
        poolConfig
      );

      // Sign and send transaction through wallet service
      const signature = await walletService.sendTransaction(transaction);
      return signature || 'Transaction sent successfully';
    } catch (error) {
      console.error('Error increasing liquidity:', error);
      throw error;
    }
  };

  const decreaseLiquidity = async (
    params: DecreaseLiquidityParams,
    poolConfig: Token2022PoolConfig
  ): Promise<string> => {
    if (!token2022LiquidityService || !walletService || !walletInfo) {
      throw new Error('Token2022LiquidityService not initialized or wallet not connected');
    }

    try {
      const transaction = await token2022LiquidityService.decreaseLiquidity(
        params,
        walletInfo.publicKey,
        poolConfig
      );

      // Sign and send transaction through wallet service
      const signature = await walletService.sendTransaction(transaction);
      return signature || 'Transaction sent successfully';
    } catch (error) {
      console.error('Error decreasing liquidity:', error);
      throw error;
    }
  };

  const calculateOptimalLiquidity = (
    amount0: string,
    amount1: string,
    tickLower: number,
    tickUpper: number,
    currentTick: number
  ): string => {
    // Simple calculation - in practice this would be more complex
    // involving price calculations and tick math
    const amount0Num = parseFloat(amount0);
    const amount1Num = parseFloat(amount1);
    
    // Mock calculation based on tick range
    const tickRange = Math.abs(tickUpper - tickLower);
    const liquidityEstimate = Math.sqrt(amount0Num * amount1Num) * (tickRange / 1000);
    
    return liquidityEstimate.toString();
  };

  // Real-time data functions
  const getRealTimeTokenPrice = async (mint: string): Promise<number> => {
    if (!tokenPriceService) {
      throw new Error('Token price service not initialized');
    }
    return await tokenPriceService.getTokenPrice(mint);
  };

  const getRealTimeSOLPrice = async (): Promise<number> => {
    if (!tokenPriceService) {
      throw new Error('Token price service not initialized');
    }
    return await tokenPriceService.getSOLPrice();
  };

  const convertSOLToUSD = async (solAmount: number): Promise<number> => {
    if (!tokenPriceService) {
      throw new Error('Token price service not initialized');
    }
    return await tokenPriceService.convertSOLToUSD(solAmount);
  };

  const convertUSDToSOL = async (usdAmount: number): Promise<number> => {
    if (!tokenPriceService) {
      throw new Error('Token price service not initialized');
    }
    return await tokenPriceService.convertUSDToSOL(usdAmount);
  };

  const getRecentTransactions = async (limit: number = 20): Promise<TransactionData[]> => {
    if (!transactionService || !walletInfo) {
      throw new Error('Transaction service not initialized or wallet not connected');
    }
    return await transactionService.getRecentTransactions(walletInfo.publicKey, limit);
  };

  const getRecentTokenLaunches = async (limit: number = 10): Promise<TokenLaunchData[]> => {
    if (!tokenLaunchDataService) {
      throw new Error('Token launch data service not initialized');
    }
    return await tokenLaunchDataService.getRecentTokenLaunches(limit);
  };

  const contextValue: AppContextType = {
    walletInfo,
    token2022Mints,
    loading,
    error,
    servicesInitialized,
    token2022Service,
    token2022LiquidityService,
    tokenLaunchService,
    jupiterService,
    qrCodeService,
    walletService,
    tokenImageService,
    dexService,
    transferHookAMMService,
    // Real-time data services
    tokenPriceService,
    transactionService,
    tokenLaunchDataService,
    connectWallet,
    reconnectWallet,
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
    getJupiterTokenMetadata,
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
    getSwapQuoteAsync,
    executeSwapOnJupiter,
    executeSwapOnRaydium,
    getSwapQuoteOnRaydium,
    router,
    setRouter,
    getTokenImageUrl,
    getTokenMetadata,
    getFallbackIcon,
    getTokenColor,
    getUserLiquidityPositions,
    getToken2022PoolInfo,
    increaseLiquidity,
    decreaseLiquidity,
    calculateOptimalLiquidity,
    // Real-time data functions
    getRealTimeTokenPrice,
    getRealTimeSOLPrice,
    convertSOLToUSD,
    convertUSDToSOL,
    getRecentTransactions,
    getRecentTokenLaunches,
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