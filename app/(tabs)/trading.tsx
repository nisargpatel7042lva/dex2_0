import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import PriceChart from '@/src/components/PriceChart';
import { useApp } from '@/src/context/AppContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { PublicKey } from '@solana/web3.js';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

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
  hasTradingData?: boolean;
}

export default function TradingScreen() {
  const { theme } = useAppTheme();
  const { 
    walletInfo, 
    pools, 
    getSwapQuote, 
    executeSwap, 
    addLiquidity,
    loading,
    walletService,
    getSwapQuoteAsync,
    executeSwapOnJupiter,
    getSwapQuoteOnRaydium,
    executeSwapOnRaydium,
    router,
    setRouter,
    ammService,
    loadPools,
  } = useApp();
  const { addNotification } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPool, setSelectedPool] = useState<TradingPool | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [isTokenAToB, setIsTokenAToB] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [chartInterval, setChartInterval] = useState<'5' | '15' | '60' | '240' | '1D'>('15');
  const [chartType, setChartType] = useState<'custom' | 'dexscreener'>('custom');
  const [showDummyTrading, setShowDummyTrading] = useState(false);

  // Load pools on component mount
  useEffect(() => {
    if (ammService) {
      loadPools();
    }
  }, [ammService]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPools();
    } catch (error) {
      console.error('Error refreshing pools:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSwapWithDirection = async (directionAToB: boolean) => {
    if (!selectedPool || !swapAmount || !walletInfo) {
      Alert.alert('Error', 'Please select a pool and enter a valid amount');
      return;
    }
    try {
      const poolAddress = new PublicKey(selectedPool.pool);
      const amountIn = Number(swapAmount);
      let quote = null as any;
      if (router === 'raydium' && getSwapQuoteOnRaydium) {
        quote = await getSwapQuoteOnRaydium(poolAddress, amountIn, directionAToB);
      } else if (getSwapQuoteAsync) {
        quote = await getSwapQuoteAsync(poolAddress, amountIn, directionAToB);
      } else {
        quote = getSwapQuote(poolAddress, amountIn, directionAToB);
      }
      if (!quote) throw new Error('Failed to get quote');
      const minAmountOut = quote.amountOut * (1 - quote.slippage / 100);
      const signature = router === 'raydium' && executeSwapOnRaydium
        ? await executeSwapOnRaydium(poolAddress, amountIn, directionAToB)
        : executeSwapOnJupiter
          ? await executeSwapOnJupiter(poolAddress, amountIn, directionAToB, 50)
          : await executeSwap(poolAddress, amountIn, minAmountOut, directionAToB);
      addNotification({
        type: 'trade',
        title: directionAToB ? 'Sell Executed' : 'Buy Executed',
        message: `${directionAToB ? 'Sold' : 'Bought'} ${amountIn} ${directionAToB ? selectedPool.tokenASymbol : selectedPool.tokenBSymbol}`,
        data: { signature, pool: selectedPool.pool },
      });
    } catch (error) {
      console.error('Swap error:', error);
      addNotification({
        type: 'trade',
        title: 'Trade Failed',
        message: error instanceof Error ? error.message : 'Failed to execute trade',
        data: { pool: selectedPool.pool },
      });
    }
  };

  const selectedPairAddress = useMemo(() => {
    return selectedPool?.pool || '11111111111111111111111111111122';
  }, [selectedPool]);

  const chartData = useMemo(() => {
    if (!selectedPool?.hasTradingData) return [];
    const now = Date.now();
    return Array.from({ length: 50 }).map((_, i) => ({
      time: now - (50 - i) * 60_000,
      price: (selectedPool?.price || 0.25) * (1 + Math.sin(i / 6) * 0.02),
    }));
  }, [selectedPool]);

  const handlePoolSelect = (pool: TradingPool) => {
    setSelectedPool(pool);
    setSwapAmount('');
    setSwapQuote(null);
  };

  const handleSwapAmountChange = async (amount: string) => {
    setSwapAmount(amount);
    if (!selectedPool || !amount || isNaN(Number(amount))) {
      setSwapQuote(null);
      return;
    }
    const poolAddress = new PublicKey(selectedPool.pool);
    try {
      setIsFetchingQuote(true);
      if (router === 'raydium' && getSwapQuoteOnRaydium) {
        const q = await getSwapQuoteOnRaydium(poolAddress, Number(amount), isTokenAToB);
        setSwapQuote(q);
      } else if (getSwapQuoteAsync) {
        const q = await getSwapQuoteAsync(poolAddress, Number(amount), isTokenAToB);
        setSwapQuote(q);
      } else {
        const q = getSwapQuote(poolAddress, Number(amount), isTokenAToB);
        setSwapQuote(q);
      }
    } catch (e) {
      console.warn('Quote error', e);
      setSwapQuote(null);
    } finally {
      setIsFetchingQuote(false);
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

  // Convert pools to trading format with trading data availability
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
    hasTradingData: Math.random() > 0.3, // 70% chance of having trading data
  }));

  const filteredPools = useMemo(() => {
    let filtered = tradingPools;
    
    if (searchQuery) {
      filtered = filtered.filter(pool => 
        pool.tokenASymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.tokenBSymbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter === 'active') {
      filtered = filtered.filter(pool => pool.isActive);
    } else if (selectedFilter === 'trending') {
      filtered = filtered.filter(pool => pool.priceChange24h > 5);
    }
    
    return filtered;
  }, [tradingPools, searchQuery, selectedFilter]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const handleDummyTokenLaunch = () => {
    setShowDummyTrading(true);
    addNotification({
      type: 'system',
      title: 'Dummy Token Launched!',
      message: 'Trading interface is now active with demo data.',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <AppText style={[styles.title, { color: theme.colors.text }]}>Trading</AppText>
              <AppText style={[styles.subtitle, { color: theme.colors.secondary }]}>
                Trade tokens with advanced features
              </AppText>
            </View>
          </View>
        </View>

        {showDummyTrading ? (
          <>
            {/* Chart Section */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <AppText style={[styles.chartTitle, { color: theme.colors.text }]}>
                  TOKEN/SOL
                </AppText>
                <AppText style={[styles.chartPrice, { color: theme.colors.text }]}>
                  ${formatPrice(0.0456)}
                </AppText>
                <AppText style={[styles.chartChange, { color: '#10b981' }]}>
                  +12.34%
                </AppText>
              </View>

              <View style={styles.chartControls}>
                <TouchableOpacity
                  style={[
                    styles.chartButton,
                    chartType === 'custom' && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setChartType('custom')}
                >
                  <AppText style={[
                    styles.chartButtonText,
                    { color: chartType === 'custom' ? '#000' : theme.colors.text }
                  ]}>
                    Chart
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chartButton,
                    chartType === 'dexscreener' && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setChartType('dexscreener')}
                >
                  <AppText style={[
                    styles.chartButtonText,
                    { color: chartType === 'dexscreener' ? '#000' : theme.colors.text }
                  ]}>
                    DEX
                  </AppText>
                </TouchableOpacity>
              </View>

              <View style={styles.chartContainer}>
                {chartType === 'custom' ? (
                  <PriceChart data={chartData} height={200} />
                ) : (
                  <WebView
                    source={{
                      uri: `https://dexscreener.com/solana/0x1234567890abcdef?embed=1&theme=dark&interval=${chartInterval}`
                    }}
                    style={styles.webview}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                  />
                )}
              </View>

              <View style={styles.chartIntervals}>
                {(['5','15','60','240','1D'] as const).map((intv) => (
                  <TouchableOpacity
                    key={intv}
                    onPress={() => setChartInterval(intv)}
                    style={[
                      styles.intervalButton,
                      { backgroundColor: chartInterval === intv ? theme.colors.primary : 'transparent' }
                    ]}
                  >
                    <AppText style={[
                      styles.intervalText,
                      { color: chartInterval === intv ? '#000' : theme.colors.text }
                    ]}>
                      {intv}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Trading Interface */}
            <View style={styles.tradingSection}>
              <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Trade Tokens
              </AppText>
              
              <View style={styles.amountInput}>
                <AppText style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Amount
                </AppText>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.colors.card,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }]}
                  value={swapAmount}
                  onChangeText={setSwapAmount}
                  placeholder="0.0"
                                     placeholderTextColor={theme.colors.secondary}
                  keyboardType="numeric"
                />
              </View>

              {swapQuote && (
                <View style={styles.quoteInfo}>
                  <AppText style={[styles.quoteText, { color: theme.colors.text }]}>
                    You will receive: {swapQuote.amountOut.toFixed(6)} SOL
                  </AppText>
                      <AppText style={[styles.quoteText, { color: theme.colors.secondary }]}>
                      Price Impact: {swapQuote.priceImpact.toFixed(2)}%
                   </AppText>
                   <AppText style={[styles.quoteText, { color: theme.colors.secondary }]}>
                     Fee: {swapQuote.fee.toFixed(6)} Tokens
                   </AppText>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={() => handleSwapWithDirection(false)}
                  disabled={loading}
                >
                  <AppText style={styles.actionButtonText}>
                    {loading ? 'Processing...' : 'Buy Token'}
                  </AppText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.sellButton]}
                  onPress={() => handleSwapWithDirection(true)}
                  disabled={loading}
                >
                  <AppText style={styles.actionButtonText}>
                    {loading ? 'Processing...' : 'Sell Token'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.welcomeSection}>
            {/* <AppText style={[styles.welcomeTitle, { color: theme.colors.text }]}>
              Welcome to Trading
            </AppText>
                <AppText style={[styles.welcomeText, { color: theme.colors.secondary }]}>
                Click &quot;Dummy Token Launch&quot; to start trading with demo data
             </AppText> */}
          </View>
        )}

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
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
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
                  renderItem={({ item }) => (
                    <TouchableOpacity
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
                        {!item.hasTradingData && (
                          <View style={styles.noDataBadge}>
                            <AppText style={styles.noDataBadgeText}>No Data</AppText>
                          </View>
                        )}
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
    paddingTop: 20,
    paddingBottom: 150,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },


  title: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 40, // Added proper line height
    marginBottom: 8,
    paddingVertical: 4, // Added padding to prevent cutting
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    opacity: 0.8,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  priceChange: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  chartControls: {
    flexDirection: 'row',
    gap: 8,
  },
  chartTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  webviewContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  intervalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  intervalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tradingCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tradingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tradingInputContainer: {
    marginBottom: 20,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  tradingInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  directionButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  outputRow: {
    marginTop: 12,
  },
  outputAmount: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  quoteInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  tradingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  poolsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 26, // Added proper line height
    marginBottom: 16,
    paddingVertical: 2, // Added padding to prevent cutting
  },
  poolCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolTokens: {
    flex: 1,
  },
  poolPair: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  poolFee: {
    fontSize: 12,
  },
  noDataBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noDataBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
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
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#1a1a1a', // Darker background for chart section
  },
  chartPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chartButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartIntervals: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  tradingSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#1a1a1a', // Darker background for trading section
  },
  amountInput: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quoteText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  buyButton: {
    backgroundColor: '#10b981',
  },
  sellButton: {
    backgroundColor: '#ef4444',
  },
  welcomeSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 