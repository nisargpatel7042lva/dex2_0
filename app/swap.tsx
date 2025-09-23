
import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { NetworkConfig } from '@/constants/network-config';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { VersionedTransaction } from '@solana/web3.js';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Common token mints for mainnet - Updated with mainnet addresses
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'JUP', name: 'Jupiter', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
  { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6 },
  { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
];

// Jupiter API Configuration
const JUPITER_API_BASE_URL = 'https://quote-api.jup.ag/v6';

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: any;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
  aggregatorVersion?: string;
  mostReliableAmmsQuoteReport?: any;
  simplerRouteUsed?: boolean;
  swapUsdValue?: string;
  useIncurredSlippageForQuoting?: boolean;
  otherRoutePlans?: any;
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

export default function SwapScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, walletService, reconnectWallet } = useApp(); 
  
  // Swap state
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]); // SOL
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null);
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [maxAmount, setMaxAmount] = useState('0');
  const [availableTokens, setAvailableTokens] = useState(COMMON_TOKENS);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<'from' | 'to'>('from');
  const [connectionCheckInterval, setConnectionCheckInterval] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Simplified wallet connection validation
  const validateWalletConnection = useCallback(async (): Promise<boolean> => {
    if (!walletInfo || !walletService) {
      return false;
    }

    try {
      // Only validate network connection, not auth tokens
      return await walletService.validateConnection();
    } catch (error) {
      console.error('Wallet connection validation failed:', error);
      return false;
    }
  }, [walletInfo, walletService]);

  // Load available tokens from Jupiter
  useEffect(() => {
    loadJupiterTokens();
  }, []);

  const loadJupiterTokens = async () => {
    try {
      const response = await fetch('https://token.jup.ag/strict');
      const tokens = await response.json();
      
      const formattedTokens = tokens
        .filter((token: any) => token.daily_volume > 1000)
        .slice(0, 50)
        .map((token: any) => ({
          symbol: token.symbol,
          name: token.name,
          mint: token.address,
          decimals: token.decimals,
        }));
      
      const allTokens = [...COMMON_TOKENS];
      formattedTokens.forEach((token: any) => {
        if (!allTokens.find(t => t.mint === token.mint)) {
          allTokens.push(token);
        }
      });
      
      setAvailableTokens(allTokens);
      console.log('Loaded Jupiter tokens:', allTokens.length);
    } catch (error) {
      console.error('Error loading Jupiter tokens:', error);
      setAvailableTokens(COMMON_TOKENS);
    }
  };

  // Simplified connection health monitoring
  useEffect(() => {
    if (walletInfo && walletService) {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }

      const intervalId = setInterval(async () => {
        try {
          const isValid = await validateWalletConnection();
          if (isValid) {
            console.log('Wallet connection health check: OK');
            setRetryCount(0);
          } else {
            console.warn('Wallet connection health check failed');
            setRetryCount(prev => prev + 1);
          }
        } catch (error) {
          console.warn('Wallet connection health check error:', error);
          setRetryCount(prev => prev + 1);
        }
      }, NetworkConfig.CONNECTION_CHECK_INTERVAL);

      setConnectionCheckInterval(intervalId as unknown as number);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } else {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        setConnectionCheckInterval(null);
      }
    }
  }, [walletInfo, walletService, validateWalletConnection]);

  // Debounced quote fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken && fromToken.mint !== toToken.mint) {
        getJupiterQuote();
      } else {
        setToAmount('');
        setQuote(null);
      }
    }, NetworkConfig.QUOTE_DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, slippage]);

  // Load wallet balances
  useEffect(() => {
    if (walletInfo && walletService) {
      loadWalletBalances();
    }
  }, [walletInfo, fromToken]);

  const loadWalletBalances = async () => {
    if (!walletInfo || !walletService) return;

    try {
      console.log('Loading wallet balances...');
      
      // Just load balances directly - no auth validation
      const balances = await walletService.getTokenBalances(walletInfo.publicKey);
      console.log('Token balances loaded successfully:', balances.length, 'tokens');
      
      setTokenBalances(balances);
      
      // Set max amount for selected token
      const selectedTokenBalance = balances.find(
        (token: any) => token.mint?.toString() === fromToken.mint
      );
      
      if (selectedTokenBalance && selectedTokenBalance.balance > 0) {
        setMaxAmount(selectedTokenBalance.balance.toString());
        console.log('Found token balance for', fromToken.symbol, ':', selectedTokenBalance.balance);
      } else if (fromToken.symbol === 'SOL') {
        // For SOL, use wallet balance but reserve some for fees
        const reserveAmount = 0.005; // Reserve 0.005 SOL for fees
        const availableBalance = Math.max(0, walletInfo.balance - reserveAmount);
        setMaxAmount(availableBalance.toFixed(9));
        console.log('Using SOL balance:', availableBalance, 'SOL');
      } else {
        setMaxAmount('0');
        console.log('No balance found for token:', fromToken.symbol);
      }
      
    } catch (error) {
      console.error('Error loading wallet balances:', error);
      
      // Only show reconnection prompt if we have many consecutive failures
      if (retryCount > NetworkConfig.RECONNECTION_RETRY_THRESHOLD) {
        Alert.alert(
          'Connection Issues',
          'Having trouble loading balances. Would you like to reconnect?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reconnect', onPress: () => handleWalletReconnect() }
          ]
        );
        setRetryCount(0);
      }
    }
  };

  const handleWalletReconnect = async (showSuccessAlert: boolean = true) => {
    try {
      setLoading(true);
      console.log('Attempting wallet reconnection...');
      
      if (walletService && walletService.reconnectWallet) {
        await walletService.reconnectWallet();
        await loadWalletBalances();
        console.log('Wallet reconnected successfully');
        
        if (showSuccessAlert) {
          Alert.alert('Success', 'Wallet reconnected successfully!');
        }
      } else if (reconnectWallet) {
        await reconnectWallet();
        await loadWalletBalances();
        console.log('Wallet reconnected successfully via context');
        
        if (showSuccessAlert) {
          Alert.alert('Success', 'Wallet reconnected successfully!');
        }
      } else {
        throw new Error('Reconnection method not available');
      }
    } catch (error) {
      console.error('Wallet reconnection failed:', error);
      Alert.alert(
        'Reconnection Failed', 
        'Failed to reconnect wallet. Please manually disconnect and reconnect your wallet in the settings.',
        [
          { text: 'OK' },
          { text: 'Go to Settings', onPress: () => router.push('/settings') }
        ]
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getJupiterQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setQuoteLoading(true);
    try {
      const amountInSmallestUnit = Math.floor(
        parseFloat(fromAmount) * Math.pow(10, fromToken.decimals)
      );
      const slippageBps = Math.floor(parseFloat(slippage) * 100);
      
      console.log('Getting Jupiter quote:', {
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        amount: amountInSmallestUnit.toString(),
        slippageBps
      });
      
      const quoteUrl = new URL(`${JUPITER_API_BASE_URL}/quote`);
      quoteUrl.searchParams.append('inputMint', fromToken.mint);
      quoteUrl.searchParams.append('outputMint', toToken.mint);
      quoteUrl.searchParams.append('amount', amountInSmallestUnit.toString());
      quoteUrl.searchParams.append('slippageBps', slippageBps.toString());
      quoteUrl.searchParams.append('onlyDirectRoutes', 'false');
      quoteUrl.searchParams.append('asLegacyTransaction', 'false');
      quoteUrl.searchParams.append('platformFeeBps', '0');
      quoteUrl.searchParams.append('maxAccounts', '64');
      
      console.log('Jupiter API URL:', quoteUrl.toString());
      
      const response = await Promise.race([
        fetch(quoteUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Jupiter quote API timeout')), NetworkConfig.JUPITER_QUOTE_TIMEOUT)
        )
      ]);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Jupiter API error response:', errorData);
        
        if (errorData.errorCode === 'TOKEN_NOT_TRADABLE') {
          throw new Error(`${fromToken.symbol} or ${toToken.symbol} is not tradable on Jupiter. Please select different tokens.`);
        } else if (errorData.error && errorData.error.includes('No routes found')) {
          throw new Error(`No trading route found between ${fromToken.symbol} and ${toToken.symbol}. Try a different token pair.`);
        }
        
        throw new Error(`Jupiter API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const quoteData: JupiterQuoteResponse = await response.json();
      console.log('Jupiter quote received:', quoteData);
      
      setQuote(quoteData);
      
      const outputAmount = parseFloat(quoteData.outAmount) / Math.pow(10, toToken.decimals);
      setToAmount(outputAmount.toFixed(6));
      
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      setToAmount('');
      setQuote(null);
      
      if (error instanceof Error && !error.message.includes('fetch')) {
        Alert.alert(
          'Quote Error', 
          error.message || 'Unable to get swap quote. Please try again.'
        );
      }
    } finally {
      setQuoteLoading(false);
    }
  };

  const executeJupiterSwap = async (retryAttempt: boolean = false) => {
    if (!walletInfo || !walletInfo.publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!quote) {
      Alert.alert('Error', 'Please wait for quote to load');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Executing Jupiter swap with quote:', quote);
      
      // Step 1: Get swap transaction from Jupiter API
      const swapPayload = {
        quoteResponse: quote,
        userPublicKey: walletInfo.publicKey.toString(),
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000, // 0.001 SOL max priority fee
            priorityLevel: 'medium'
          }
        },
        asLegacyTransaction: false,
        useSharedAccounts: false,
      };
      
      console.log('Getting swap transaction from Jupiter...');
      
      const swapResponse = await Promise.race([
        fetch(`${JUPITER_API_BASE_URL}/swap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(swapPayload)
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Jupiter API timeout')), NetworkConfig.JUPITER_SWAP_TIMEOUT)
        )
      ]);
      
      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        console.error('Jupiter swap API error:', errorText);
        throw new Error(`Jupiter swap API error: ${swapResponse.status} - ${errorText}`);
      }
      
      const swapData: JupiterSwapResponse = await swapResponse.json();
      console.log('Jupiter swap transaction received');
      
      // Step 2: Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      console.log('Transaction deserialized, sending to wallet for signing...');
      
      // Step 3: Send transaction - let WalletService handle all auth logic
      if (!walletService) {
        throw new Error('Wallet service not available');
      }
      
      let txid;
      try {
        // The WalletService will handle auth token validation and retry logic
        txid = await walletService.sendTransaction(transaction);
        console.log('Transaction sent successfully:', txid);
      } catch (authError: any) {
        console.error('Transaction failed:', authError);
        
        // Handle specific wallet authentication errors
        if (authError.message === 'WALLET_AUTH_EXPIRED') {
          
          if (!retryAttempt) {
            // Show reconnection dialog and retry
            Alert.alert(
              'Wallet Session Expired',
              'Your wallet session has expired. The app will reconnect and retry the swap.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reconnect & Retry', 
                  onPress: async () => {
                    try {
                      console.log('Manual reconnect triggered by user...');
                      await handleWalletReconnect(false);
                      console.log('Manual reconnect successful, retrying swap...');
                      
                      // Wait for wallet to stabilize
                      await new Promise(resolve => setTimeout(resolve, NetworkConfig.WALLET_RECONNECT_WAIT));
                      
                      // Retry the swap
                      executeJupiterSwap(true);
                    } catch (reconnectError) {
                      console.error('Manual reconnection failed:', reconnectError);
                      Alert.alert('Error', 'Failed to reconnect. Please try disconnecting and reconnecting your wallet manually.');
                    }
                  }
                }
              ]
            );
            return;
          } else {
            throw new Error('Wallet authentication failed after reconnection. Please try again.');
          }
        }
        
        // Re-throw other errors
        throw authError;
      }
      
      console.log('Swap completed successfully:', txid);
      
      Alert.alert(
        'Swap Successful! 🎉',
        `Successfully swapped ${fromAmount} ${fromToken.symbol} for approximately ${toAmount} ${toToken.symbol}\n\nTransaction ID: ${txid.slice(0, 8)}...${txid.slice(-8)}`,
        [
          { text: 'OK' },
          { 
            text: 'View on Explorer', 
            onPress: () => {
              console.log('Open transaction:', `https://solscan.io/tx/${txid}`);
            }
          }
        ]
      );
      
      // Reset form and reload balances
      setFromAmount('');
      setToAmount('');
      setQuote(null);
      setRetryCount(0);
      
      // Reload wallet balances after successful swap
      setTimeout(() => {
        loadWalletBalances();
      }, NetworkConfig.BALANCE_RELOAD_DELAY);
      
    } catch (error) {
      console.error('Error executing Jupiter swap:', error);
      
      let errorMessage = 'Failed to execute swap. Please try again.';
      
      if (error instanceof Error) {
        if (error.message === 'WALLET_AUTH_EXPIRED') {
          errorMessage = 'Wallet session expired. Please reconnect your wallet and try again.';
        } else if (error.message.includes('Insufficient funds')) {
          errorMessage = 'Insufficient funds for this transaction including network fees.';
        } else if (error.message.includes('Slippage tolerance exceeded')) {
          errorMessage = 'Price changed too much during swap. Try increasing slippage tolerance or reducing amount.';
        } else if (error.message.includes('Transaction failed')) {
          errorMessage = 'Transaction failed on the blockchain. This may be due to high network congestion or price volatility. Please try again.';
        } else if (error.message.includes('No routes found')) {
          errorMessage = 'No trading route available for this token pair. Try selecting different tokens.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Swap Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!walletInfo) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!walletService) {
      Alert.alert('Error', 'Wallet service not available');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check if tokens are the same
    if (fromToken.mint === toToken.mint) {
      Alert.alert('Error', 'Cannot swap the same token. Please select different tokens.');
      return;
    }

    // Check if user has sufficient balance
    const availableBalance = parseFloat(maxAmount);
    const requestedAmount = parseFloat(fromAmount);
    
    console.log('Balance check:', {
      availableBalance,
      fromToken: fromToken.symbol,
      requestedAmount,
    });
    
    if (requestedAmount > availableBalance) {
      Alert.alert(
        'Insufficient Balance', 
        `You only have ${availableBalance.toFixed(6)} ${fromToken.symbol} available${fromToken.symbol === 'SOL' ? ' (network fees reserved)' : ''}`
      );
      return;
    }

    if (!quote) {
      Alert.alert('Error', 'Please wait for quote to load');
      return;
    }

    // Check for high price impact
    const priceImpact = parseFloat(quote.priceImpactPct);
    if (priceImpact > 5) {
      Alert.alert(
        'High Price Impact Warning',
        `This swap has a high price impact of ${priceImpact.toFixed(2)}%. You may receive significantly less tokens than expected. Do you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Anyway', style: 'destructive', onPress: () => showSwapConfirmation() }
        ]
      );
      return;
    }

    showSwapConfirmation();
  };

  const showSwapConfirmation = () => {
    if (!quote) return;
    
    const minReceived = (parseFloat(quote.otherAmountThreshold) / Math.pow(10, toToken.decimals)).toFixed(6);
    const priceImpact = parseFloat(quote.priceImpactPct);
    const rate = (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6);
    
    Alert.alert(
      'Confirm Swap',
      `Swap Details:
      
From: ${fromAmount} ${fromToken.symbol}
To: ~${toAmount} ${toToken.symbol}
Rate: 1 ${fromToken.symbol} = ${rate} ${toToken.symbol}

Price Impact: ${priceImpact.toFixed(3)}%
Slippage Tolerance: ${slippage}%
Minimum Received: ${minReceived} ${toToken.symbol}

Network fees will be deducted from your SOL balance.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Swap', onPress: () => executeJupiterSwap() }
      ]
    );
  };

  const handleTokenSelect = (token: any, isFrom: boolean) => {
    if (isFrom) {
      if (token.mint === toToken.mint) {
        setFromToken(token);
        setToToken(fromToken);
      } else {
        setFromToken(token);
      }
      
      setFromAmount('');
      setToAmount('');
      setQuote(null);
      
    } else {
      if (token.mint === fromToken.mint) {
        setToToken(token);
        setFromToken(toToken);
        setFromAmount('');
        setToAmount('');
        setQuote(null);
      } else {
        setToToken(token);
      }
    }
    
    setShowTokenSelector(false);
    
    setTimeout(() => {
      loadWalletBalances();
    }, 100);
  };

  const openTokenSelector = (type: 'from' | 'to') => {
    setTokenSelectorType(type);
    setShowTokenSelector(true);
  };

  const setMaxAmountValue = () => {
    const maxAmountFloat = parseFloat(maxAmount);
    if (maxAmountFloat > 0) {
      const precision = Math.min(fromToken.decimals || 6, 9);
      let formattedAmount = maxAmountFloat.toFixed(precision);
      formattedAmount = parseFloat(formattedAmount).toString();
      setFromAmount(formattedAmount);
    }
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.tokenSelectorItem, { backgroundColor: theme.colors.background }]}
      onPress={() => handleTokenSelect(item, tokenSelectorType === 'from')}
      disabled={
        (tokenSelectorType === 'from' && item.mint === toToken.mint) ||
        (tokenSelectorType === 'to' && item.mint === fromToken.mint)
      }
    >
      <View style={styles.tokenSelectorInfo}>
        <View style={[
          styles.tokenSelectorIcon, 
          { 
            backgroundColor: theme.colors.primary,
            opacity: (tokenSelectorType === 'from' && item.mint === toToken.mint) ||
                    (tokenSelectorType === 'to' && item.mint === fromToken.mint) ? 0.3 : 1
          }
        ]}>
          <AppText style={styles.tokenSelectorIconText}>{item.symbol.charAt(0)}</AppText>
        </View>
        <View>
          <AppText style={[
            styles.tokenSelectorSymbol, 
            { 
              color: theme.colors.text,
              opacity: (tokenSelectorType === 'from' && item.mint === toToken.mint) ||
                      (tokenSelectorType === 'to' && item.mint === fromToken.mint) ? 0.3 : 1
            }
          ]}>
            {item.symbol}
          </AppText>
          <AppText style={[
            styles.tokenSelectorName, 
            { 
              color: theme.colors.muted,
              opacity: (tokenSelectorType === 'from' && item.mint === toToken.mint) ||
                      (tokenSelectorType === 'to' && item.mint === fromToken.mint) ? 0.3 : 1
            }
          ]}>
            {item.name}
          </AppText>
        </View>
      </View>
      {((tokenSelectorType === 'from' && item.mint === toToken.mint) ||
        (tokenSelectorType === 'to' && item.mint === fromToken.mint)) ? (
        <AppText style={[styles.selectedText, { color: theme.colors.muted }]}>Selected as {tokenSelectorType === 'from' ? 'To' : 'From'}</AppText>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
      )}
    </TouchableOpacity>
  );

  const handleAmountChange = (amount: string, isFrom: boolean) => {
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    const parts = cleanAmount.split('.');
    const formattedAmount = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleanAmount;
    
    if (isFrom) {
      setFromAmount(formattedAmount);
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    
    setFromAmount('');
    setToAmount('');
    setQuote(null);
    
    setTimeout(() => {
      loadWalletBalances();
    }, 100);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, [connectionCheckInterval]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      {!hideHeader && (
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>Swap</AppText>
          <TouchableOpacity onPress={swapTokens} style={styles.swapButton}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Info Header */}
        {walletInfo && (
          <View style={[styles.walletCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.walletHeader}>
              <View>
                <AppText style={[styles.walletLabel, { color: theme.colors.muted }]}>Connected Wallet</AppText>
                <AppText style={[styles.walletAddress, { color: theme.colors.text }]}>
                  {walletInfo.publicKey.toString().slice(0, 6)}...
                  {walletInfo.publicKey.toString().slice(-4)}
                </AppText>
              </View>
              <View style={styles.walletBalance}>
                <AppText style={[styles.balanceLabel, { color: theme.colors.muted }]}>SOL Balance</AppText>
                <AppText style={[styles.balanceAmount, { color: theme.colors.text }]}>
                  {walletInfo.balance.toFixed(4)} SOL
                </AppText>
              </View>
            </View>
            
            {/* Connection Status Indicator */}
            <View style={styles.connectionStatus}>
              <View style={[
                styles.connectionIndicator, 
                { backgroundColor: retryCount > 2 ? '#ef4444' : '#10b981' }
              ]} />
              <AppText style={[styles.connectionText, { color: theme.colors.muted }]}>
                {retryCount > 2 ? 'Connection Issues' : 'Connected'}
              </AppText>
              {retryCount > 2 && (
                <TouchableOpacity onPress={() => handleWalletReconnect()} style={styles.reconnectButton}>
                  <AppText style={[styles.reconnectText, { color: theme.colors.primary }]}>Reconnect</AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* From Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.tokenHeader}>
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>From</AppText>
            {parseFloat(maxAmount) > 0 && (
              <TouchableOpacity onPress={setMaxAmountValue} style={styles.maxButton}>
                <AppText style={[styles.maxButtonText, { color: theme.colors.primary }]}>
                  MAX: {parseFloat(maxAmount).toFixed(fromToken.symbol === 'SOL' ? 4 : 6)}
                  {fromToken.symbol === 'SOL' && ' (fees reserved)'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.tokenRow}>
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => openTokenSelector('from')}
            >
              <AppText style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                {fromToken.symbol}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: parseFloat(fromAmount || '0') > parseFloat(maxAmount) 
                  ? '#ef4444' 
                  : theme.colors.border 
              }]}
              placeholder="0.0"
              placeholderTextColor={theme.colors.muted}
              value={fromAmount}
              onChangeText={(text) => handleAmountChange(text, true)}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.tokenFooter}>
            <AppText style={[styles.tokenName, { color: theme.colors.muted }]}>
              {fromToken.name}
            </AppText>
            {parseFloat(fromAmount || '0') > parseFloat(maxAmount) && (
              <AppText style={[styles.errorText, { color: '#ef4444' }]}>
                Insufficient balance
              </AppText>
            )}
          </View>
        </View>

        {/* Swap Arrow */}
        <View style={styles.swapArrowContainer}>
          <TouchableOpacity 
            style={[styles.swapArrow, { backgroundColor: theme.colors.primary }]}
            onPress={swapTokens}
          >
            <Ionicons name="swap-vertical" size={20} color={theme.colors.background} />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>To</AppText>
          
          <View style={styles.tokenRow}>
            <TouchableOpacity 
              style={styles.tokenSelector}
              onPress={() => openTokenSelector('to')}
            >
              <AppText style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                {toToken.symbol}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
            </TouchableOpacity>
            
            <View style={[styles.amountInput, { 
              backgroundColor: theme.colors.background, 
              borderColor: theme.colors.border,
              justifyContent: 'center'
            }]}>
              {quoteLoading ? (
                <AppText style={[styles.loadingText, { color: theme.colors.muted }]}>Loading...</AppText>
              ) : (
                <AppText style={[styles.estimatedAmount, { color: theme.colors.text }]}>
                  {toAmount || '0.0'}
                </AppText>
              )}
            </View>
          </View>
          
          <AppText style={[styles.tokenName, { color: theme.colors.muted }]}>
            {toToken.name}
          </AppText>
        </View>

        {/* Quote Information */}
        {quote && (
          <View style={[styles.quoteCard, { backgroundColor: theme.colors.card }]}>
            <AppText style={[styles.quoteTitle, { color: theme.colors.text }]}>Swap Details</AppText>
            
            <View style={styles.quoteRow}>
              <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Rate</AppText>
              <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
              </AppText>
            </View>
            
            <View style={styles.quoteRow}>
              <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Price Impact</AppText>
              <AppText style={[styles.quoteValue, { 
                color: parseFloat(quote.priceImpactPct) > 1 ? '#ef4444' : 
                       parseFloat(quote.priceImpactPct) > 0.5 ? '#f59e0b' : theme.colors.text 
              }]}>
                {parseFloat(quote.priceImpactPct).toFixed(4)}%
              </AppText>
            </View>
            
            <View style={styles.quoteRow}>
              <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Slippage</AppText>
              <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                {slippage}%
              </AppText>
            </View>

            <View style={styles.quoteRow}>
              <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Minimum Received</AppText>
              <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                {(parseFloat(quote.otherAmountThreshold) / Math.pow(10, toToken.decimals)).toFixed(6)} {toToken.symbol}
              </AppText>
            </View>
          </View>
        )}

        {/* Slippage Settings */}
        <View style={[styles.slippageCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Slippage Tolerance</AppText>
          
          <View style={styles.slippageOptions}>
            {['0.1', '0.5', '1.0'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.slippageOption,
                  { 
                    backgroundColor: slippage === option ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border 
                  }
                ]}
                onPress={() => setSlippage(option)}
              >
                <AppText style={[
                  styles.slippageText,
                  { color: slippage === option ? theme.colors.background : theme.colors.text }
                ]}>
                  {option}%
                </AppText>
              </TouchableOpacity>
            ))}
            
            <View style={[styles.customSlippage, { borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.slippageInput, { color: theme.colors.text }]}
                placeholder="Custom"
                placeholderTextColor={theme.colors.muted}
                value={slippage}
                onChangeText={setSlippage}
                keyboardType="numeric"
              />
              <AppText style={[styles.slippagePercent, { color: theme.colors.muted }]}>%</AppText>
            </View>
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapActionButton,
            { 
              backgroundColor: loading || quoteLoading || !fromAmount || !quote || 
                            parseFloat(fromAmount || '0') > parseFloat(maxAmount) || 
                            fromToken.mint === toToken.mint
                ? theme.colors.muted 
                : theme.colors.primary 
            }
          ]}
          onPress={handleSwap}
          disabled={loading || quoteLoading || !fromAmount || !quote || 
                   parseFloat(fromAmount || '0') > parseFloat(maxAmount) ||
                   fromToken.mint === toToken.mint}
        >
          {loading ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Swapping...</AppText>
          ) : quoteLoading ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Getting Quote...</AppText>
          ) : fromToken.mint === toToken.mint ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Select Different Tokens</AppText>
          ) : parseFloat(fromAmount || '0') > parseFloat(maxAmount) ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Insufficient Balance</AppText>
          ) : (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>
              {quote ? `Swap ${fromAmount} ${fromToken.symbol}` : 'Enter Amount'}
            </AppText>
          )}
        </TouchableOpacity>

        {/* Route Information */}
        {quote && quote.routePlan && quote.routePlan.length > 0 && (
          <View style={[styles.routeCard, { backgroundColor: theme.colors.card }]}>
            <AppText style={[styles.routeTitle, { color: theme.colors.text }]}>Trading Route</AppText>
            <AppText style={[styles.routeText, { color: theme.colors.muted }]}>
              {quote.routePlan.length} step{quote.routePlan.length > 1 ? 's' : ''} via Jupiter aggregator
            </AppText>
            {quote.swapUsdValue && (
              <AppText style={[styles.routeValue, { color: theme.colors.text }]}>
                ~${parseFloat(quote.swapUsdValue).toFixed(2)} USD
              </AppText>
            )}
          </View>
        )}
      </ScrollView>

      {/* Token Selector Modal */}
      <Modal
        visible={showTokenSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTokenSelector(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card }]}>
            <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Token {tokenSelectorType === 'from' ? '(From)' : '(To)'}
            </AppText>
            <TouchableOpacity onPress={() => setShowTokenSelector(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableTokens}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.mint}
            style={styles.tokenList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  swapButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 150,
  },
  walletCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  walletBalance: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    flex: 1,
  },
  reconnectButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  reconnectText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokenCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 12,
  },
  maxButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  maxButtonText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenSymbol: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    marginLeft: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'right',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'right',
  },
  estimatedAmount: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'right',
  },
  tokenFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenName: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  swapArrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  quoteTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  quoteValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  slippageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  slippageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slippageOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  slippageText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  customSlippage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  slippageInput: {
    width: 60,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  slippagePercent: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginLeft: 4,
  },
  swapActionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  swapButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  routeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenList: {
    flex: 1,
    padding: 16,
  },
  tokenSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  tokenSelectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSelectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenSelectorIconText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#000000',
  },
  tokenSelectorSymbol: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 2,
  },
  tokenSelectorName: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  selectedText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    fontStyle: 'italic',
  },
});