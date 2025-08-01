import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { TokenIcon } from '@/components/TokenIcon';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Common token mints for testnet
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112' },
  { symbol: 'USDC', name: 'USD Coin', mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' }, // Testnet USDC
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
  { symbol: 'SRM', name: 'Serum', mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt' },
];

export default function SwapScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, getJupiterQuote, executeJupiterSwap, getTokenPrice, walletService } = useApp();
  
  // Real token data from blockchain
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]);
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  // Load real tokens from user's wallet
  useEffect(() => {
    const loadUserTokens = async () => {
      if (!walletInfo || !walletService) return;
      
      try {
        console.log('Loading user tokens for swap...');
        const tokenAccounts = await walletService.getTokenBalances(walletInfo.publicKey);
        
        // Convert to token format for swap
        const userTokens = tokenAccounts.map((account: any) => {
          const accountInfo = account.account.data.parsed.info;
          return {
            mint: accountInfo.mint,
            symbol: accountInfo.mint.slice(0, 4).toUpperCase(),
            name: `Token ${accountInfo.mint.slice(0, 8)}`,
            decimals: accountInfo.tokenAmount.decimals,
            balance: accountInfo.tokenAmount.uiAmount,
          };
        });

        // Add SOL to the list
        const allTokens = [
          {
            mint: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            name: 'Solana',
            decimals: 9,
            balance: walletInfo.balance,
          },
          ...userTokens
        ];

        setAvailableTokens(allTokens);
        console.log('Available tokens for swap:', allTokens);
      } catch (error) {
        console.error('Error loading user tokens:', error);
        // Fallback to common tokens
        setAvailableTokens(COMMON_TOKENS);
      }
    };

    loadUserTokens();
  }, [walletInfo, walletService]);

  // Get quote when amount or tokens change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken) {
      getQuote();
    } else {
      setToAmount('');
      setQuote(null);
    }
  }, [fromAmount, fromToken, toToken, slippage]);

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
    setLoading(true);
    try {
      // Convert amount to lamports (assuming 9 decimals for most tokens)
      const amountInLamports = Math.floor(parseFloat(fromAmount) * Math.pow(10, 9));
      const slippageBps = Math.floor(parseFloat(slippage) * 100);
      
      console.log('Requesting Jupiter quote:', {
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        amount: amountInLamports.toString(),
        slippageBps
      });
      
      const quoteData = await getJupiterQuote(
        fromToken.mint,
        toToken.mint,
        amountInLamports.toString(),
        slippageBps
      );
      
      setQuote(quoteData);
      // Convert output amount from lamports to tokens
      const outputAmount = parseFloat(quoteData.outAmount) / Math.pow(10, 9);
      setToAmount(outputAmount.toFixed(6));
    } catch (error) {
      console.error('Error getting quote:', error);
      
      // Fallback: provide a mock quote for demo purposes
      if (error instanceof Error && (error.message.includes('405') || error.message.includes('401'))) {
        console.log('Jupiter API not available, using mock quote for demo');
        const mockQuote = {
          inputMint: fromToken.mint,
          outputMint: toToken.mint,
          inAmount: (parseFloat(fromAmount) * Math.pow(10, 9)).toString(),
          outAmount: (parseFloat(fromAmount) * 0.95 * Math.pow(10, 9)).toString(), // Mock 5% slippage
          priceImpactPct: 0.5,
          swapMode: 'ExactIn',
        };
        setQuote(mockQuote);
        const outputAmount = parseFloat(fromAmount) * 0.95; // Mock conversion rate
        setToAmount(outputAmount.toFixed(6));
      } else {
        setToAmount('');
        setQuote(null);
        Alert.alert('Quote Error', 'Unable to get swap quote. Please try again.');
      }
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

    if (!quote) {
      Alert.alert('Error', 'Please wait for quote to load');
      return;
    }

    setLoading(true);
    
    try {
      // Check if this is a mock quote (for demo purposes)
      if (quote.swapMode === 'ExactIn' && quote.priceImpactPct === 0.5) {
        // This is a mock quote, simulate the swap
        console.log('Executing mock swap for demo');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
        
        const mockSignature = 'mock_swap_' + Date.now();
        Alert.alert(
          'Demo Swap Successful!',
          `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}\n\nThis is a demo transaction.\n\nTransaction: ${mockSignature.slice(0, 8)}...${mockSignature.slice(-8)}`,
          [{ text: 'OK' }]
        );
      } else {
        // Real Jupiter swap
        const signature = await executeJupiterSwap(quote, true);
        
        Alert.alert(
          'Swap Successful!',
          `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}\n\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
          [{ text: 'OK' }]
        );
      }
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (error) {
      console.error('Error executing swap:', error);
      Alert.alert('Swap Error', 'Failed to execute swap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: any, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token);
    } else {
      setToToken(token);
    }
  };

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
        {/* From Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>From</AppText>
          
          <View style={styles.tokenRow}>
            <TouchableOpacity style={styles.tokenSelector}>
              <TokenIcon 
                address={fromToken.mint} 
                symbol={fromToken.symbol} 
                size={24}
              />
              <AppText style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                {fromToken.symbol}
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
              value={fromAmount}
              onChangeText={(text) => handleAmountChange(text, true)}
              keyboardType="numeric"
            />
          </View>
          
          <AppText style={[styles.tokenName, { color: theme.colors.muted }]}>
            {fromToken.name}
          </AppText>
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
            <TouchableOpacity style={styles.tokenSelector}>
              <TokenIcon 
                address={toToken.mint} 
                symbol={toToken.symbol} 
                size={24}
              />
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
              <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                {quote.priceImpactPct?.toFixed(2) || '0.00'}%
              </AppText>
            </View>
            
            <View style={styles.quoteRow}>
              <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Slippage</AppText>
              <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                {slippage}%
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
              backgroundColor: loading || !fromAmount || !quote 
                ? theme.colors.muted 
                : theme.colors.primary 
            }
          ]}
          onPress={handleSwap}
          disabled={loading || !fromAmount || !quote}
        >
          {loading ? (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Swapping...</AppText>
          ) : (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>Swap</AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  tokenCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 12,
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
  tokenName: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
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
}); 