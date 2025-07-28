import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { walletInfo, requestAirdrop } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(2);
    } catch (error) {
      console.error('Error requesting airdrop:', error);
    }
  };

  // Mock data for recent Token-2022 launches
  const recentLaunches = [
    {
      id: '1',
      name: 'USDC-2022',
      symbol: 'USDC',
      description: 'USD Coin with Transfer Hooks enabled',
      launchDate: '2024-01-15',
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      volume24h: '$45.2M',
      priceChange: '+2.5%',
      isPositive: true,
    },
    {
      id: '2',
      name: 'SOL-2022',
      symbol: 'SOL',
      description: 'Solana with advanced metadata pointers',
      launchDate: '2024-01-14',
      transferHookEnabled: true,
      confidentialTransferEnabled: true,
      volume24h: '$23.1M',
      priceChange: '+5.23%',
      isPositive: true,
    },
    {
      id: '3',
      name: 'RAY-2022',
      symbol: 'RAY',
      description: 'Raydium with custom transfer logic',
      launchDate: '2024-01-13',
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      volume24h: '$8.7M',
      priceChange: '+12.45%',
      isPositive: true,
    },
    {
      id: '4',
      name: 'SRM-2022',
      symbol: 'SRM',
      description: 'Serum with permissionless hook approval',
      launchDate: '2024-01-12',
      transferHookEnabled: true,
      confidentialTransferEnabled: true,
      volume24h: '$5.2M',
      priceChange: '-2.15%',
      isPositive: false,
    },
    {
      id: '5',
      name: 'ORCA-2022',
      symbol: 'ORCA',
      description: 'Orca with proxy token wrappers',
      launchDate: '2024-01-11',
      transferHookEnabled: true,
      confidentialTransferEnabled: false,
      volume24h: '$3.8M',
      priceChange: '+8.92%',
      isPositive: true,
    },
  ];

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
            <View>
              <Text style={[styles.greeting, { color: theme.colors.text }]}>
                Welcome Back!
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
                Trade Token-2022 with Transfer Hooks
              </Text>
            </View>
            <Pressable 
              style={[styles.notificationButton, { backgroundColor: theme.colors.card }]}
              android_ripple={{ color: 'rgba(99, 102, 241, 0.1)', borderless: true }}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
            </Pressable>
          </View>

          {/* Wallet Info Card */}
          {walletInfo && (
            <View style={[styles.walletCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.walletHeader}>
                <View style={[styles.walletIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="wallet" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletTitle, { color: theme.colors.text }]}>Connected Wallet</Text>
                  <Text style={[styles.walletAddress, { color: theme.colors.muted }]}>
                    {walletInfo.publicKey.toString().substring(0, 8)}...{walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8)}
                  </Text>
                </View>
              </View>
              <View style={styles.walletBalance}>
                <Text style={[styles.balanceLabel, { color: theme.colors.muted }]}>Balance</Text>
                <Text style={[styles.balanceAmount, { color: theme.colors.primary }]}>
                  {walletInfo.balance.toFixed(4)} SOL
                </Text>
              </View>
              <Pressable 
                style={[styles.airdropButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleRequestAirdrop}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: false }}
              >
                <Ionicons name="add-circle-outline" size={16} color="#000" />
                <Text style={[styles.airdropText, { color: '#000' }]}>Request Airdrop</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Market Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Token-2022 Market</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.marketGrid}>
            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="trending-up" size={20} color={theme.colors.success} />
                <Text style={[styles.marketCardTitle, { color: theme.colors.text }]}>Total Volume</Text>
              </View>
              <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>$2.4B</Text>
              <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+12.5%</Text>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="link" size={20} color={theme.colors.primary} />
                <Text style={[styles.marketCardTitle, { color: theme.colors.text }]}>Transfer Hooks</Text>
              </View>
              <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>892</Text>
              <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+23.1%</Text>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="eye-off" size={20} color={theme.colors.accent} />
                <Text style={[styles.marketCardTitle, { color: theme.colors.text }]}>Confidential</Text>
              </View>
              <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>156</Text>
              <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+15.3%</Text>
            </View>

            <View style={[styles.marketCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.marketCardHeader}>
                <Ionicons name="swap-horizontal" size={20} color={theme.colors.warning} />
                <Text style={[styles.marketCardTitle, { color: theme.colors.text }]}>Active Pairs</Text>
              </View>
              <Text style={[styles.marketCardValue, { color: theme.colors.text }]}>1,247</Text>
              <Text style={[styles.marketCardChange, { color: theme.colors.success }]}>+8.2%</Text>
            </View>
          </View>
        </View>

        {/* Recent Token-2022 Launches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Token-2022 Launches</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>View All</Text>
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
                        <Text style={[styles.tokenSymbol, { color: theme.colors.primary }]}>{launch.symbol}</Text>
                      </View>
                      <View style={styles.launchInfo}>
                        <Text style={[styles.launchName, { color: theme.colors.text }]}>{launch.name}</Text>
                        <Text style={[styles.launchDescription, { color: theme.colors.muted }]}>{launch.description}</Text>
                        <Text style={[styles.launchDate, { color: theme.colors.muted }]}>Launched {launch.launchDate}</Text>
                      </View>
                    </View>
                    <View style={styles.launchRight}>
                      <Text style={[styles.launchVolume, { color: theme.colors.text }]}>{launch.volume24h}</Text>
                      <Text style={[
                        styles.launchChange, 
                        { color: launch.isPositive ? theme.colors.success : theme.colors.error }
                      ]}>
                        {launch.priceChange}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.launchFeatures}>
                    {launch.transferHookEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                        <Ionicons name="link" size={12} color={theme.colors.primary} />
                        <Text style={[styles.featureText, { color: theme.colors.primary }]}>Transfer Hooks</Text>
                      </View>
                    )}
                    {launch.confidentialTransferEnabled && (
                      <View style={[styles.featureBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Ionicons name="eye-off" size={12} color={theme.colors.success} />
                        <Text style={[styles.featureText, { color: theme.colors.success }]}>Confidential</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Token-2022 Features</Text>
          
          <View style={styles.featuresGrid}>
            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="link" size={24} color={theme.colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Transfer Hooks</Text>
              <Text style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Custom transfer logic with pre-transfer simulation</Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="eye-off" size={24} color={theme.colors.success} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Confidential Transfers</Text>
              <Text style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Private, encrypted token transfers</Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>Safe Hook Approval</Text>
              <Text style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Permissionless but safe hook approval system</Text>
            </View>

            <View style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.error} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>AMM Integration</Text>
              <Text style={[styles.featureSubtitle, { color: theme.colors.muted }]}>Direct integration with existing AMM protocols</Text>
            </View>
          </View>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
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
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  airdropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  airdropText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  marketCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  marketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  marketCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  marketCardChange: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  launchesList: {
    gap: 12,
  },
  launchItem: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  launchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  launchInfo: {
    flex: 1,
  },
  launchName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
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
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  launchChange: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  featureSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
