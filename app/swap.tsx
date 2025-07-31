import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SwapScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  
  // Swap state
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);

  // Mock token options
  const tokenOptions = [
    { symbol: 'SOL', name: 'Solana', icon: 'diamond' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'card' },
    { symbol: 'USDT', name: 'Tether', icon: 'card' },
    { symbol: 'RAY', name: 'Raydium', icon: 'flash' },
    { symbol: 'SRM', name: 'Serum', icon: 'trending-up' },
  ];

  const handleSwap = async () => {
    if (!walletInfo) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate swap (frontend only)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Swap Successful!',
        `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: string, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token);
    } else {
      setToToken(token);
    }
  };

  const handleAmountChange = (amount: string, isFrom: boolean) => {
    if (isFrom) {
      setFromAmount(amount);
      // Simulate price calculation
      if (amount && parseFloat(amount) > 0) {
        const mockRate = 20; // Mock SOL to USDC rate
        setToAmount((parseFloat(amount) * mockRate).toFixed(4));
      } else {
        setToAmount('');
      }
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
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>From</AppText>
          
          <View style={styles.tokenInput}>
            <View style={styles.amountInput}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0.0"
                placeholderTextColor={theme.colors.muted}
                value={fromAmount}
                onChangeText={(text) => handleAmountChange(text, true)}
                keyboardType="numeric"
              />
              <AppText style={[styles.balance, { color: theme.colors.muted }]}>
                Balance: {walletInfo?.balance.toFixed(4) || '0.0000'} SOL
              </AppText>
            </View>
            
            <TouchableOpacity
              style={[styles.tokenSelector, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleTokenSelect(fromToken, true)}
            >
              <Ionicons name={tokenOptions.find(t => t.symbol === fromToken)?.icon as any} size={20} color="#000" />
              <AppText style={styles.tokenSymbol}>{fromToken}</AppText>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Direction Button */}
        <TouchableOpacity
          style={[styles.swapButton, { backgroundColor: theme.colors.primary }]}
          onPress={swapTokens}
        >
          <Ionicons name="swap-vertical" size={24} color="#000" />
        </TouchableOpacity>

        {/* To Token */}
        <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>To</AppText>
          
          <View style={styles.tokenInput}>
            <View style={styles.amountInput}>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="0.0"
                placeholderTextColor={theme.colors.muted}
                value={toAmount}
                onChangeText={(text) => handleAmountChange(text, false)}
                keyboardType="numeric"
                editable={false}
              />
              <AppText style={[styles.balance, { color: theme.colors.muted }]}>
                Balance: 0.0000 {toToken}
              </AppText>
            </View>
            
            <TouchableOpacity
              style={[styles.tokenSelector, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleTokenSelect(toToken, false)}
            >
              <Ionicons name={tokenOptions.find(t => t.symbol === toToken)?.icon as any} size={20} color="#000" />
              <AppText style={styles.tokenSymbol}>{toToken}</AppText>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Swap Details</AppText>
          
          <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
            <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Rate</AppText>
            <AppText style={[styles.detailValue, { color: theme.colors.text }]}>
              1 {fromToken} = 20 {toToken}
            </AppText>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
            <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Slippage</AppText>
            <AppText style={[styles.detailValue, { color: theme.colors.text }]}>{slippage}%</AppText>
          </View>
          
          <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
            <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Network Fee</AppText>
            <AppText style={[styles.detailValue, { color: theme.colors.text }]}>~0.000005 SOL</AppText>
          </View>
          
          <View style={styles.detailRow}>
            <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Minimum Received</AppText>
            <AppText style={[styles.detailValue, { color: theme.colors.text }]}>
              {toAmount ? (parseFloat(toAmount) * 0.995).toFixed(4) : '0.0000'} {toToken}
            </AppText>
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapActionButton,
            { 
              backgroundColor: loading || !fromAmount ? theme.colors.muted : theme.colors.primary,
              opacity: loading || !fromAmount ? 0.6 : 1,
            }
          ]}
          onPress={handleSwap}
          disabled={loading || !fromAmount}
        >
          <AppText style={styles.swapButtonText}>
            {loading ? 'Swapping...' : 'Swap'}
          </AppText>
        </TouchableOpacity>

        {/* Jupiter Badge */}
        <View style={styles.jupiterBadge}>
          <AppText style={[styles.jupiterText, { color: theme.colors.muted }]}>
            Powered by Jupiter
          </AppText>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100, // Add bottom padding to clear the navbar
  },
  tokenCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
  },
  tokenInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    marginRight: 16,
  },
  input: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  balance: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  tokenSymbol: {
    color: '#000',
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginRight: 8,
  },
  swapButton: {
    alignSelf: 'center',
    padding: 12,
    borderRadius: 50,
    marginVertical: 16,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  swapActionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  swapButtonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  jupiterBadge: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  jupiterText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
}); 