import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarketOverview from '../components/MarketOverview';
import QuickActions from '../components/QuickActions';
import TokenCard from '../components/TokenCard';
import { useApp } from '../context/AppContext';
import { TokenMarketData } from '../services/DEXService';

const HomeScreen: React.FC = () => {
  const { dexService, walletInfo } = useApp();
  const [trendingTokens, setTrendingTokens] = useState<TokenMarketData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    loadTrendingTokens();
  }, []);

  const loadTrendingTokens = async () => {
    try {
      const tokens = await dexService.getTrendingTokens();
      setTrendingTokens(tokens);
    } catch (error) {
      console.error('Error loading trending tokens:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrendingTokens();
    setRefreshing(false);
  };

  const renderTokenItem = ({ item }: { item: TokenMarketData }) => (
    <TokenCard token={item} />
  );

  const renderTimeframeButton = (timeframe: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.timeframeButton,
        selectedTimeframe === timeframe && styles.timeframeButtonActive,
      ]}
      onPress={() => setSelectedTimeframe(timeframe)}
    >
      <Text
        style={[
          styles.timeframeButtonText,
          selectedTimeframe === timeframe && styles.timeframeButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back{walletInfo ? `, ${walletInfo.publicKey.toString().slice(0, 4)}...${walletInfo.publicKey.toString().slice(-4)}` : ''}!
            </Text>
            <Text style={styles.subtitle}>
              Track Token-2022 markets in real-time
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Market Overview */}
        <MarketOverview />

        {/* Quick Actions */}
        <QuickActions />

        {/* Trending Tokens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Tokens</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {renderTimeframeButton('1h', '1H')}
            {renderTimeframeButton('6h', '6H')}
            {renderTimeframeButton('24h', '24H')}
            {renderTimeframeButton('7d', '7D')}
          </View>

          {/* Tokens List */}
          <FlatList
            data={trendingTokens}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.mint.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tokensList}
          />
        </View>

        {/* Top Gainers & Losers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Movers</Text>
          
          <View style={styles.moversContainer}>
            <View style={styles.moversColumn}>
              <Text style={styles.moversTitle}>Top Gainers</Text>
              {trendingTokens
                .filter(token => token.priceChangePercent24h > 0)
                .slice(0, 3)
                .map((token, index) => (
                  <View key={token.mint.toString()} style={styles.moverItem}>
                    <View style={styles.moverRank}>
                      <Text style={styles.moverRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.moverInfo}>
                      <Text style={styles.moverSymbol}>{token.symbol}</Text>
                      <Text style={styles.moverName}>{token.name}</Text>
                    </View>
                    <View style={styles.moverPrice}>
                      <Text style={styles.moverPriceText}>${token.price.toFixed(4)}</Text>
                      <Text style={[styles.moverChange, styles.moverChangePositive]}>
                        +{token.priceChangePercent24h.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                ))}
            </View>

            <View style={styles.moversColumn}>
              <Text style={styles.moversTitle}>Top Losers</Text>
              {trendingTokens
                .filter(token => token.priceChangePercent24h < 0)
                .slice(0, 3)
                .map((token, index) => (
                  <View key={token.mint.toString()} style={styles.moverItem}>
                    <View style={styles.moverRank}>
                      <Text style={styles.moverRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.moverInfo}>
                      <Text style={styles.moverSymbol}>{token.symbol}</Text>
                      <Text style={styles.moverName}>{token.name}</Text>
                    </View>
                    <View style={styles.moverPrice}>
                      <Text style={styles.moverPriceText}>${token.price.toFixed(4)}</Text>
                      <Text style={[styles.moverChange, styles.moverChangeNegative]}>
                        {token.priceChangePercent24h.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {trendingTokens.slice(0, 5).map((token) => (
              <View key={token.mint.toString()} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="trending-up" size={16} color="#10b981" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activitySymbol}>{token.symbol}</Text> price up{' '}
                    <Text style={styles.activityChange}>
                      +{token.priceChangePercent24h.toFixed(2)}%
                    </Text>
                  </Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
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
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
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
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  timeframeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#ffffff',
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
  timeframeButtonActive: {
    backgroundColor: '#6366f1',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeframeButtonTextActive: {
    color: '#ffffff',
  },
  tokensList: {
    paddingRight: 20,
  },
  moversContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  moversColumn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moversTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  moverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moverRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moverRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  moverInfo: {
    flex: 1,
  },
  moverSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  moverName: {
    fontSize: 12,
    color: '#6b7280',
  },
  moverPrice: {
    alignItems: 'flex-end',
  },
  moverPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  moverChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  moverChangePositive: {
    color: '#10b981',
  },
  moverChangeNegative: {
    color: '#ef4444',
  },
  activityContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1f2937',
  },
  activitySymbol: {
    fontWeight: '600',
  },
  activityChange: {
    fontWeight: '600',
    color: '#10b981',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default HomeScreen; 