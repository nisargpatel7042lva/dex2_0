import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TokenCard from '../components/TokenCard';
import { useApp } from '../context/AppContext';
import { PairData, SearchResult, TokenMarketData } from '../services/DEXService';

const SearchScreen: React.FC = () => {
  const { dexService } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ pairs: [], tokens: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'pairs'>('tokens');

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults({ pairs: [], tokens: [] });
    }
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await dexService.searchTokens(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTokenItem = ({ item }: { item: TokenMarketData }) => (
    <TokenCard token={item} />
  );

  const renderPairItem = ({ item }: { item: PairData }) => (
    <TouchableOpacity style={styles.pairCard}>
      <View style={styles.pairHeader}>
        <View style={styles.pairTokens}>
          <View style={styles.tokenPair}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>
                {item.baseToken.symbol.charAt(0)}
              </Text>
            </View>
            <Text style={styles.tokenSymbol}>{item.baseToken.symbol}</Text>
          </View>
          <Text style={styles.pairSeparator}>/</Text>
          <View style={styles.tokenPair}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenIconText}>
                {item.quoteToken.symbol.charAt(0)}
              </Text>
            </View>
            <Text style={styles.tokenSymbol}>{item.quoteToken.symbol}</Text>
          </View>
        </View>
        <View style={styles.pairPrice}>
          <Text style={styles.priceText}>${item.priceUsd}</Text>
          <Text style={[
            styles.priceChange,
            parseFloat(item.priceChange.h24.toString()) >= 0 ? styles.positiveChange : styles.negativeChange
          ]}>
            {parseFloat(item.priceChange.h24.toString()) >= 0 ? '+' : ''}
            {parseFloat(item.priceChange.h24.toString()).toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.pairStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Volume 24h</Text>
          <Text style={styles.statValue}>
            ${(item.volume.h24 / 1000).toFixed(0)}K
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Liquidity</Text>
          <Text style={styles.statValue}>
            ${item.liquidity ? (item.liquidity.usd / 1000).toFixed(0) + 'K' : 'N/A'}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>DEX</Text>
          <Text style={styles.statValue}>{item.dexId.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
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
            Tokens ({searchResults.tokens.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pairs' && styles.activeTab]}
          onPress={() => setActiveTab('pairs')}
        >
          <Text style={[styles.tabText, activeTab === 'pairs' && styles.activeTabText]}>
            Pairs ({searchResults.pairs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : activeTab === 'tokens' ? (
        <FlatList<TokenMarketData>
          data={searchResults.tokens}
          renderItem={renderTokenItem}
          keyExtractor={(item) => item.mint.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tokensList}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <FlatList<PairData>
          data={searchResults.pairs}
          renderItem={renderPairItem}
          keyExtractor={(item) => item.pairAddress}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pairsList}
          ListEmptyComponent={renderEmptyState}
          numColumns={1}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24, // Increased vertical padding to prevent text cutting
    paddingTop: 40, // Extra top padding for status bar
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
  tokenIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  tokenIconText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
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
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
  },
  pairStats: {
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

export default SearchScreen; 