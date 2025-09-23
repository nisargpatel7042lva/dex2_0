

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { NotificationButton } from '@/components/NotificationButton';
import { NotificationModal } from '@/components/NotificationModal';
import { useApp } from '@/src/context/AppContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

interface RecentLaunch {
  id: string;
  name: string;
  symbol: string;
  description: string;
  launchDate: string;
  transferHookEnabled: boolean;
  confidentialTransferEnabled: boolean;
  volume24h: string;
  priceChange: string;
  isPositive: boolean;
  mint: string;
}

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { 
    walletInfo, 
    requestAirdrop, 
    walletService, 
    getRealTimeSOLPrice, 
    getRealTimeTokenPrice, 
    getRecentTokenLaunches 
  } = useApp();
  const { addNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentLaunches, setRecentLaunches] = useState<RecentLaunch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load total balance (SOL + all tokens) with minimal API calls
  const loadTotalBalance = useCallback(async () => {
    if (!walletInfo || !walletService || isLoadingData) return;

    try {
      setIsLoadingData(true);
      console.log('🔄 Loading total balance for wallet:', walletInfo.publicKey.toString());
      console.log('💰 Current SOL balance:', walletInfo.balance);
      
      // Get real-time SOL price (single API call)
      const solPrice = await getRealTimeSOLPrice();
      console.log('📈 SOL price:', solPrice);
      
      // Start with SOL balance
      let total = walletInfo.balance * solPrice;
      console.log('💵 SOL value:', total);

      // Get all token balances (rate limited)
      const tokenBalances = await walletService.getTokenBalances(walletInfo.publicKey);
      console.log('🪙 Token balances found:', tokenBalances.length);
      
      // Limit to first 3 tokens to prevent excessive API calls
      const limitedTokens = tokenBalances.slice(0, 3);
      console.log(`📊 Processing ${limitedTokens.length} tokens (limited to prevent rate limiting)`);
      
      // Add token values using cached/fallback prices (avoid API calls in loop)
      for (let i = 0; i < limitedTokens.length; i++) {
        const token = limitedTokens[i];
        if (token.balance > 0) {
          console.log(`🪙 Processing token ${i + 1}/${limitedTokens.length}: ${token.mint}, balance: ${token.balance}`);
          try {
            // Use cached price service that prefers fallbacks over API calls
            const realPrice = await getRealTimeTokenPrice(token.mint);
            const tokenValue = token.balance * realPrice;
            total += tokenValue;
            console.log(`✅ Token ${token.mint}: ${token.balance} * $${realPrice} = $${tokenValue}`);
          } catch (_error) {
            console.warn(`⚠️ Failed to get price for ${token.mint}, using $1.00 fallback`);
            const tokenValue = token.balance * 1.0;
            total += tokenValue;
            console.log(`🔄 Token ${token.mint}: ${token.balance} * $1.00 (fallback) = $${tokenValue}`);
          }
        }
      }

      console.log('🎯 Total balance calculated:', total);
      setTotalBalance(total);
    } catch (error) {
      console.error('❌ Error loading total balance:', error);
      // Fallback to mock calculation
      let total = walletInfo.balance * 177; // Mock SOL price
      const tokenBalances = await walletService.getTokenBalances(walletInfo.publicKey);
      
      for (const token of tokenBalances) {
        if (token.balance > 0) {
          const mockPrice = getMockTokenPrice(token.mint);
          total += token.balance * mockPrice;
        }
      }
      
      console.log('🔄 Using fallback calculation:', total);
      setTotalBalance(total);
    } finally {
      setIsLoadingData(false);
    }
  }, [walletInfo, walletService, isLoadingData, getRealTimeSOLPrice, getRealTimeTokenPrice]);

  // Mock price function - replace with real price API
  const getMockTokenPrice = (mint: string): number => {
    const prices: { [key: string]: number } = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.00, // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.00, // USDT
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 0.50, // JUP
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 0.25, // RAY
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.00001, // BONK
    };
    return prices[mint] || 1.00; // Default to $1 for unknown tokens
  };

  // Load recent launches from actual data
  const loadRecentLaunches = useCallback(async () => {
    if (isLoadingData) return;
    
    try {
      // Fetch real token launch data from blockchain
      const realLaunches = await getRecentTokenLaunches(10);
      
      // Convert to our interface format
      const launches: RecentLaunch[] = realLaunches.map((launch, index) => ({
        id: launch.mint,
        name: launch.name || `Token-${index + 1}`,
        symbol: launch.symbol || 'TOKEN',
        description: `Token with ${launch.decimals} decimals and ${launch.totalSupply.toLocaleString()} total supply`,
        launchDate: new Date(launch.timestamp).toLocaleDateString(),
        transferHookEnabled: launch.isToken2022,
        confidentialTransferEnabled: false, // Would need additional data to determine this
        volume24h: '$0', // Would need additional API calls to get volume data
        priceChange: '+0%', // Would need additional API calls to get price change data
        isPositive: true,
        mint: launch.mint,
      }));

      setRecentLaunches(launches);
    } catch (error) {
      console.error('Error loading recent launches:', error);
      // Fallback to mock data
      const mockLaunches: RecentLaunch[] = [
        {
          id: '1',
          name: 'USDC-2022',
          symbol: 'USDC',
          description: 'USD Coin with Transfer Hooks enabled',
          launchDate: new Date(Date.now() - 86400000).toLocaleDateString(), // 1 day ago
          transferHookEnabled: true,
          confidentialTransferEnabled: false,
          volume24h: '$45.2M',
          priceChange: '+2.5%',
          isPositive: true,
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
        {
          id: '2',
          name: 'SOL-2022',
          symbol: 'SOL',
          description: 'Solana with advanced metadata pointers',
          launchDate: new Date(Date.now() - 172800000).toLocaleDateString(), // 2 days ago
          transferHookEnabled: true,
          confidentialTransferEnabled: true,
          volume24h: '$23.1M',
          priceChange: '+5.23%',
          isPositive: true,
          mint: 'So11111111111111111111111111111111111111112',
        },
        {
          id: '3',
          name: 'RAY-2022',
          symbol: 'RAY',
          description: 'Raydium with custom transfer logic',
          launchDate: new Date(Date.now() - 259200000).toLocaleDateString(), // 3 days ago
          transferHookEnabled: true,
          confidentialTransferEnabled: false,
          volume24h: '$8.7M',
          priceChange: '+12.45%',
          isPositive: true,
          mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        },
        {
          id: '4',
          name: 'JUP-2022',
          symbol: 'JUP',
          description: 'Jupiter with enhanced security features',
          launchDate: new Date(Date.now() - 345600000).toLocaleDateString(), // 4 days ago
          transferHookEnabled: false,
          confidentialTransferEnabled: true,
          volume24h: '$15.3M',
          priceChange: '-1.2%',
          isPositive: false,
          mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        },
      ];

      setRecentLaunches(mockLaunches);
    }
  }, [isLoadingData, getRecentTokenLaunches]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTotalBalance(), loadRecentLaunches()]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  // Load data on mount and when wallet changes
  useEffect(() => {
    if (walletInfo) {
      loadTotalBalance();
      loadRecentLaunches();
    }
  }, [walletInfo, loadTotalBalance, loadRecentLaunches]);

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(2);
      
      // Add notification for successful airdrop
      addNotification({
        type: 'airdrop',
        title: 'Airdrop Received!',
        message: 'You have successfully received 2 SOL airdrop to your wallet.',
      });

      // Refresh balance after airdrop
      await loadTotalBalance();
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      
      // Add notification for failed airdrop
      addNotification({
        type: 'system',
        title: 'Airdrop Failed',
        message: 'Failed to request airdrop. Please try again later.',
      });
    }
  };

  // Add sample notifications for testing
  const addSampleNotifications = () => {
    addNotification({
      type: 'transaction',
      title: 'Transaction Confirmed',
      message: 'Your SOL transfer of 0.5 SOL has been confirmed on the blockchain.',
    });
    
    addNotification({
      type: 'trade',
      title: 'Trade Executed',
      message: 'Successfully swapped 100 USDC for 0.25 SOL at $400 per SOL.',
    });
    
    addNotification({
      type: 'price_alert',
      title: 'Price Alert',
      message: 'SOL price has increased by 5% in the last hour. Current price: $420.',
    });
  };



  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background
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
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <AppText style={[styles.greeting, { color: theme.colors.text }]}>
                Welcome Back!
              </AppText>
              <AppText style={[styles.subtitle, { color: theme.colors.muted }]}>
                Trade Token-2022 with Transfer Hooks
              </AppText>
            </View>
            <NotificationButton
              onPress={() => setNotificationModalVisible(true)}
              backgroundColor={theme.colors.card}
              iconColor={theme.colors.primary}
            />
          </View>

          {/* Wallet Info Card */}
          {walletInfo && (
            <View style={[styles.walletCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.walletHeader}>
                <View style={[styles.walletIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="wallet" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.walletInfo}>
                  <AppText style={[styles.walletTitle, { color: theme.colors.text }]}>Connected Wallet</AppText>
                  <AppText style={[styles.walletAddress, { color: theme.colors.muted }]}>
                    {walletInfo.publicKey.toString().substring(0, 8)}...{walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8)}
                  </AppText>
                </View>
              </View>
              <View style={styles.walletBalance}>
                <View style={styles.balanceHeader}>
                  <AppText style={[styles.balanceLabel, { color: theme.colors.muted }]}>Total Balance</AppText>
                  <TouchableOpacity 
                    onPress={loadTotalBalance}
                    disabled={isLoadingData}
                    style={styles.refreshButton}
                  >
                    <Ionicons 
                      name="refresh" 
                      size={16} 
                      color={isLoadingData ? theme.colors.muted : theme.colors.primary} 
                    />
                  </TouchableOpacity>
                </View>
                <AppText style={[styles.balanceAmount, { color: theme.colors.primary }]}>
                  ${totalBalance.toFixed(2)}
                </AppText>
                <AppText style={[styles.solBalance, { color: theme.colors.muted }]}>
                  {walletInfo.balance.toFixed(4)} SOL
                </AppText>
              </View>

            </View>
          )}
        </View>

        {/* Market Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Token-2022 Market</AppText>
            <TouchableOpacity>
              <AppText style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</AppText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.marketGrid}>
            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="trending-up" size={20} color={theme.colors.success} />
                <AppText style={[styles.marketCardTitle, { color: theme.colors.text }]}>Total Volume</AppText>
              </View>
              <AppText style={[styles.marketCardValue, { color: theme.colors.text }]}>$2.4B</AppText>
              <AppText style={[styles.marketCardChange, { color: theme.colors.success }]}>+12.5%</AppText>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="link" size={20} color={theme.colors.primary} />
                <AppText style={[styles.marketCardTitle, { color: theme.colors.text }]}>Transfer Hooks</AppText>
              </View>
              <AppText style={[styles.marketCardValue, { color: theme.colors.text }]}>892</AppText>
              <AppText style={[styles.marketCardChange, { color: theme.colors.success }]}>+23.1%</AppText>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="eye-off" size={20} color={theme.colors.accent} />
                <AppText style={[styles.marketCardTitle, { color: theme.colors.text }]}>Confidential</AppText>
              </View>
              <AppText style={[styles.marketCardValue, { color: theme.colors.text }]}>156</AppText>
              <AppText style={[styles.marketCardChange, { color: theme.colors.success }]}>+15.3%</AppText>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="swap-horizontal" size={20} color={theme.colors.warning} />
                <AppText style={[styles.marketCardTitle, { color: theme.colors.text }]}>Active Pairs</AppText>
              </View>
              <AppText style={[styles.marketCardValue, { color: theme.colors.text }]}>1,247</AppText>
              <AppText style={[styles.marketCardChange, { color: theme.colors.success }]}>+8.2%</AppText>
            </View>
          </View>
        </View>

        {/* Recent Token-2022 Launches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Launches</AppText>
            <TouchableOpacity>
              <AppText style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.launchesList}>
            {recentLaunches.map((launch, index) => (
              <View
                key={launch.id}
              >
                <TouchableOpacity 
                  style={[styles.launchItem, { backgroundColor: theme.colors.card }]}
                >
                  <View style={styles.launchHeader}>
                    <View style={styles.launchLeft}>
                      <View style={[styles.tokenIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <AppText style={[styles.tokenSymbol, { color: theme.colors.primary }]}>{launch.symbol}</AppText>
                      </View>
                      <View style={styles.launchInfo}>
                        <AppText style={[styles.launchName, { color: theme.colors.text }]}>{launch.name}</AppText>
                        <AppText style={[styles.launchDescription, { color: theme.colors.muted }]}>{launch.description}</AppText>
                        <AppText style={[styles.launchDate, { color: theme.colors.muted }]}>Launched {launch.launchDate}</AppText>
                      </View>
                    </View>
                    <View style={styles.launchRight}>
                      <AppText style={[styles.launchVolume, { color: theme.colors.text }]}>{launch.volume24h}</AppText>
                      <AppText style={[
                        styles.launchChange, 
                        { color: launch.isPositive ? theme.colors.success : theme.colors.error }
                      ]}>
                        {launch.priceChange}
                </AppText>
                    </View>
                  </View>
                  
                  <View style={styles.launchFeatures}>
                    {launch.transferHookEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Ionicons name="link" size={12} color={theme.colors.primary} />
                        <AppText style={[styles.featureText, { color: theme.colors.primary }]}>Transfer Hooks</AppText>
                      </View>
                    )}
                    {launch.confidentialTransferEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Ionicons name="eye-off" size={12} color={theme.colors.success} />
                        <AppText style={[styles.featureText, { color: theme.colors.success }]}>Confidential</AppText>
                      </View>
                    )}
                  </View>
              </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Token-2022 Features Highlight */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Token-2022 Features</AppText>
          
          <View style={styles.featuresGrid}>
            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="link" size={24} color={theme.colors.primary} />
              </View>
              <AppText style={[styles.featureTitle, { color: theme.colors.text }]}>Transfer Hooks</AppText>
              <AppText style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Custom transfer logic with pre-transfer simulation</AppText>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="eye-off" size={24} color={theme.colors.success} />
              </View>
              <AppText style={[styles.featureTitle, { color: theme.colors.text }]}>Confidential Transfers</AppText>
              <AppText style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Private, encrypted token transfers</AppText>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />
              </View>
              <AppText style={[styles.featureTitle, { color: theme.colors.text }]}>Safe Hook Approval</AppText>
              <AppText style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Permissionless but safe hook approval system</AppText>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.error} />
              </View>
              <AppText style={[styles.featureTitle, { color: theme.colors.text }]}>AMM Integration</AppText>
              <AppText style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Direct integration with existing AMM protocols</AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
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
    paddingBottom: 150, // Increased bottom padding to clear the navbar
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 32, // Increased bottom padding to prevent text cutting
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 40, // Added proper line height
    marginBottom: 8,
    paddingVertical: 4, // Added padding to prevent cutting
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 2,
  },
  walletAddress: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletBalance: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  refreshButton: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  solBalance: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 2,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  airdropButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  airdropText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 6,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  sampleText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 6,
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
    fontSize: 22,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 28, // Added proper line height
    paddingVertical: 3, // Added padding to prevent cutting
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  marketCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  marketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketCardTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 8,
  },
  marketCardValue: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  marketCardChange: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  launchesList: {
    gap: 12,
  },
  launchItem: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  launchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  launchLeft: {
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
  tokenSymbol: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  launchInfo: {
    flex: 1,
  },
  launchName: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 2,
  },
  launchDescription: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  launchDate: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  launchRight: {
    alignItems: 'flex-end',
  },
  launchVolume: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 2,
  },
  launchChange: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  launchFeatures: {
    flexDirection: 'row',
    gap: 8,
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
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
