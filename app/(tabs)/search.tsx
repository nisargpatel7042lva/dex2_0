import { useAppTheme } from '@/components/app-theme';
import { AppView } from '@/components/app-view';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
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
    transferHookEnabled: true,
    confidentialTransferEnabled: false,
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
    transferHookEnabled: false,
    confidentialTransferEnabled: false,
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    priceChangePercent24h: 0.1,
    volume24h: 5000000,
    marketCap: 30000000000,
    liquidity: 20000000,
    dexId: 'raydium',
    transferHookEnabled: true,
    confidentialTransferEnabled: true,
  },
];

const TokenSearchResult = ({ token }: { token: any }) => {
  const { theme } = useAppTheme();
  const isPositive = token.priceChangePercent24h >= 0;

  return (
    <TouchableOpacity style={[styles.tokenResult, { backgroundColor: theme.colors.card }]}>
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
            <View style={styles.tokenFeatures}>
              {token.transferHookEnabled && (
                <View style={[styles.featureBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="link" size={12} color={theme.colors.accent} />
                  <Text style={[styles.featureText, { color: theme.colors.accent }]}>Hook</Text>
                </View>
              )}
              {token.confidentialTransferEnabled && (
                <View style={[styles.featureBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="eye-off" size={12} color={theme.colors.success} />
                  <Text style={[styles.featureText, { color: theme.colors.success }]}>Private</Text>
                </View>
              )}
            </View>
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

export default function SearchScreen() {
  const { theme } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(mockTokens);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredTokens(mockTokens);
    } else {
      const filtered = mockTokens.filter(token =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  };

  const handleFilter = (filter: string) => {
    setSelectedFilter(filter);
    let filtered = mockTokens;
    
    switch (filter) {
      case 'token2022':
        filtered = mockTokens.filter(token => token.transferHookEnabled || token.confidentialTransferEnabled);
        break;
      case 'trending':
        filtered = mockTokens.filter(token => Math.abs(token.priceChangePercent24h) > 3);
        break;
      case 'high-volume':
        filtered = mockTokens.filter(token => token.volume24h > 1000000);
        break;
      default:
        filtered = mockTokens;
    }
    
    setFilteredTokens(filtered);
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TokenSearchResult token={item} />
  );

  return (
    <AppView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Search Tokens</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
          Discover Token-2022 assets and analyze market data
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search" size={20} color={theme.colors.muted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by symbol or name..."
          placeholderTextColor={theme.colors.muted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All Tokens' },
            { key: 'token2022', label: 'Token-2022' },
            { key: 'trending', label: 'Trending' },
            { key: 'high-volume', label: 'High Volume' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.card },
                selectedFilter === filter.key && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => handleFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: selectedFilter === filter.key ? '#000000' : theme.colors.text }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>
          {filteredTokens.length} tokens found
        </Text>
        
        <FlatList
          data={filteredTokens}
          renderItem={renderTokenItem}
          keyExtractor={(item) => item.mint}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tokensList}
        />
      </View>
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  filtersContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  tokensList: {
    paddingBottom: 100,
  },
  tokenResult: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  tokenFeatures: {
    flexDirection: 'row',
    gap: 4,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
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