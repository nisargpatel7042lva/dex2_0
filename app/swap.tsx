import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
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

// Common token mints
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112' },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
  { symbol: 'SRM', name: 'Serum', mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt' },
];

export default function SwapScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, getJupiterQuote, executeJupiterSwap, getTokenPrice } = useApp();
  
  // Swap state
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]); // SOL
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

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
    
    setQuoteLoading(true);
    try {
      // Convert amount to lamports (assuming 9 decimals for most tokens)
      const amountInLamports = Math.floor(parseFloat(fromAmount) * Math.pow(10, 9));
      const slippageBps = Math.floor(parseFloat(slippage) * 100);
      
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
      setToAmount('');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
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
      const signature = await executeJupiterSwap(quote, true);
      
      Alert.alert(
        'Swap Successful!',
        `Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}\n\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Error', 'Swap failed. Please try again.');
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
            <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>To</AppText>
          
          <View style={styles.tokenRow}>
            <TouchableOpacity style={styles.tokenSelector}>
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
              backgroundColor: loading || quoteLoading || !fromAmount || !quote 
                ? theme.colors.muted 
                : theme.colors.primary 
            }
          ]}
          onPress={handleSwap}
          disabled={loading || quoteLoading || !fromAmount || !quote}
        >
          {loading ? (
            <AppText style={styles.swapButtonText}>Swapping...</AppText>
          ) : quoteLoading ? (
            <AppText style={styles.swapButtonText}>Getting Quote...</AppText>
          ) : (
            <AppText style={styles.swapButtonText}>Swap</AppText>
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
    color: '#FFFFFF',
  },
}); 