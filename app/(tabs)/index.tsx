import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { NotificationButton } from '@/components/NotificationButton';
import { NotificationModal } from '@/components/NotificationModal';
import { useApp } from '@/src/context/AppContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { walletInfo, requestAirdrop } = useApp();
  const { addNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(2);
      
      // Add notification for successful airdrop
      addNotification({
        type: 'airdrop',
        title: 'Airdrop Received!',
        message: 'You have successfully received 2 SOL airdrop to your wallet.',
      });
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
      description: 'Serum with confidential transfers',
      launchDate: '2024-01-12',
      transferHookEnabled: false,
      confidentialTransferEnabled: true,
      volume24h: '$15.3M',
      priceChange: '-1.2%',
      isPositive: false,
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
                <AppText style={[styles.balanceLabel, { color: theme.colors.muted }]}>Balance</AppText>
                <AppText style={[styles.balanceAmount, { color: theme.colors.primary }]}>
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
    marginBottom: 8,
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
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
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
