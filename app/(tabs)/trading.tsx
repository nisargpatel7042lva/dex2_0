import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Token2022Coin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  transferHookEnabled: boolean;
  confidentialTransferEnabled: boolean;
  liquidity: number;
  launchDate: string;
  description: string;
}

export default function TradingScreen() {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Mock data for Token-2022 coins
  const token2022Coins: Token2022Coin[] = [
    {
      id: '1',
      name: 'USDC-2022',
      symbol: 'USDC',
      price: 1.00,
      priceChange24h: 0.02,
      volume24h: 45200000,
      marketCap: 2500000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      liquidity: 15000000,
      launchDate: '2024-01-15',
      description: 'USD Coin with Transfer Hooks enabled for advanced trading',
    },
    {
      id: '2',
      name: 'SOL-2022',
      symbol: 'SOL',
      price: 98.45,
      priceChange24h: 5.23,
      volume24h: 23100000,
      marketCap: 45000000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: true,
      liquidity: 85000000,
      launchDate: '2024-01-14',
      description: 'Solana with advanced metadata pointers and confidential transfers',
    },
    {
      id: '3',
      name: 'RAY-2022',
      symbol: 'RAY',
      price: 2.85,
      priceChange24h: 12.45,
      volume24h: 8700000,
      marketCap: 850000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      liquidity: 25000000,
      launchDate: '2024-01-13',
      description: 'Raydium with custom transfer logic and hook approval',
    },
    {
      id: '4',
      name: 'SRM-2022',
      symbol: 'SRM',
      price: 0.45,
      priceChange24h: -2.15,
      volume24h: 5200000,
      marketCap: 180000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: true,
      liquidity: 12000000,
      launchDate: '2024-01-12',
      description: 'Serum with permissionless hook approval system',
    },
    {
      id: '5',
      name: 'ORCA-2022',
      symbol: 'ORCA',
      price: 3.25,
      priceChange24h: 8.92,
      volume24h: 3800000,
      marketCap: 320000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      liquidity: 18000000,
      launchDate: '2024-01-11',
      description: 'Orca with proxy token wrappers and AMM integration',
    },
    {
      id: '6',
      name: 'BONK-2022',
      symbol: 'BONK',
      price: 0.0000125,
      priceChange24h: 15.67,
      volume24h: 2800000,
      marketCap: 85000000,
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      liquidity: 8500000,
      launchDate: '2024-01-10',
      description: 'Bonk with meme token transfer hooks and community features',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleTrade = (coin: Token2022Coin) => {
    // TODO: Implement trading logic
    console.log('Trade:', coin.symbol);
  };

  const filteredCoins = token2022Coins.filter(coin => {
    const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'transfer-hooks') return matchesSearch && coin.transferHookEnabled;
    if (selectedFilter === 'confidential') return matchesSearch && coin.confidentialTransferEnabled;
    if (selectedFilter === 'trending') return matchesSearch && coin.priceChange24h > 5;
    
    return matchesSearch;
  });

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Token-2022 Trading</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
            Trade the latest Token-2022 coins with advanced features
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={20} color={theme.colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search Token-2022 coins..."
              placeholderTextColor={theme.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'transfer-hooks', label: 'Transfer Hooks' },
              { key: 'confidential', label: 'Confidential' },
              { key: 'trending', label: 'Trending' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  { backgroundColor: selectedFilter === filter.key ? theme.colors.primary : theme.colors.card },
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  { color: selectedFilter === filter.key ? '#000' : theme.colors.text }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trading Pairs */}
        <View style={styles.tradingSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Available Pairs ({filteredCoins.length})
            </Text>
          </View>

          <View style={styles.coinsList}>
            {filteredCoins.map((coin, index) => (
              <Animated.View
                key={coin.id}
                style={{
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20 * (index + 1)],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity 
                  style={[styles.coinCard, { backgroundColor: theme.colors.card }]}
                  onPress={() => handleTrade(coin)}
                >
                  <View style={styles.coinHeader}>
                    <View style={styles.coinLeft}>
                      <View style={[styles.coinIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Text style={[styles.coinSymbol, { color: theme.colors.primary }]}>{coin.symbol}</Text>
                      </View>
                      <View style={styles.coinInfo}>
                        <Text style={[styles.coinName, { color: theme.colors.text }]}>{coin.name}</Text>
                        <Text style={[styles.coinDescription, { color: theme.colors.muted }]}>{coin.description}</Text>
                      </View>
                    </View>
                    <View style={styles.coinRight}>
                      <Text style={[styles.coinPrice, { color: theme.colors.text }]}>
                        ${formatPrice(coin.price)}
                      </Text>
                      <Text style={[
                        styles.coinChange,
                        { color: coin.priceChange24h >= 0 ? theme.colors.success : theme.colors.error }
                      ]}>
                        {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.coinStats}>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Volume 24h</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {formatNumber(coin.volume24h)}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Market Cap</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {formatNumber(coin.marketCap)}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Liquidity</Text>
                      <Text style={[styles.statValue, { color: theme.colors.text }]}>
                        {formatNumber(coin.liquidity)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.coinFeatures}>
                    {coin.transferHookEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Ionicons name="link" size={12} color={theme.colors.primary} />
                        <Text style={[styles.featureText, { color: theme.colors.primary }]}>Transfer Hooks</Text>
                      </View>
                    )}
                    {coin.confidentialTransferEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Ionicons name="eye-off" size={12} color={theme.colors.success} />
                        <Text style={[styles.featureText, { color: theme.colors.success }]}>Confidential</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={[styles.tradeButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleTrade(coin)}
                  >
                    <Ionicons name="swap-horizontal" size={16} color="#000" />
                    <Text style={[styles.tradeButtonText, { color: '#000' }]}>Trade {coin.symbol}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* No Results */}
        {filteredCoins.length === 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color={theme.colors.muted} />
            <Text style={[styles.noResultsTitle, { color: theme.colors.text }]}>No coins found</Text>
            <Text style={[styles.noResultsSubtitle, { color: theme.colors.muted }]}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tradingSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  coinsList: {
    gap: 16,
  },
  coinCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coinSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  coinDescription: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  coinRight: {
    alignItems: 'flex-end',
  },
  coinPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  coinChange: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  coinStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  coinFeatures: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  noResultsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
}); 