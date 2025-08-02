import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { VersionedTransaction } from '@solana/web3.js';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { WalletInfo } from '../src/services/WalletService';

// Common token mints for mainnet - Updated with correct addresses
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 }, // Correct mainnet USDC
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
}

interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

export default function SwapScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, walletService, connection } = useApp(); 
  
  // Swap state
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]); // SOL
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<JupiterQuoteResponse | null>(null);
  const [tokenBalances, setTokenBalances] = useState<WalletInfo[]>([]);
  const [maxAmount, setMaxAmount] = useState('0');
  const [availableTokens, setAvailableTokens] = useState(COMMON_TOKENS);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [tokenSelectorType, setTokenSelectorType] = useState<'from' | 'to'>('from');

  // Load available tokens from Jupiter
  useEffect(() => {
    loadJupiterTokens();
  }, []);

  const loadJupiterTokens = async () => {
    try {
      // Fetch tradable tokens from Jupiter
      const response = await fetch('https://token.jup.ag/strict');
      const tokens = await response.json();
      
      // Filter and format tokens
      const formattedTokens = tokens
        .filter((token: any) => token.daily_volume > 1000) // Only tokens with decent volume
        .slice(0, 20) // Limit to top 20 tokens
        .map((token: any) => ({
          symbol: token.symbol,
          name: token.name,
          mint: token.address,
          decimals: token.decimals,
        }));
      
      // Combine with common tokens and remove duplicates
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
      // Fall back to common tokens if API fails
      setAvailableTokens(COMMON_TOKENS);
    }
  };

  // Get quote when amount or tokens change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken) {
      getJupiterQuote();
    } else {
      setToAmount('');
      setQuote(null);
    }
  }, [fromAmount, fromToken, toToken, slippage]);

  // Load wallet balances
  useEffect(() => {
    loadWalletBalances();
  }, [walletInfo, fromToken]);

  // Debug balance changes
  useEffect(() => {
    console.log('Balance Debug:', {
      fromToken: fromToken.symbol,
      maxAmount,
      fromAmount,
      walletBalance: walletInfo?.balance,
      hasInsufficientBalance: parseFloat(fromAmount) > parseFloat(maxAmount)
    });
  }, [fromAmount, maxAmount, fromToken, walletInfo]);

  const loadWalletBalances = async () => {
    if (!walletInfo || !walletService) return;

    try {
      const balances = await walletService.getTokenBalances();
      setTokenBalances(balances);
      
      // Set max amount for selected token
      const selectedTokenBalance = balances.find(
        token => token.mint.toString() === fromToken.mint
      );
      
      if (selectedTokenBalance) {
        setMaxAmount(selectedTokenBalance.balance.toString());
      } else if (fromToken.symbol === 'SOL') {
        // For SOL, use wallet balance but reserve some for fees
        const reserveAmount = 0.01; // Reserve 0.01 SOL for fees
        const availableBalance = Math.max(0, walletInfo.balance - reserveAmount);
        setMaxAmount(availableBalance.toFixed(9)); // Use 9 decimals for SOL precision
      } else {
        setMaxAmount('0');
      }
      
      console.log('Updated maxAmount:', maxAmount, 'for token:', fromToken.symbol);
    } catch (error) {
      console.error('Error loading wallet balances:', error);
    }
  };

  const getJupiterQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setQuoteLoading(true);
    try {
      // Convert amount to smallest unit based on token decimals
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
      
      // Build quote request URL
      const quoteUrl = new URL(`${JUPITER_API_BASE_URL}/quote`);
      quoteUrl.searchParams.append('inputMint', fromToken.mint);
      quoteUrl.searchParams.append('outputMint', toToken.mint);
      quoteUrl.searchParams.append('amount', amountInSmallestUnit.toString());
      quoteUrl.searchParams.append('slippageBps', slippageBps.toString());
      quoteUrl.searchParams.append('onlyDirectRoutes', 'false');
      quoteUrl.searchParams.append('asLegacyTransaction', 'false');
      
      console.log('Jupiter API URL:', quoteUrl.toString());
      
      const response = await fetch(quoteUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Jupiter API error response:', errorData);
        
        // Handle specific errors
        if (errorData.errorCode === 'TOKEN_NOT_TRADABLE') {
          throw new Error(`${fromToken.symbol} or ${toToken.symbol} is not tradable on Jupiter. Please select different tokens.`);
        }
        
        throw new Error(`Jupiter API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const quoteData: JupiterQuoteResponse = await response.json();
      
      console.log('Jupiter quote received:', quoteData);
      
      setQuote(quoteData);
      
      // Convert output amount from smallest unit to readable format
      const outputAmount = parseFloat(quoteData.outAmount) / Math.pow(10, toToken.decimals);
      setToAmount(outputAmount.toFixed(6));
      
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      setToAmount('');
      setQuote(null);
      Alert.alert(
        'Quote Error', 
        error instanceof Error ? error.message : 'Unable to get swap quote. Please try again.'
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  const executeJupiterSwap = async () => {
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
      const swapResponse = await fetch(`${JUPITER_API_BASE_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: walletInfo.publicKey.toString(),
          wrapAndUnwrapSol: true,
          // Optional: Add priority fee
          // prioritizationFeeLamports: 1000,
          // Optional: Add referral fee
          // feeAccount: "YOUR_FEE_ACCOUNT_PUBLIC_KEY"
        })
      });
      
      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        throw new Error(`Jupiter swap API error: ${swapResponse.status} - ${errorText}`);
      }
      
      const swapData: JupiterSwapResponse = await swapResponse.json();
      
      console.log('Jupiter swap transaction received');
      
      // Step 2: Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      console.log('Transaction deserialized, requesting signature...');
      
      // Step 3: Sign the transaction
      // This depends on your wallet implementation
      // For most wallet adapters, you would do:
      const signedTransaction = await walletInfo.signTransaction(transaction);
      
      // Step 4: Send the signed transaction
      if (!connection) {
        throw new Error('No connection available');
      }
      
      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      });
      
      console.log('Transaction sent:', txid);
      
      // Step 5: Confirm the transaction
      const confirmation = await connection.confirmTransaction({
        blockhash: (await connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: swapData.lastValidBlockHeight,
        signature: txid
      });
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log('Transaction confirmed:', txid);
      
      Alert.alert(
        'Swap Successful!',
        `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}\n\nTransaction: ${txid.slice(0, 8)}...${txid.slice(-8)}\n\nView on Solscan: https://solscan.io/tx/${txid}`,
        [
          { text: 'OK' },
          { 
            text: 'View Transaction', 
            onPress: () => {
              // You can implement opening the transaction in a browser here
              console.log('Open transaction:', `https://solscan.io/tx/${txid}`);
            }
          }
        ]
      );
      
      // Reset form and reload balances
      setFromAmount('');
      setToAmount('');
      setQuote(null);
      
      // Reload wallet balances after successful swap
      await loadWalletBalances();
      
    } catch (error) {
      console.error('Error executing Jupiter swap:', error);
      Alert.alert(
        'Swap Error', 
        error instanceof Error ? error.message : 'Failed to execute swap. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!walletInfo) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check if user has sufficient balance with proper precision
    const availableBalance = parseFloat(maxAmount);
    const requestedAmount = parseFloat(fromAmount);
    
    console.log('Balance check:', {
      availableBalance,
      requestedAmount,
      fromToken: fromToken.symbol,
      walletBalance: walletInfo.balance
    });
    
    if (requestedAmount > availableBalance) {
      Alert.alert(
        'Insufficient Balance', 
        `You only have ${availableBalance.toFixed(6)} ${fromToken.symbol} available${fromToken.symbol === 'SOL' ? ' (0.01 SOL reserved for fees)' : ''}`
      );
      return;
    }

    if (!quote) {
      Alert.alert('Error', 'Please wait for quote to load');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Swap',
      `Are you sure you want to swap ${fromAmount} ${fromToken.symbol} for approximately ${toAmount} ${toToken.symbol}?\n\nPrice Impact: ${parseFloat(quote.priceImpactPct).toFixed(2)}%\nSlippage: ${slippage}%\n\nMinimum Received: ${(parseFloat(quote.otherAmountThreshold) / Math.pow(10, toToken.decimals)).toFixed(6)} ${toToken.symbol}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: executeJupiterSwap }
      ]
    );
  };

  const handleTokenSelect = (token: any, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token);
      // Clear the amount when changing tokens
      setFromAmount('');
      
      // Update max amount when changing from token
      const selectedTokenBalance = tokenBalances.find(
        balance => balance.mint.toString() === token.mint
      );
      
      if (selectedTokenBalance) {
        setMaxAmount(selectedTokenBalance.balance.toString());
      } else if (token.symbol === 'SOL' && walletInfo) {
        const reserveAmount = 0.01;
        const availableBalance = Math.max(0, walletInfo.balance - reserveAmount);
        setMaxAmount(availableBalance.toFixed(9));
      } else {
        setMaxAmount('0');
      }
      
      console.log('Token selected:', token.symbol, 'Max amount:', maxAmount);
    } else {
      setToToken(token);
    }
    setShowTokenSelector(false);
  };

  const openTokenSelector = (type: 'from' | 'to') => {
    setTokenSelectorType(type);
    setShowTokenSelector(true);
  };

  const setMaxAmountValue = () => {
    const maxAmountFloat = parseFloat(maxAmount);
    if (maxAmountFloat > 0) {
      // Use appropriate precision based on token decimals
      const precision = fromToken.decimals || 6;
      const formattedAmount = maxAmountFloat.toFixed(Math.min(precision, 9));
      setFromAmount(formattedAmount);
    }
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.tokenSelectorItem, { backgroundColor: theme.colors.background }]}
      onPress={() => handleTokenSelect(item, tokenSelectorType === 'from')}
    >
      <View style={styles.tokenSelectorInfo}>
        <View style={[styles.tokenSelectorIcon, { backgroundColor: theme.colors.primary }]}>
          <AppText style={styles.tokenSelectorIconText}>{item.symbol.charAt(0)}</AppText>
        </View>
        <View>
          <AppText style={[styles.tokenSelectorSymbol, { color: theme.colors.text }]}>{item.symbol}</AppText>
          <AppText style={[styles.tokenSelectorName, { color: theme.colors.muted }]}>{item.name}</AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  const handleAmountChange = (amount: string, isFrom: boolean) => {
    if (isFrom) {
      setFromAmount(amount);
    }
  };

  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

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
                borderColor: parseFloat(fromAmount) > parseFloat(maxAmount) 
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
            {parseFloat(fromAmount) > parseFloat(maxAmount) && (
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
            <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
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
            
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: theme.colors.border 
              }]}
              placeholder="0.0"
              placeholderTextColor={theme.colors.muted}
              value={toAmount}
              editable={false}
            />
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
                color: parseFloat(quote.priceImpactPct) > 1 ? theme.colors.error || '#ff4444' : theme.colors.text 
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
                    backgroundColor: slippage === option ? theme.colors.primary : theme.colors.background,
                    borderColor: theme.colors.border 
                  }
                ]}
                onPress={() => setSlippage(option)}
              >
                <AppText style={[
                  styles.slippageText,
                  { color: slippage === option ? '#FFFFFF' : theme.colors.text }
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
              backgroundColor: loading || quoteLoading || !fromAmount || !quote || parseFloat(fromAmount) > parseFloat(maxAmount)
                ? theme.colors.muted 
                : theme.colors.primary 
            }
          ]}
          onPress={handleSwap}
          disabled={loading || quoteLoading || !fromAmount || !quote || parseFloat(fromAmount) > parseFloat(maxAmount)}
        >
          {loading ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Swapping...</AppText>
          ) : quoteLoading ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Getting Quote...</AppText>
          ) : parseFloat(fromAmount) > parseFloat(maxAmount) ? (
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
            <AppText style={[styles.routeTitle, { color: theme.colors.text }]}>Route</AppText>
            <AppText style={[styles.routeText, { color: theme.colors.muted }]}>
              {quote.routePlan.length} step{quote.routePlan.length > 1 ? 's' : ''} via{' '}
              {quote.routePlan.map((step: any) => step.swapInfo?.label || 'DEX').join(' → ')}
            </AppText>
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
              Select Token
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
    paddingBottom: 100,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#FFFFFF',
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
});