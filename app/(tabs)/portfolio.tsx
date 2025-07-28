import { useAppTheme } from '@/components/app-theme';
import { AppView } from '@/components/app-view';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface TokenBalance {
  mint: { toString: () => string };
  symbol: string;
  name: string;
  balance: number;
  value?: number;
  price?: number;
  decimals: number;
}

const PortfolioCard = ({ token }: { token: TokenBalance }) => {
  const { theme } = useAppTheme();
  const isPositive = (token.price || 0) > 0;

  return (
    <TouchableOpacity style={[styles.portfolioCard, { backgroundColor: theme.colors.card }]}>
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
        <View style={styles.balanceInfo}>
          <Text style={[styles.balance, { color: theme.colors.text }]}>
            {token.balance.toFixed(4)}
          </Text>
          <Text style={[styles.value, { color: theme.colors.primary }]}>
            ${token.value?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      <View style={[styles.tokenStats, { borderTopColor: theme.colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Price</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${token.price?.toFixed(4) || '0.0000'}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Decimals</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {token.decimals}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Mint</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>
            {token.mint.toString().slice(0, 8)}...
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PortfolioOverview = ({ totalValue, solBalance }: { totalValue: number; solBalance: number }) => {
  const { theme } = useAppTheme();
  
  return (
    <View style={styles.portfolioOverview}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Portfolio Overview</Text>
      
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.overviewCardHeader}>
            <View style={[styles.overviewIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="wallet" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.overviewCardTitle, { color: theme.colors.muted }]}>Total Value</Text>
          </View>
          <Text style={[styles.overviewCardValue, { color: theme.colors.text }]}>
            ${totalValue.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.overviewCardHeader}>
            <View style={[styles.overviewIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="logo-bitcoin" size={20} color={theme.colors.success} />
            </View>
            <Text style={[styles.overviewCardTitle, { color: theme.colors.muted }]}>SOL Balance</Text>
          </View>
          <Text style={[styles.overviewCardValue, { color: theme.colors.text }]}>
            {solBalance.toFixed(4)} SOL
          </Text>
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
            <Ionicons name="send" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="download" size={24} color={theme.colors.success} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.warning} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Swap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.card }]}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="gift" size={24} color={theme.colors.error} />
          </View>
          <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Airdrop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PortfolioScreen() {
  const { theme } = useAppTheme();
  const { walletInfo, walletService, requestAirdrop } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  const loadTokenBalances = async () => {
    if (walletService && walletInfo && walletInfo.publicKey) {
      try {
        const balances = await walletService.getTokenBalances(walletInfo.publicKey);
        setTokenBalances(balances);
        
        const total = balances.reduce((sum, token) => sum + (token.value || 0), 0);
        setTotalValue(total);
      } catch (error) {
        console.error('Error loading token balances:', error);
        setTokenBalances([]);
        setTotalValue(0);
      }
    } else {
      // Reset state if no valid wallet info
      setTokenBalances([]);
      setTotalValue(0);
    }
  };

  useEffect(() => {
    loadTokenBalances();
  }, [walletInfo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTokenBalances();
    setRefreshing(false);
  };

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(1);
      await loadTokenBalances(); // Refresh balances
    } catch (err) {
      console.error('Error requesting airdrop:', err);
    }
  };

  const renderTokenItem = ({ item }: { item: TokenBalance }) => (
    <PortfolioCard token={item} />
  );

  if (!walletInfo) {
    return (
      <AppView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.muted} />
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
            No Wallet Connected
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.muted }]}>
            Connect your wallet to view your portfolio
          </Text>
        </View>
      </AppView>
    );
  }

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
              My Portfolio
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              Manage your Token-2022 assets
            </Text>
            <Text style={[styles.walletInfo, { color: theme.colors.primary }]}>
              {walletInfo.publicKey.toString().substring(0, 8)}...{walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8)}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.airdropButton, { backgroundColor: theme.colors.card }]}
            onPress={handleRequestAirdrop}
          >
            <Ionicons name="gift" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Overview */}
        <PortfolioOverview 
          totalValue={totalValue} 
          solBalance={walletInfo.balance} 
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Token Balances Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Token Balances</Text>
            <Text style={[styles.tokenCount, { color: theme.colors.muted }]}>
              {tokenBalances.length} tokens
            </Text>
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
            <View style={styles.emptyTokens}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.muted} />
              <Text style={[styles.emptyTokensText, { color: theme.colors.muted }]}>
                No tokens found in your wallet
              </Text>
            </View>
          )}
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
  airdropButton: {
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
  tokenCount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  portfolioOverview: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  overviewCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  overviewCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
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
  tokensList: {
    gap: 12,
  },
  portfolioCard: {
    borderRadius: 16,
    padding: 16,
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
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  emptyTokens: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTokensText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
}); 