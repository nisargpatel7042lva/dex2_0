import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Token {
  symbol: string;
  name: string;
  mint: string;
  balance: number;
  price: number;
  icon: string;
}

export default function SwapScreen() {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showTokenSelector, setShowTokenSelector] = useState<'from' | 'to' | null>(null);

  const availableTokens: Token[] = [
    {
      symbol: 'SOL',
      name: 'Solana',
      mint: 'So11111111111111111111111111111111111111112',
      balance: walletInfo?.balance || 0,
      price: 100.50,
      icon: '💎',
    },
    {
      symbol: 'DEX',
      name: 'DEX Token',
      mint: 'Token111111111111111111111111111111111111111',
      balance: 1000,
      price: 0.25,
      icon: '🚀',
    },
    {
      symbol: 'PRIV',
      name: 'Privacy Coin',
      mint: 'Token222222222222222222222222222222222222222',
      balance: 500,
      price: 1.75,
      icon: '🔒',
    },
    {
      symbol: 'UTIL',
      name: 'Utility Token',
      mint: 'Token333333333333333333333333333333333333333',
      balance: 2500,
      price: 0.10,
      icon: '⚡',
    },
  ];

  const calculateSwapAmount = (amount: string, fromToken: Token, toToken: Token) => {
    if (!amount || !fromToken || !toToken) return '';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '';
    
    // Simple calculation based on price ratio
    const ratio = fromToken.price / toToken.price;
    return (numAmount * ratio).toFixed(6);
  };

  const handleFromAmountChange = (amount: string) => {
    setFromAmount(amount);
    if (fromToken && toToken) {
      const calculated = calculateSwapAmount(amount, fromToken, toToken);
      setToAmount(calculated);
    }
  };

  const handleTokenSelect = (token: Token, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromToken(token);
      if (toToken && fromAmount) {
        const calculated = calculateSwapAmount(fromAmount, token, toToken);
        setToAmount(calculated);
      }
    } else {
      setToToken(token);
      if (fromToken && fromAmount) {
        const calculated = calculateSwapAmount(fromAmount, fromToken, token);
        setToAmount(calculated);
      }
    }
    setShowTokenSelector(null);
  };

  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) {
      Alert.alert('Error', 'Please select tokens and enter amounts');
      return;
    }

    const numAmount = parseFloat(fromAmount);
    if (numAmount > (fromToken.balance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    Alert.alert(
      'Confirm Swap',
      `Swap ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}?\n\nSlippage: ${slippage}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Swap', 
          onPress: () => {
            Alert.alert('Success', 'Swap executed successfully!');
            setFromAmount('');
            setToAmount('');
          }
        },
      ]
    );
  };

  const TokenSelector = ({ type }: { type: 'from' | 'to' }) => (
    <View style={styles.tokenSelector}>
      <View style={styles.tokenSelectorHeader}>
        <Text style={[styles.tokenSelectorTitle, { color: theme.colors.text }]}>
          Select {type === 'from' ? 'From' : 'To'} Token
        </Text>
        <TouchableOpacity onPress={() => setShowTokenSelector(null)}>
          <Ionicons name="close" size={24} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.tokenList}>
        {availableTokens.map((token) => (
          <TouchableOpacity
            key={token.mint}
            style={[styles.tokenItem, { backgroundColor: theme.colors.background }]}
            onPress={() => handleTokenSelect(token, type)}
          >
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenIcon}>{token.icon}</Text>
              <View style={styles.tokenDetails}>
                <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                  {token.symbol}
                </Text>
                <Text style={[styles.tokenName, { color: theme.colors.muted }]}>
                  {token.name}
                </Text>
              </View>
            </View>
            <View style={styles.tokenBalance}>
              <Text style={[styles.tokenBalanceText, { color: theme.colors.text }]}>
                {token.balance.toLocaleString()}
              </Text>
              <Text style={[styles.tokenPrice, { color: theme.colors.muted }]}>
                ${token.price.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Swap Tokens</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Swap settings would be implemented here.')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Swap Card */}
        <View style={[styles.swapCard, { backgroundColor: theme.colors.card }]}>
          {/* From Token */}
          <View style={styles.tokenSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>From</Text>
            <TouchableOpacity
              style={[styles.tokenSelector, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowTokenSelector('from')}
            >
              {fromToken ? (
                <View style={styles.selectedToken}>
                  <Text style={styles.tokenIcon}>{fromToken.icon}</Text>
                  <View style={styles.tokenDetails}>
                    <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                      {fromToken.symbol}
                    </Text>
                    <Text style={[styles.tokenBalance, { color: theme.colors.muted }]}>
                      Balance: {fromToken.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.selectTokenText, { color: theme.colors.muted }]}>
                  Select Token
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.colors.muted} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={fromAmount}
              onChangeText={handleFromAmountChange}
              placeholder="0.0"
              placeholderTextColor={theme.colors.muted}
              keyboardType="numeric"
            />
          </View>

          {/* Swap Arrow */}
          <TouchableOpacity
            style={[styles.swapArrow, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (fromToken && toToken) {
                setFromToken(toToken);
                setToToken(fromToken);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }
            }}
          >
            <Ionicons name="swap-vertical" size={20} color="#fff" />
          </TouchableOpacity>

          {/* To Token */}
          <View style={styles.tokenSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.muted }]}>To</Text>
            <TouchableOpacity
              style={[styles.tokenSelector, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowTokenSelector('to')}
            >
              {toToken ? (
                <View style={styles.selectedToken}>
                  <Text style={styles.tokenIcon}>{toToken.icon}</Text>
                  <View style={styles.tokenDetails}>
                    <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                      {toToken.symbol}
                    </Text>
                    <Text style={[styles.tokenBalance, { color: theme.colors.muted }]}>
                      Balance: {toToken.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.selectTokenText, { color: theme.colors.muted }]}>
                  Select Token
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={theme.colors.muted} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={toAmount}
              onChangeText={setToAmount}
              placeholder="0.0"
              placeholderTextColor={theme.colors.muted}
              keyboardType="numeric"
              editable={false}
            />
          </View>

          {/* Swap Details */}
          {fromToken && toToken && fromAmount && toAmount && (
            <View style={styles.swapDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Rate</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  1 {fromToken.symbol} = {(toToken.price / fromToken.price).toFixed(6)} {toToken.symbol}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Slippage</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  {slippage}%
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted }]}>Network Fee</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                  ~0.000005 SOL
                </Text>
              </View>
            </View>
          )}

          {/* Swap Button */}
          <TouchableOpacity
            style={[
              styles.swapButton,
              { 
                backgroundColor: fromToken && toToken && fromAmount && toAmount 
                  ? theme.colors.primary 
                  : theme.colors.border 
              }
            ]}
            onPress={handleSwap}
            disabled={!fromToken || !toToken || !fromAmount || !toAmount}
          >
            <Text style={[
              styles.swapButtonText,
              { 
                color: fromToken && toToken && fromAmount && toAmount 
                  ? '#fff' 
                  : theme.colors.muted 
              }
            ]}>
              {!fromToken || !toToken ? 'Select Tokens' : 
               !fromAmount || !toAmount ? 'Enter Amount' : 'Swap'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Token Selector Modal */}
        {showTokenSelector && (
          <View style={styles.modalOverlay}>
            <TokenSelector type={showTokenSelector} />
          </View>
        )}
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
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  swapCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedToken: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokenBalance: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  selectTokenText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  swapArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  swapDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  swapButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  tokenSelector: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  tokenSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenList: {
    maxHeight: 400,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenBalanceText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokenPrice: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
}); 