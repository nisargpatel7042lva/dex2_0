import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { PublicKey } from '@solana/web3.js';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TradingPool {
  pool: string;
  tokenASymbol: string;
  tokenBSymbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  feeRate: number;
  isActive: boolean;
}

export default function TradingScreen() {
  const { theme } = useAppTheme();
  const { 
    walletInfo, 
    pools, 
    getSwapQuote, 
    executeSwap, 
    addLiquidity,
    loading 
  } = useApp();
  const { addNotification } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPool, setSelectedPool] = useState<TradingPool | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [isTokenAToB, setIsTokenAToB] = useState(true);

  // Convert pools to trading format
  const tradingPools: TradingPool[] = (pools || []).map((pool, index) => ({
    pool: pool.pool.toString(),
    tokenASymbol: `TOKEN${index + 1}`, // Better fallback with unique identifier
    tokenBSymbol: 'SOL',
    price: pool.tokenBReserves > 0 ? pool.tokenAReserves / pool.tokenBReserves : 0,
    priceChange24h: Math.random() * 20 - 10, // Mock data
    volume24h: Math.random() * 1000000 + 100000, // Mock data
    liquidity: pool.totalLiquidity || 0,
    feeRate: (pool.feeRate || 0) / 100, // Convert from basis points to percentage
    isActive: pool.isActive || false,
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePoolSelect = (pool: TradingPool) => {
    setSelectedPool(pool);
    setSwapAmount('');
    setSwapQuote(null);
  };

  const handleSwapAmountChange = (amount: string) => {
    setSwapAmount(amount);
    
    if (selectedPool && amount && !isNaN(Number(amount))) {
      const poolAddress = new PublicKey(selectedPool.pool);
      const quote = getSwapQuote(poolAddress, Number(amount), isTokenAToB);
      setSwapQuote(quote);
    } else {
      setSwapQuote(null);
    }
  };

  const handleSwap = async () => {
    if (!selectedPool || !swapAmount || !swapQuote || !walletInfo) {
      Alert.alert('Error', 'Please select a pool and enter a valid amount');
      return;
    }

    try {
      const poolAddress = new PublicKey(selectedPool.pool);
      const amountIn = Number(swapAmount);
      const minAmountOut = swapQuote.amountOut * (1 - swapQuote.slippage / 100);

      const signature = await executeSwap(poolAddress, amountIn, minAmountOut, isTokenAToB);
      
      addNotification({
        type: 'trade',
        title: 'Swap Executed',
        message: `Successfully swapped ${amountIn} ${isTokenAToB ? selectedPool.tokenASymbol : selectedPool.tokenBSymbol} for ${swapQuote.amountOut.toFixed(6)} ${isTokenAToB ? selectedPool.tokenBSymbol : selectedPool.tokenASymbol}`,
        data: { signature, pool: selectedPool.pool }
      });

      setSwapAmount('');
      setSwapQuote(null);
    } catch (error) {
      console.error('Swap error:', error);
      addNotification({
        type: 'trade',
        title: 'Swap Failed',
        message: error instanceof Error ? error.message : 'Failed to execute swap',
        data: { pool: selectedPool.pool }
      });
    }
  };

  const handleAddLiquidity = async () => {
    if (!selectedPool || !walletInfo) {
      Alert.alert('Error', 'Please select a pool first');
      return;
    }

    try {
      const poolAddress = new PublicKey(selectedPool.pool);
      // Mock liquidity amounts - in real app, get from user input
      const tokenAAmount = 1000;
      const tokenBAmount = 10;
      const minLpTokens = 100;

      const signature = await addLiquidity(poolAddress, tokenAAmount, tokenBAmount, minLpTokens);
      
      addNotification({
        type: 'trade',
        title: 'Liquidity Added',
        message: `Successfully added liquidity to ${selectedPool.tokenASymbol}-${selectedPool.tokenBSymbol} pool`,
        data: { signature, pool: selectedPool.pool }
      });
    } catch (error) {
      console.error('Add liquidity error:', error);
      addNotification({
        type: 'trade',
        title: 'Add Liquidity Failed',
        message: error instanceof Error ? error.message : 'Failed to add liquidity',
        data: { pool: selectedPool.pool }
      });
    }
  };

  const filteredPools = tradingPools.filter(pool => {
    const matchesSearch = pool.tokenASymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pool.tokenBSymbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'active') return matchesSearch && pool.isActive;
    if (selectedFilter === 'trending') return matchesSearch && pool.priceChange24h > 5;
    
    return matchesSearch;
  });

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '0.00';
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={[styles.title, { color: theme.colors.text }]}>Trading</AppText>
          <AppText style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Swap Token-2022 with Transfer Hooks
          </AppText>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search pools..."
              placeholderTextColor={theme.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterContainer}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'trending', label: 'Trending' },
            ].map((filter, index) => (
              <TouchableOpacity
                key={`filter-${filter.key}-${index}`}
                style={[
                  styles.filterButton,
                  { backgroundColor: selectedFilter === filter.key ? theme.colors.primary : theme.colors.card },
                ]}
                onPress={() => setSelectedFilter(filter.key)}
                activeOpacity={0.7}
              >
                <AppText style={[
                  styles.filterText,
                  { color: selectedFilter === filter.key ? '#000' : theme.colors.text }
                ]}>
                  {filter.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trading Interface */}
        {selectedPool && (
          <View style={[styles.tradingCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.tradingHeader}>
              <AppText style={[styles.tradingTitle, { color: theme.colors.text }]}>
                {selectedPool.tokenASymbol}/{selectedPool.tokenBSymbol}
              </AppText>
              <TouchableOpacity onPress={() => setSelectedPool(null)}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.swapContainer}>
              <View style={styles.swapInputContainer}>
                <AppText style={[styles.swapLabel, { color: theme.colors.muted }]}>
                  {isTokenAToB ? selectedPool.tokenASymbol : selectedPool.tokenBSymbol}
                </AppText>
                <TextInput
                  style={[styles.swapInput, { color: theme.colors.text }]}
                  placeholder="0.0"
                  placeholderTextColor={theme.colors.muted}
                  value={swapAmount}
                  onChangeText={handleSwapAmountChange}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.swapDirectionButton}
                onPress={() => setIsTokenAToB(!isTokenAToB)}
              >
                <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              <View style={styles.swapOutputContainer}>
                <AppText style={[styles.swapLabel, { color: theme.colors.muted }]}>
                  {isTokenAToB ? selectedPool.tokenBSymbol : selectedPool.tokenASymbol}
                </AppText>
                <AppText style={[styles.swapOutput, { color: theme.colors.text }]}>
                  {swapQuote ? swapQuote.amountOut.toFixed(6) : '0.0'}
                </AppText>
              </View>
            </View>

            {swapQuote && (
              <View style={styles.quoteInfo}>
                <View style={styles.quoteRow}>
                  <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Price Impact:</AppText>
                  <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                    {swapQuote.priceImpact.toFixed(2)}%
                  </AppText>
                </View>
                <View style={styles.quoteRow}>
                  <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Fee:</AppText>
                  <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                    {swapQuote.fee.toFixed(6)}
                  </AppText>
                </View>
                <View style={styles.quoteRow}>
                  <AppText style={[styles.quoteLabel, { color: theme.colors.muted }]}>Slippage:</AppText>
                  <AppText style={[styles.quoteValue, { color: theme.colors.text }]}>
                    {swapQuote.slippage}%
                  </AppText>
                </View>
              </View>
            )}

            <View style={styles.tradingActions}>
              <TouchableOpacity
                style={[styles.swapButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSwap}
                disabled={!swapQuote || loading}
              >
                <AppText style={[styles.swapButtonText, { color: '#000' }]}>
                  {loading ? 'Swapping...' : 'Swap'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.liquidityButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={handleAddLiquidity}
                disabled={loading}
              >
                <AppText style={[styles.liquidityButtonText, { color: theme.colors.primary }]}>
                  Add Liquidity
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pools List */}
        <View style={styles.poolsContainer}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Available Pools</AppText>
          
          {loading ? (
            <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
              <AppText style={[styles.emptyStateText, { color: theme.colors.muted }]}>
                Loading pools...
              </AppText>
            </View>
          ) : (
            <>
              {filteredPools.length > 0 ? (
                <FlatList
                  data={filteredPools}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      key={`${item.pool}-${index}`}
                      style={[styles.poolCard, { backgroundColor: theme.colors.card }]}
                      onPress={() => handlePoolSelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.poolHeader}>
                        <View style={styles.poolTokens}>
                          <AppText style={[styles.poolPair, { color: theme.colors.text }]}>
                            {item.tokenASymbol}/{item.tokenBSymbol}
                          </AppText>
                          <AppText style={[styles.poolFee, { color: theme.colors.muted }]}>
                            {item.feeRate}% fee
                          </AppText>
                        </View>
                        <View style={styles.poolStatus}>
                          <View 
                            style={[
                              styles.statusBadge, 
                              { backgroundColor: item.isActive ? '#10b981' : '#ef4444' }
                            ]}
                          >
                            <AppText style={styles.statusText}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </AppText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.poolStats}>
                        <View style={styles.statItem}>
                          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Price</AppText>
                          <AppText style={[styles.statValue, { color: theme.colors.text }]}>
                            ${formatPrice(item.price)}
                          </AppText>
                        </View>
                        <View style={styles.statItem}>
                          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>24h Change</AppText>
                          <AppText style={[
                            styles.statValue,
                            { color: item.priceChange24h >= 0 ? '#10b981' : '#ef4444' }
                          ]}>
                            {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                          </AppText>
                        </View>
                        <View style={styles.statItem}>
                          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Volume</AppText>
                          <AppText style={[styles.statValue, { color: theme.colors.text }]}>
                            {formatNumber(item.volume24h)}
                          </AppText>
                        </View>
                        <View style={styles.statItem}>
                          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Liquidity</AppText>
                          <AppText style={[styles.statValue, { color: theme.colors.text }]}>
                            {formatNumber(item.liquidity)}
                          </AppText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.pool}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
                  <AppText style={[styles.emptyStateText, { color: theme.colors.muted }]}>
                    No pools found
                  </AppText>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20, // Add top padding to match app theme
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tradingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  tradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tradingTitle: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  swapContainer: {
    marginBottom: 20,
  },
  swapInputContainer: {
    marginBottom: 16,
  },
  swapLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 8,
  },
  swapInput: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  swapDirectionButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapOutputContainer: {
    marginTop: 16,
  },
  swapOutput: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quoteInfo: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  tradingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  swapButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  swapButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  liquidityButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  liquidityButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  poolsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-Bold',
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
    marginBottom: 16,
  },
  poolTokens: {
    flex: 1,
  },
  poolPair: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  poolFee: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  poolStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
}); 