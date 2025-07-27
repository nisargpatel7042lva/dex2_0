import { AppView } from '@/components/app-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Mock data for demo
const mockTokens = [
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

const mockPairs = [
  {
    pairAddress: 'DEX2SOLPair123456789',
    baseToken: { symbol: 'DEX2', name: 'Dex2.0 Token' },
    quoteToken: { symbol: 'USDC', name: 'USD Coin' },
    priceUsd: '0.25',
    priceChange: { h24: 5.2 },
    volume: { h24: 125000 },
    liquidity: { usd: 500000 },
    dexId: 'raydium',
  },
];

const TokenCard = ({ token }: { token: any }) => {
  const isPositive = token.priceChangePercent24h >= 0;

  return (
    <TouchableOpacity style={styles.tokenCard}>
      <View style={styles.tokenHeader}>
        <View style={styles.tokenInfo}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>
              {token.symbol.charAt(0)}
            </Text>
          </View>
          <View style={styles.tokenDetails}>
            <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            <Text style={styles.tokenName}>{token.name}</Text>
          </View>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.price}>${token.price.toFixed(4)}</Text>
          <View style={[styles.changeContainer, isPositive ? styles.positiveChange : styles.negativeChange]}>
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={isPositive ? '#10b981' : '#ef4444'} 
            />
            <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
              {isPositive ? '+' : ''}{token.priceChangePercent24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tokenStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Market Cap</Text>
          <Text style={styles.statValue}>
            ${(token.marketCap / 1000000).toFixed(1)}M
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Volume 24h</Text>
          <Text style={styles.statValue}>
            ${(token.volume24h / 1000).toFixed(0)}K
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Liquidity</Text>
          <Text style={styles.statValue}>
            ${(token.liquidity / 1000).toFixed(0)}K
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PairCard = ({ pair }: { pair: any }) => {
  const isPositive = pair.priceChange.h24 >= 0;

  return (
    <TouchableOpacity style={styles.pairCard}>
      <View style={styles.pairHeader}>
        <View style={styles.pairTokens}>
          <View style={styles.tokenPair}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>
                {pair.baseToken.symbol.charAt(0)}
              </Text>
            </View>
            <Text style={styles.tokenSymbol}>{pair.baseToken.symbol}</Text>
          </View>
          <Text style={styles.pairSeparator}>/</Text>
          <View style={styles.tokenPair}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>
                {pair.quoteToken.symbol.charAt(0)}
              </Text>
            </View>
            <Text style={styles.tokenSymbol}>{pair.quoteToken.symbol}</Text>
          </View>
        </View>
        <View style={styles.pairPrice}>
          <Text style={styles.priceText}>${pair.priceUsd}</Text>
          <Text style={[
            styles.priceChange,
            isPositive ? styles.positiveChange : styles.negativeChange
          ]}>
            {isPositive ? '+' : ''}{pair.priceChange.h24.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.pairStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Volume 24h</Text>
          <Text style={styles.statValue}>
            ${(pair.volume.h24 / 1000).toFixed(0)}K
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Liquidity</Text>
          <Text style={styles.statValue}>
            ${(pair.liquidity.usd / 1000).toFixed(0)}K
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>DEX</Text>
          <Text style={styles.statValue}>{pair.dexId.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'pairs'>('tokens');

  const filteredTokens = mockTokens.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPairs = mockPairs.filter(pair => 
    pair.baseToken.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.baseToken.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTokenItem = ({ item }: { item: any }) => (
    <TokenCard token={item} />
  );

  const renderPairItem = ({ item }: { item: any }) => (
    <PairCard pair={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={48} color="#9ca3af" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No results found' : 'Search for tokens'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? 'Try searching with different keywords'
          : 'Enter a token name or symbol to get started'
        }
      </Text>
    </View>
  );

  return (
    <AppView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tokens, pairs, or addresses..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tokens' && styles.activeTab]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.activeTabText]}>
            Tokens ({filteredTokens.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pairs' && styles.activeTab]}
          onPress={() => setActiveTab('pairs')}
        >
          <Text style={[styles.tabText, activeTab === 'pairs' && styles.activeTabText]}>
            Pairs ({filteredPairs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'tokens' ? filteredTokens : filteredPairs}
          renderItem={activeTab === 'tokens' ? renderTokenItem : renderPairItem}
          keyExtractor={(item) => 
            activeTab === 'tokens' 
              ? item.mint
              : item.pairAddress
          }
          horizontal={activeTab === 'tokens'}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={activeTab === 'tokens' ? styles.tokensList : styles.pairsList}
          ListEmptyComponent={renderEmptyState}
          numColumns={activeTab === 'pairs' ? 1 : undefined}
        />
      )}
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eef2ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  tokensList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pairsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tokenCard: {
    width: 280,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
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
    backgroundColor: '#f0fdf4',
  },
  negativeChange: {
    backgroundColor: '#fef2f2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderTopColor: '#f3f4f6',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  pairCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pairTokens: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenPair: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairSeparator: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  pairPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  priceChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  pairStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 