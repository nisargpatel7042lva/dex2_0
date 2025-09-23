import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { } from '../services/WalletService';

interface TokenBalance {
  mint: { toString: () => string };
  symbol: string;
  name: string;
  balance: number;
  value?: number;
  price?: number;
  decimals: number;
}

const PortfolioScreen: React.FC = () => {
  const { walletService, walletInfo, requestAirdrop } = useApp();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadPortfolio();
  }, [walletInfo]);

  const loadPortfolio = async () => {
    if (!walletInfo) return;

    try {
      const balances = await walletService.getTokenBalances(walletInfo.publicKey);
      setTokenBalances(balances);
      
      // Calculate total portfolio value
      const total = balances.reduce((sum, token) => {
        return sum + (token.value || 0);
      }, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  };

  const handleAirdrop = async () => {
    try {
      await requestAirdrop(1);
      await loadPortfolio();
    } catch (error) {
      console.error('Error requesting airdrop:', error);
    }
  };

  const renderTokenItem = ({ item }: { item: TokenBalance }) => (
    <TouchableOpacity style={styles.tokenItem}>
      <View style={styles.tokenInfo}>
        <View style={styles.tokenIcon}>
          <Text style={styles.tokenIconText}>
            {item.symbol.charAt(0)}
          </Text>
        </View>
        <View style={styles.tokenDetails}>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          <Text style={styles.tokenName}>{item.name}</Text>
        </View>
      </View>
      
      <View style={styles.tokenBalance}>
        <Text style={styles.balanceAmount}>
          {item.balance.toLocaleString()}
        </Text>
        <Text style={styles.balanceValue}>
          ${item.value?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatNumber = (num: number): string => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Portfolio Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Portfolio</Text>
            <TouchableOpacity style={styles.airdropButton} onPress={handleAirdrop}>
              <Ionicons name="add-circle" size={20} color="#6366f1" />
              <Text style={styles.airdropText}>Airdrop</Text>
            </TouchableOpacity>
          </View>
          
          {walletInfo && (
            <View style={styles.walletInfo}>
              <Text style={styles.walletAddress}>
                {walletInfo.publicKey.toString().slice(0, 6)}...
                {walletInfo.publicKey.toString().slice(-4)}
              </Text>
              <Text style={styles.walletBalance}>
                {walletInfo.balance.toFixed(4)} SOL
              </Text>
            </View>
          )}
        </View>

        {/* Portfolio Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>${formatNumber(totalValue)}</Text>
            <Text style={styles.summaryChange}>+5.2% today</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Tokens</Text>
              <Text style={styles.statValue}>{tokenBalances.length}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24h Change</Text>
              <Text style={[styles.statValue, styles.positiveChange]}>+2.1%</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>7d Change</Text>
              <Text style={[styles.statValue, styles.negativeChange]}>-1.5%</Text>
            </View>
          </View>
        </View>

        {/* Token Holdings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Token Holdings</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {tokenBalances.length > 0 ? (
            <FlatList
              data={tokenBalances}
              renderItem={renderTokenItem}
              keyExtractor={(item) => item.mint.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.tokensList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No tokens found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Your token holdings will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
                <Ionicons name="add-circle" size={24} color="#6366f1" />
              </View>
              <Text style={styles.actionTitle}>Add Token</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="swap-horizontal" size={24} color="#10b981" />
              </View>
              <Text style={styles.actionTitle}>Swap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="trending-up" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.actionTitle}>Trade</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="send" size={24} color="#ef4444" />
              </View>
              <Text style={styles.actionTitle}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityContainer}>
            {[
              { type: 'swap', token: 'SOL', amount: '0.5', time: '2 hours ago' },
              { type: 'receive', token: 'DEX2', amount: '1000', time: '1 day ago' },
              { type: 'send', token: 'USDC', amount: '50', time: '3 days ago' },
            ].map((activity, index) => (
              <View key={`${activity.type}-${activity.token}-${index}`} style={styles.activityItem}>
                <View style={[
                  styles.activityIcon,
                  activity.type === 'swap' && { backgroundColor: '#eef2ff' },
                  activity.type === 'receive' && { backgroundColor: '#f0fdf4' },
                  activity.type === 'send' && { backgroundColor: '#fef2f2' },
                ]}>
                  <Ionicons 
                    name={
                      activity.type === 'swap' ? 'swap-horizontal' :
                      activity.type === 'receive' ? 'arrow-down' : 'arrow-up'
                    } 
                    size={16} 
                    color={
                      activity.type === 'swap' ? '#6366f1' :
                      activity.type === 'receive' ? '#10b981' : '#ef4444'
                    } 
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>
                    {activity.type === 'swap' ? 'Swapped' :
                     activity.type === 'receive' ? 'Received' : 'Sent'} {activity.amount} {activity.token}
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  airdropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  airdropText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
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
  tokensList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: 12,
    color: '#6b7280',
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
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
    color: '#1f2937',
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
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default PortfolioScreen; 