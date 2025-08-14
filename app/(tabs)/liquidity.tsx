import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { PublicKey } from '@solana/web3.js';
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

interface PoolInfo {
  pool: PublicKey;
  tokenAMint: PublicKey;
  tokenBMint: PublicKey;
  tokenAVault: PublicKey;
  tokenBVault: PublicKey;
  lpMint: PublicKey;
  feeRate: number;
  totalLiquidity: number;
  tokenAReserves: number;
  tokenBReserves: number;
  isActive: boolean;
  supportsTransferHooks: boolean;
  tokenASymbol?: string;
  tokenBSymbol?: string;
  tokenAName?: string;
  tokenBName?: string;
  tvl?: number;
  volume24h?: number;
  apy?: number;
}

interface LiquidityQuote {
  tokenAAmount: number;
  tokenBAmount: number;
  lpTokensToMint: number;
  share: number;
}

// Common token mints for testnet
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'JUP', name: 'Jupiter', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
  { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6 },
  { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
];

export default function LiquidityScreen() {
  const { theme } = useAppTheme();
  const { 
    walletInfo, 
    ammService, 
    pools, 
    loadPools, 
    initializePool, 
    addLiquidity,
    getLiquidityQuote 
  } = useApp();

  // State
  const [loading, setLoading] = useState(false);
  const [poolsList, setPoolsList] = useState<PoolInfo[]>([]);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  
  // Create pool state
  const [tokenA, setTokenA] = useState(COMMON_TOKENS[0]);
  const [tokenB, setTokenB] = useState(COMMON_TOKENS[1]);
  const [feeRate, setFeeRate] = useState('0.3');
  const [enableTransferHooks, setEnableTransferHooks] = useState(false);
  
  // Add liquidity state
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [liquidityQuote, setLiquidityQuote] = useState<LiquidityQuote | null>(null);

  // Transfer Hook demonstration state
  const [showTransferHookDemo, setShowTransferHookDemo] = useState(false);
  const [transferHookPools, setTransferHookPools] = useState<PoolInfo[]>([]);

  // Load pools on mount
  useEffect(() => {
    loadPoolsData();
    loadTransferHookPools();
  }, []);

  const loadPoolsData = async () => {
    try {
      setLoading(true);
      await loadPools();
      
      // Enhance pool data with token metadata
      const enhancedPools = pools.map(pool => {
        const tokenA = COMMON_TOKENS.find(t => t.mint === pool.tokenAMint.toString());
        const tokenB = COMMON_TOKENS.find(t => t.mint === pool.tokenBMint.toString());
        
        return {
          ...pool,
          tokenASymbol: tokenA?.symbol || 'Unknown',
          tokenBSymbol: tokenB?.symbol || 'Unknown',
          tokenAName: tokenA?.name || 'Unknown Token',
          tokenBName: tokenB?.name || 'Unknown Token',
          tvl: pool.tokenAReserves + pool.tokenBReserves, // Simplified TVL
          volume24h: Math.random() * 1000000, // Mock data
          apy: Math.random() * 50, // Mock APY
        };
      });
      
      setPoolsList(enhancedPools);
    } catch (error) {
      console.error('Error loading pools:', error);
      Alert.alert('Error', 'Failed to load liquidity pools');
    } finally {
      setLoading(false);
    }
  };

  const loadTransferHookPools = async () => {
    try {
      // Create mock transfer hook pools for demonstration
      const mockHookPools: PoolInfo[] = [
        {
          pool: new PublicKey('11111111111111111111111111111115'),
          tokenAMint: new PublicKey(COMMON_TOKENS[0].mint),
          tokenBMint: new PublicKey(COMMON_TOKENS[1].mint),
          tokenAVault: new PublicKey('11111111111111111111111111111116'),
          tokenBVault: new PublicKey('11111111111111111111111111111117'),
          lpMint: new PublicKey('11111111111111111111111111111118'),
          feeRate: 25, // Lower fee for transfer hook pools
          totalLiquidity: 2000000,
          tokenAReserves: 1000000,
          tokenBReserves: 2000,
          isActive: true,
          supportsTransferHooks: true,
          tokenASymbol: 'SOL',
          tokenBSymbol: 'USDC',
          tokenAName: 'Solana',
          tokenBName: 'USD Coin',
          tvl: 3000000,
          volume24h: 1500000,
          apy: 35.5,
        },
        {
          pool: new PublicKey('11111111111111111111111111111119'),
          tokenAMint: new PublicKey(COMMON_TOKENS[2].mint),
          tokenBMint: new PublicKey(COMMON_TOKENS[3].mint),
          tokenAVault: new PublicKey('11111111111111111111111111111120'),
          tokenBVault: new PublicKey('11111111111111111111111111111121'),
          lpMint: new PublicKey('11111111111111111111111111111122'),
          feeRate: 20, // Lower fee for transfer hook pools
          totalLiquidity: 1500000,
          tokenAReserves: 750000,
          tokenBReserves: 1500,
          isActive: true,
          supportsTransferHooks: true,
          tokenASymbol: 'USDT',
          tokenBSymbol: 'JUP',
          tokenAName: 'Tether',
          tokenBName: 'Jupiter',
          tvl: 2250000,
          volume24h: 1200000,
          apy: 42.8,
        }
      ];
      
      setTransferHookPools(mockHookPools);
    } catch (error) {
      console.error('Error loading transfer hook pools:', error);
    }
  };

  const handleCreatePool = async () => {
    if (!walletInfo) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (tokenA.mint === tokenB.mint) {
      Alert.alert('Error', 'Cannot create pool with same tokens');
      return;
    }

    try {
      setLoading(true);
      
      const result = await initializePool(
        new PublicKey(tokenA.mint),
        new PublicKey(tokenB.mint),
        parseFloat(feeRate)
      );

      Alert.alert(
        'Pool Created!',
        `Successfully created ${tokenA.symbol}/${tokenB.symbol} pool\n\nPool Address: ${result.pool.toString().slice(0, 8)}...${result.pool.toString().slice(-8)}\n\nTransaction: ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`,
        [
          { text: 'OK' },
          {
            text: 'View on Solscan',
            onPress: () => {
              // Open in browser
              console.log('Open transaction:', `https://solscan.io/tx/${result.signature}`);
            }
          }
        ]
      );

      setShowCreatePool(false);
      loadPoolsData(); // Reload pools
    } catch (error) {
      console.error('Error creating pool:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!selectedPool || !walletInfo) {
      Alert.alert('Error', 'Please select a pool and connect your wallet');
      return;
    }

    if (!tokenAAmount || !tokenBAmount || parseFloat(tokenAAmount) <= 0 || parseFloat(tokenBAmount) <= 0) {
      Alert.alert('Error', 'Please enter valid amounts');
      return;
    }

    try {
      setLoading(true);
      
      const signature = await addLiquidity(
        selectedPool.pool,
        parseFloat(tokenAAmount),
        parseFloat(tokenBAmount),
        0 // minLpTokens - set to 0 for now
      );

      Alert.alert(
        'Liquidity Added!',
        `Successfully added liquidity to ${selectedPool.tokenASymbol}/${selectedPool.tokenBSymbol} pool\n\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        [
          { text: 'OK' },
          {
            text: 'View on Solscan',
            onPress: () => {
              console.log('Open transaction:', `https://solscan.io/tx/${signature}`);
            }
          }
        ]
      );

      setShowAddLiquidity(false);
      setSelectedPool(null);
      loadPoolsData(); // Reload pools
    } catch (error) {
      console.error('Error adding liquidity:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add liquidity');
    } finally {
      setLoading(false);
    }
  };

  const calculateLiquidityQuote = () => {
    if (!selectedPool || !tokenAAmount || !tokenBAmount) {
      setLiquidityQuote(null);
      return;
    }

    const quote = getLiquidityQuote(
      selectedPool.pool,
      parseFloat(tokenAAmount),
      parseFloat(tokenBAmount)
    );

    setLiquidityQuote(quote);
  };

  useEffect(() => {
    calculateLiquidityQuote();
  }, [tokenAAmount, tokenBAmount, selectedPool]);

  const renderPoolItem = ({ item }: { item: PoolInfo }) => (
    <TouchableOpacity
      style={[styles.poolCard, { backgroundColor: theme.colors.card }]}
      onPress={() => {
        setSelectedPool(item);
        setShowAddLiquidity(true);
      }}
    >
      <View style={styles.poolHeader}>
        <View style={styles.tokenPair}>
          <View style={styles.tokenIcon}>
            <AppText style={styles.tokenSymbol}>{item.tokenASymbol}</AppText>
          </View>
          <View style={styles.tokenIcon}>
            <AppText style={styles.tokenSymbol}>{item.tokenBSymbol}</AppText>
          </View>
        </View>
        <View style={styles.poolStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? theme.colors.success : theme.colors.error }]} />
          <AppText style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</AppText>
        </View>
      </View>

      <View style={styles.poolStats}>
        <View style={styles.statItem}>
          <AppText style={styles.statLabel}>TVL</AppText>
          <AppText style={styles.statValue}>${item.tvl?.toLocaleString() || '0'}</AppText>
        </View>
        <View style={styles.statItem}>
          <AppText style={styles.statLabel}>24h Volume</AppText>
          <AppText style={styles.statValue}>${item.volume24h?.toLocaleString() || '0'}</AppText>
        </View>
        <View style={styles.statItem}>
          <AppText style={styles.statLabel}>APY</AppText>
          <AppText style={styles.statValue}>{item.apy?.toFixed(2) || '0'}%</AppText>
        </View>
        <View style={styles.statItem}>
          <AppText style={styles.statLabel}>Fee</AppText>
          <AppText style={styles.statValue}>{(item.feeRate / 10000).toFixed(2)}%</AppText>
        </View>
      </View>

      {item.supportsTransferHooks && (
        <View style={styles.transferHookBadge}>
          <Ionicons name="link" size={12} color={theme.colors.primary} />
          <AppText style={styles.transferHookText}>Transfer Hooks</AppText>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCreatePoolModal = () => (
    <Modal
      visible={showCreatePool}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreatePool(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>Create New Pool</AppText>
            <TouchableOpacity onPress={() => setShowCreatePool(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Token A</AppText>
              <TouchableOpacity
                style={[styles.tokenSelector, { borderColor: theme.colors.border }]}
                onPress={() => {
                  // TODO: Implement token selector
                  Alert.alert('Token Selector', 'Token selector coming soon');
                }}
              >
                <AppText style={styles.tokenSelectorText}>
                  {tokenA.symbol} - {tokenA.name}
                </AppText>
                <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Token B</AppText>
              <TouchableOpacity
                style={[styles.tokenSelector, { borderColor: theme.colors.border }]}
                onPress={() => {
                  // TODO: Implement token selector
                  Alert.alert('Token Selector', 'Token selector coming soon');
                }}
              >
                <AppText style={styles.tokenSelectorText}>
                  {tokenB.symbol} - {tokenB.name}
                </AppText>
                <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Fee Rate (%)</AppText>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }]}
                value={feeRate}
                onChangeText={setFeeRate}
                placeholder="0.3"
                placeholderTextColor={theme.colors.muted}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.checkboxContainer, { borderColor: theme.colors.border }]}
              onPress={() => setEnableTransferHooks(!enableTransferHooks)}
            >
              <View style={[styles.checkbox, { 
                backgroundColor: enableTransferHooks ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border
              }]}>
                {enableTransferHooks && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <AppText style={styles.checkboxLabel}>Enable Transfer Hooks</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { 
                backgroundColor: loading ? theme.colors.muted : theme.colors.primary,
                opacity: loading ? 0.6 : 1
              }]}
              onPress={handleCreatePool}
              disabled={loading}
            >
              {loading ? (
                <AppText style={styles.primaryButtonText}>Creating Pool...</AppText>
              ) : (
                <AppText style={styles.primaryButtonText}>Create Pool</AppText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAddLiquidityModal = () => (
    <Modal
      visible={showAddLiquidity}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddLiquidity(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>Add Liquidity</AppText>
            <TouchableOpacity onPress={() => setShowAddLiquidity(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {selectedPool && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.poolInfo}>
                <AppText style={styles.poolName}>
                  {selectedPool.tokenASymbol}/{selectedPool.tokenBSymbol}
                </AppText>
                <AppText style={styles.poolAddress}>
                  {selectedPool.pool.toString().slice(0, 8)}...{selectedPool.pool.toString().slice(-8)}
                </AppText>
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{selectedPool.tokenASymbol} Amount</AppText>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={tokenAAmount}
                  onChangeText={setTokenAAmount}
                  placeholder="0.0"
                  placeholderTextColor={theme.colors.muted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.inputLabel}>{selectedPool.tokenBSymbol} Amount</AppText>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }]}
                  value={tokenBAmount}
                  onChangeText={setTokenBAmount}
                  placeholder="0.0"
                  placeholderTextColor={theme.colors.muted}
                  keyboardType="numeric"
                />
              </View>

              {liquidityQuote && (
                <View style={styles.quoteInfo}>
                  <AppText style={styles.quoteTitle}>You will receive:</AppText>
                  <AppText style={styles.quoteValue}>
                    {liquidityQuote.lpTokensToMint.toFixed(6)} LP Tokens
                  </AppText>
                  <AppText style={styles.quoteShare}>
                    Pool Share: {liquidityQuote.share.toFixed(2)}%
                  </AppText>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { 
                  backgroundColor: loading ? theme.colors.muted : theme.colors.primary,
                  opacity: loading ? 0.6 : 1
                }]}
                onPress={handleAddLiquidity}
                disabled={loading}
              >
                {loading ? (
                  <AppText style={styles.primaryButtonText}>Adding Liquidity...</AppText>
                ) : (
                  <AppText style={styles.primaryButtonText}>Add Liquidity</AppText>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText style={styles.title}>Liquidity Pools</AppText>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowCreatePool(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <AppText style={styles.createButtonText}>Create Pool</AppText>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statCard}>
          <AppText style={styles.statNumber}>{poolsList.length}</AppText>
          <AppText style={styles.statLabel}>Total Pools</AppText>
        </View>
        <View style={styles.statCard}>
          <AppText style={styles.statNumber}>
            ${poolsList.reduce((sum, pool) => sum + (pool.tvl || 0), 0).toLocaleString()}
          </AppText>
          <AppText style={styles.statLabel}>Total TVL</AppText>
        </View>
        <View style={styles.statCard}>
          <AppText style={styles.statNumber}>
            {poolsList.filter(pool => pool.supportsTransferHooks).length}
          </AppText>
          <AppText style={styles.statLabel}>With Hooks</AppText>
        </View>
      </View>

      {/* Transfer Hook Demonstration Section */}
      <View style={[styles.transferHookSection, { backgroundColor: theme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="link" size={24} color={theme.colors.primary} />
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Transfer Hook Pools
            </AppText>
          </View>
          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowTransferHookDemo(!showTransferHookDemo)}
          >
            <AppText style={[styles.demoButtonText, { color: '#000' }]}>
              {showTransferHookDemo ? 'Hide Demo' : 'Show Demo'}
            </AppText>
          </TouchableOpacity>
        </View>
        
        <AppText style={[styles.sectionDescription, { color: theme.colors.secondary }]}>
          Advanced pools with Transfer Hook integration for enhanced security and custom logic
        </AppText>

        {showTransferHookDemo && (
          <View style={styles.transferHookDemo}>
            <View style={styles.demoFeatures}>
              <View style={styles.demoFeature}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                <AppText style={[styles.demoFeatureText, { color: theme.colors.text }]}>
                  Enhanced Security
                </AppText>
              </View>
              <View style={styles.demoFeature}>
                <Ionicons name="code" size={20} color={theme.colors.primary} />
                <AppText style={[styles.demoFeatureText, { color: theme.colors.text }]}>
                  Custom Logic
                </AppText>
              </View>
              <View style={styles.demoFeature}>
                <Ionicons name="trending-up" size={20} color={theme.colors.warning} />
                <AppText style={[styles.demoFeatureText, { color: theme.colors.text }]}>
                  Lower Fees
                </AppText>
              </View>
            </View>

            {transferHookPools.length > 0 && (
              <FlatList
                data={transferHookPools}
                renderItem={renderPoolItem}
                keyExtractor={(item) => item.pool.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.transferHookPoolsList}
              />
            )}
          </View>
        )}
      </View>

      {/* Pools List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <AppText style={styles.loadingText}>Loading pools...</AppText>
        </View>
      ) : poolsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="water-outline" size={64} color={theme.colors.muted} />
          <AppText style={styles.emptyTitle}>No Liquidity Pools</AppText>
          <AppText style={styles.emptySubtitle}>
            Create your first liquidity pool to start earning fees
          </AppText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowCreatePool(true)}
          >
            <AppText style={styles.primaryButtonText}>Create First Pool</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={poolsList}
          renderItem={renderPoolItem}
          keyExtractor={(item) => item.pool.toString()}
          contentContainerStyle={styles.poolsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreatePoolModal()}
      {renderAddLiquidityModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 150, // Increased bottom padding to clear the navbar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40, // Extra top padding for status bar
    paddingBottom: 16, // Extra bottom padding to prevent text cutting
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  poolsList: {
    paddingBottom: 20,
  },
  poolCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  poolStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  poolStatLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  transferHookBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  transferHookText: {
    fontSize: 10,
    marginLeft: 4,
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  tokenSelector: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenSelectorText: {
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  poolInfo: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  poolName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  poolAddress: {
    fontSize: 12,
    opacity: 0.7,
  },
  quoteInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  quoteTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  quoteValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  quoteShare: {
    fontSize: 12,
    opacity: 0.7,
  },
  transferHookSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  demoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  transferHookDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  demoFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  demoFeature: {
    alignItems: 'center',
  },
  demoFeatureText: {
    fontSize: 12,
    marginTop: 4,
  },
  transferHookPoolsList: {
    paddingHorizontal: 8,
  },
}); 