import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { DevnetConfig } from '@/constants/devnet-config';
import { useApp } from '@/src/context/AppContext';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface TradingPair {
  tokenA: {
    mint: PublicKey;
    symbol: string;
    balance: number;
    decimals: number;
  };
  tokenB: {
    mint: PublicKey;
    symbol: string;
    balance: number;
    decimals: number;
  };
  pool: PublicKey;
  hasTransferHook: boolean;
  hookType: string;
}

const DEMO_TRADING_PAIRS: TradingPair[] = [
  {
    tokenA: {
      mint: DevnetConfig.TOKENS.SOL,
      symbol: 'SOL',
      balance: 10.5,
      decimals: 9,
    },
    tokenB: {
      mint: new PublicKey('DemoToken1111111111111111111111111111111'),
      symbol: 'DEMO',
      balance: 1000.0,
      decimals: 6,
    },
    pool: new PublicKey('DemoPool1111111111111111111111111111111111'),
    hasTransferHook: true,
    hookType: 'Fee Collection'
  },
  {
    tokenA: {
      mint: DevnetConfig.TOKENS.SOL,
      symbol: 'SOL',
      balance: 10.5,
      decimals: 9,
    },
    tokenB: {
      mint: new PublicKey('ComplianceToken11111111111111111111111111'),
      symbol: 'COMP',
      balance: 500.0,
      decimals: 6,
    },
    pool: new PublicKey('CompliancePool111111111111111111111111111'),
    hasTransferHook: true,
    hookType: 'Compliance'
  }
];

export default function TradingInterface() {
  const appTheme = useAppTheme();
  const theme = appTheme.theme;
  const { walletInfo, transferHookAMMService } = useApp();

  const [selectedPair, setSelectedPair] = useState<TradingPair>(DEMO_TRADING_PAIRS[0]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isTokenAToB, setIsTokenAToB] = useState(true);
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  // Calculate swap quote
  useEffect(() => {
    if (amountIn && !isNaN(parseFloat(amountIn))) {
      const amount = parseFloat(amountIn);
      // Mock price calculation with transfer hook fees
      const hookFee = selectedPair.hasTransferHook ? 0.001 : 0; // 0.1% hook fee
      const poolFee = 0.003; // 0.3% pool fee
      const totalFee = hookFee + poolFee;
      
      const estimatedOut = amount * 0.95 * (1 - totalFee); // Simple price calculation
      setAmountOut(estimatedOut.toFixed(6));
    } else {
      setAmountOut('');
    }
  }, [amountIn, selectedPair, isTokenAToB]);

  const handleSwap = async () => {
    if (!walletInfo || !transferHookAMMService) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!amountIn || !amountOut) {
      Alert.alert('Error', 'Please enter swap amounts');
      return;
    }

    setIsSwapping(true);

    try {
      const payer = Keypair.generate(); // Mock payer for demo
      const amountInLamports = parseFloat(amountIn) * Math.pow(10, selectedPair.tokenA.decimals);
      const minAmountOut = parseFloat(amountOut) * (1 - parseFloat(slippage) / 100) * Math.pow(10, selectedPair.tokenB.decimals);

      console.log('Executing Transfer Hook swap:', {
        pair: selectedPair,
        amountIn: amountInLamports,
        minAmountOut,
        hasTransferHook: selectedPair.hasTransferHook
      });

      const signature = await transferHookAMMService.swapWithTransferHook(
        payer,
        selectedPair.pool,
        amountInLamports,
        minAmountOut,
        isTokenAToB,
        selectedPair.hasTransferHook ? Buffer.from([1, 2, 3, 4]) : undefined
      );

      // Add to recent trades
      const newTrade = {
        signature,
        timestamp: new Date().toISOString(),
        tokenIn: isTokenAToB ? selectedPair.tokenA.symbol : selectedPair.tokenB.symbol,
        tokenOut: isTokenAToB ? selectedPair.tokenB.symbol : selectedPair.tokenA.symbol,
        amountIn: parseFloat(amountIn),
        amountOut: parseFloat(amountOut),
        hookType: selectedPair.hasTransferHook ? selectedPair.hookType : 'None',
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, 9)]); // Keep last 10 trades

      Alert.alert(
        '✅ Swap Successful!',
        `Swapped ${amountIn} ${isTokenAToB ? selectedPair.tokenA.symbol : selectedPair.tokenB.symbol} for ${amountOut} ${isTokenAToB ? selectedPair.tokenB.symbol : selectedPair.tokenA.symbol}\n\nTransfer Hook: ${selectedPair.hookType}\nTx: ${signature.slice(0, 8)}...`
      );

      // Reset form
      setAmountIn('');
      setAmountOut('');

    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Swap Failed', `Error: ${error}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const switchTokens = () => {
    setIsTokenAToB(!isTokenAToB);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const currentTokenIn = isTokenAToB ? selectedPair.tokenA : selectedPair.tokenB;
  const currentTokenOut = isTokenAToB ? selectedPair.tokenB : selectedPair.tokenA;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={[styles.title, { color: theme.colors.text }]}>
          Token-2022 Trading
        </AppText>
        <AppText style={[styles.subtitle, { color: theme.colors.muted }]}>
          Trade tokens with Transfer Hook support
        </AppText>
      </View>

      {/* Pair Selection */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Trading Pair
        </AppText>
        {DEMO_TRADING_PAIRS.map((pair, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pairOption,
              { 
                borderColor: selectedPair === pair ? theme.colors.accent : theme.colors.border,
                backgroundColor: selectedPair === pair ? theme.colors.accent + '20' : 'transparent'
              }
            ]}
            onPress={() => setSelectedPair(pair)}
          >
            <View style={styles.pairInfo}>
              <AppText style={[styles.pairSymbol, { color: theme.colors.text }]}>
                {pair.tokenA.symbol}/{pair.tokenB.symbol}
              </AppText>
              <View style={styles.hookBadge}>
                <AppText style={[styles.hookBadgeText, { color: theme.colors.accent }]}>
                  🔗 {pair.hookType}
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swap Interface */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Swap Tokens
        </AppText>
        
        {/* Token In */}
        <View style={[styles.tokenInput, { borderColor: theme.colors.border }]}>
          <AppText style={[styles.tokenLabel, { color: theme.colors.muted }]}>
            From: {currentTokenIn.symbol}
          </AppText>
          <TextInput
            style={[styles.amountInput, { color: theme.colors.text }]}
            value={amountIn}
            onChangeText={setAmountIn}
            placeholder="0.00"
            placeholderTextColor={theme.colors.muted}
            keyboardType="decimal-pad"
          />
          <AppText style={[styles.balance, { color: theme.colors.muted }]}>
            Balance: {currentTokenIn.balance.toFixed(4)}
          </AppText>
        </View>

        {/* Switch Button */}
        <TouchableOpacity style={styles.switchButton} onPress={switchTokens}>
          <AppText style={[styles.switchButtonText, { color: theme.colors.accent }]}>
            ⇅
          </AppText>
        </TouchableOpacity>

        {/* Token Out */}
        <View style={[styles.tokenInput, { borderColor: theme.colors.border }]}>
          <AppText style={[styles.tokenLabel, { color: theme.colors.muted }]}>
            To: {currentTokenOut.symbol}
          </AppText>
          <TextInput
            style={[styles.amountInput, { color: theme.colors.text }]}
            value={amountOut}
            placeholder="0.00"
            placeholderTextColor={theme.colors.muted}
            editable={false}
          />
          <AppText style={[styles.balance, { color: theme.colors.muted }]}>
            Balance: {currentTokenOut.balance.toFixed(4)}
          </AppText>
        </View>

        {/* Transfer Hook Info */}
        {selectedPair.hasTransferHook && (
          <View style={[styles.hookInfo, { backgroundColor: theme.colors.warning + '20' }]}>
            <AppText style={[styles.hookInfoTitle, { color: theme.colors.warning }]}>
              🔗 Transfer Hook Active
            </AppText>
            <AppText style={[styles.hookInfoText, { color: theme.colors.text }]}>
              Hook Type: {selectedPair.hookType}
            </AppText>
            <AppText style={[styles.hookInfoText, { color: theme.colors.text }]}>
              Additional Fee: ~0.1%
            </AppText>
          </View>
        )}

        {/* Slippage */}
        <View style={styles.slippageContainer}>
          <AppText style={[styles.slippageLabel, { color: theme.colors.muted }]}>
            Slippage Tolerance
          </AppText>
          <TextInput
            style={[styles.slippageInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            value={slippage}
            onChangeText={setSlippage}
            placeholder="0.5"
            placeholderTextColor={theme.colors.muted}
            keyboardType="decimal-pad"
          />
          <AppText style={[styles.slippagePercent, { color: theme.colors.muted }]}>
            %
          </AppText>
        </View>

        {/* Swap Button */}
        <TouchableOpacity
          style={[
            styles.swapButton,
            { 
              backgroundColor: theme.colors.accent,
              opacity: (amountIn && amountOut && !isSwapping) ? 1 : 0.5
            }
          ]}
          onPress={handleSwap}
          disabled={!amountIn || !amountOut || isSwapping}
        >
          {isSwapping ? (
            <ActivityIndicator color={theme.colors.background} size="small" />
          ) : (
            <AppText style={[styles.swapButtonText, { color: theme.colors.background }]}>
              Swap with Transfer Hook
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Trades
          </AppText>
          {recentTrades.map((trade, index) => (
            <View key={index} style={[styles.tradeItem, { borderColor: theme.colors.border }]}>
              <View style={styles.tradeHeader}>
                <AppText style={[styles.tradeTokens, { color: theme.colors.text }]}>
                  {trade.tokenIn} → {trade.tokenOut}
                </AppText>
                <AppText style={[styles.tradeHook, { color: theme.colors.accent }]}>
                  {trade.hookType}
                </AppText>
              </View>
              <AppText style={[styles.tradeAmounts, { color: theme.colors.muted }]}>
                {trade.amountIn} → {trade.amountOut}
              </AppText>
              <AppText style={[styles.tradeTx, { color: theme.colors.muted }]}>
                Tx: {trade.signature.slice(0, 16)}...
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* Bounty Info */}
      <View style={[styles.bountyInfo, { backgroundColor: theme.colors.accent + '10' }]}>
        <AppText style={[styles.bountyTitle, { color: theme.colors.accent }]}>
          🏆 Bounty: Token-2022 + Transfer Hooks AMM
        </AppText>
        <AppText style={[styles.bountyText, { color: theme.colors.text }]}>
          ✅ Create Token-2022 with Transfer Hook{'\n'}
          ✅ Create LP pool (SOL-token pair){'\n'}
          ✅ Enable trading with hook compliance{'\n'}
          🔄 Whitelisted hook security model{'\n'}
          🔄 Real Transfer Hook execution
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  pairOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  pairInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pairSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  hookBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hookBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tokenInput: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balance: {
    fontSize: 12,
  },
  switchButton: {
    alignSelf: 'center',
    padding: 8,
    marginVertical: 8,
  },
  switchButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  hookInfo: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  hookInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  hookInfoText: {
    fontSize: 12,
  },
  slippageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  slippageLabel: {
    flex: 1,
    fontSize: 14,
  },
  slippageInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  slippagePercent: {
    fontSize: 14,
  },
  swapButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tradeItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tradeTokens: {
    fontSize: 14,
    fontWeight: '500',
  },
  tradeHook: {
    fontSize: 12,
    fontWeight: '500',
  },
  tradeAmounts: {
    fontSize: 12,
    marginBottom: 2,
  },
  tradeTx: {
    fontSize: 10,
  },
  bountyInfo: {
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  bountyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bountyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
