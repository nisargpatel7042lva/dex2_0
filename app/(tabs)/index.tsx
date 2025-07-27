import { useAppTheme } from '@/components/app-theme';
import { AppView } from '@/components/app-view';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Mock data for demo
const mockTrendingTokens = [
  {
    mint: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    symbol: 'DEX2',
    name: 'Dex2.0 Token',
    price: 0.25,
    priceChangePercent24h: 5.2,
    volume24h: 125000,
    marketCap: 2500000,
    liquidity: 500000,
    dexId: 'raydium',
    txns: { h24: { buys: 150, sells: 120 } },
  },
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    price: 100.50,
    priceChangePercent24h: -2.2,
    volume24h: 2500000,
    marketCap: 45000000000,
    liquidity: 15000000,
    dexId: 'raydium',
    txns: { h24: { buys: 2500, sells: 2300 } },
  },
];

const TokenCard = ({ token }: { token: any }) => {
  const { theme } = useAppTheme();
  const isPositive = token.priceChangePercent24h >= 0;

  return (
    <TouchableOpacity style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.tokenHeader}>
        <View style={styles.tokenInfo}>
          <View style={[styles.tokenIcon, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tokenIconText}>
              {token.symbol.charAt(0)}
            </Text>
          </View>
          <View style={styles.tokenDetails}>
            <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>{token.symbol}</Text>
            <Text style={[styles.tokenName, { color: theme.colors.muted }]}>{token.name}</Text>
          </View>
        </View>
        <View style={styles.priceInfo}>
          <Text style={[styles.price, { color: theme.colors.text }]}>${token.price.toFixed(4)}</Text>
          <View style={[styles.changeContainer, isPositive ? styles.positiveChange : styles.negativeChange]}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={isPositive ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
              {isPositive ? '+' : ''}{token.priceChangePercent24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.tokenStats, { borderTopColor: theme.colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Market Cap</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${(token.marketCap / 1000000).toFixed(1)}M
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Volume 24h</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${(token.volume24h / 1000).toFixed(0)}K
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Liquidity</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${(token.liquidity / 1000).toFixed(0)}K
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MarketOverview = () => {
  const { theme } = useAppTheme();
  
  return (
    <View style={styles.marketOverview}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Market Overview</Text>
      
      <View style={styles.marketGrid}>
        <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.marketCardHeader}>
            <View style={[styles.marketIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.marketCardTitle, { color: theme.colors.muted }]}>Total Market Cap</Text>
          </View>
          <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>$45.2B</Text>
          <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+2.5% today</Text>
        </View>

        <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.marketCardHeader}>
            <View style={[styles.marketIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="bar-chart" size={20} color={theme.colors.success} />
            </View>
            <Text style={[styles.marketCardTitle, { color: theme.colors.muted }]}>24h Volume</Text>
          </View>
          <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>$2.5B</Text>
          <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+8.2% today</Text>
        </View>
      </View>
    </View>
  );
};

const QuickActions = () => {
  const { theme } = useAppTheme();
  
  return (
    <View style={styles.quickActions}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="search" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Search Tokens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="pie-chart" size={24} color={theme.colors.success} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>My Portfolio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="add-circle" size={24} color={theme.colors.warning} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Create Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.error} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Quick Swap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TokenCard token={item} />
  );

  return (
    <AppView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              Welcome back!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              Track Token-2022 markets in real-time
            </Text>
            {walletInfo && (
              <Text style={[styles.walletInfo, { color: theme.colors.primary }]}>
                Wallet: {walletInfo.publicKey.toString().substring(0, 8)}...{walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8)}
              </Text>
            )}
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Market Overview */}
        <MarketOverview />

        {/* Quick Actions */}
        <QuickActions />

        {/* Trending Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Trending Tokens</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Timeframe Selector */}
          <View style={[styles.timeframeContainer, { backgroundColor: theme.colors.card }]}>
            {['1H', '6H', '24H', '7D'].map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    { color: selectedTimeframe === timeframe ? '#ffffff' : theme.colors.muted },
                  ]}
                >
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tokens List */}
          <FlatList
            data={mockTrendingTokens}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.mint}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tokensList}
          />
        </View>
      </ScrollView>
    </AppView>
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
    paddingBottom: 100, // Add padding for bottom tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletInfo: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  marketOverview: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  marketGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  marketCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  marketCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  marketCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  marketCardChange: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  quickActions: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  timeframeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokensList: {
    paddingRight: 20,
  },
  tokenCard: {
    width: 280,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenName: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  positiveChange: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  negativeChange: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  positiveText: {
    color: '#10b981',
  },
  negativeText: {
    color: '#ef4444',
  },
  tokenStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
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
});
