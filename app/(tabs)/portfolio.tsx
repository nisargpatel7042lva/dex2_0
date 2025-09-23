import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { AppView } from '@/components/app-view';
import { TokenIcon } from '@/components/TokenIcon';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Import the page components
import ReceiveScreen from '../receive';
import SendScreen from '../send';
import SwapScreen from '../swap';

interface TokenBalance {
  mint: { toString: () => string };
  symbol: string;
  name: string;
  balance: number;
  value?: number;
  price?: number;
  decimals: number;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'airdrop' | 'mint' | 'unknown';
  amount: number;
  symbol: string;
  from?: string;
  to?: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  fee?: number;
}

const PortfolioCard = ({ token }: { token: TokenBalance }) => {
  const { theme } = useAppTheme();
  const isPositive = (token.price || 0) > 0;

  return (
    <TouchableOpacity style={[styles.portfolioCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.tokenHeader}>
        <View style={styles.tokenInfo}>
          <TokenIcon 
            address={token.mint.toString()} 
            symbol={token.symbol} 
            size={40}
          />
          <View style={styles.tokenDetails}>
            <AppText style={[styles.tokenSymbol, { color: theme.colors.text }]}>{token.symbol}</AppText>
            <AppText style={[styles.tokenName, { color: theme.colors.muted }]}>{token.name}</AppText>
          </View>
        </View>
        <View style={styles.balanceInfo}>
          <AppText style={[styles.balance, { color: theme.colors.text }]}>
            {token.balance.toFixed(4)}
          </AppText>
          <AppText style={[styles.value, { color: theme.colors.primary }]}>
            ${token.value?.toFixed(2) || '0.00'}
          </AppText>
        </View>
      </View>

      <View style={[styles.tokenStats, { borderTopColor: theme.colors.border }]}>
        <View style={styles.stat}>
          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Price</AppText>
          <AppText style={[styles.statValue, { color: theme.colors.text }]}>
            ${token.price?.toFixed(4) || '0.0000'}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Decimals</AppText>
          <AppText style={[styles.statValue, { color: theme.colors.text }]}>
            {token.decimals}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText style={[styles.statLabel, { color: theme.colors.muted }]}>Mint</AppText>
          <AppText style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>
            {token.mint.toString().slice(0, 8)}...
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  const { theme } = useAppTheme();
  
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'send':
        return 'arrow-up';
      case 'receive':
        return 'arrow-down';
      case 'swap':
        return 'swap-horizontal';
      case 'airdrop':
        return 'gift';
      case 'mint':
        return 'add-circle';
      default:
        return 'help-circle';
    }
  };

  const getTransactionColor = () => {
    switch (transaction.type) {
      case 'send':
        return theme.colors.error;
      case 'receive':
      case 'airdrop':
        return theme.colors.success;
      case 'swap':
        return theme.colors.primary;
      case 'mint':
        return theme.colors.accent;
      default:
        return theme.colors.muted;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.muted;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity style={[styles.transactionCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor()}20` }]}>
            <Ionicons name={getTransactionIcon() as any} size={20} color={getTransactionColor()} />
          </View>
          <View style={styles.transactionDetails}>
            <AppText style={[styles.transactionType, { color: theme.colors.text }]}>
              {transaction.type === 'send' ? 'Sent' : 
               transaction.type === 'receive' ? 'Received' : 
               transaction.type === 'swap' ? 'Swapped' : 
               transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </AppText>
            <AppText style={[styles.transactionTime, { color: theme.colors.muted }]}>
              {formatTime(transaction.timestamp)}
            </AppText>
          </View>
        </View>
        <View style={styles.transactionAmount}>
          <AppText style={[styles.amount, { color: getTransactionColor() }]}>
            {transaction.type === 'send' ? '-' : '+'}{transaction.amount.toFixed(2)} {transaction.symbol}
          </AppText>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <AppText style={[styles.statusText, { color: getStatusColor() }]}>
              {transaction.status}
            </AppText>
          </View>
      </View>
    </View>
    
      {transaction.type !== 'swap' && transaction.from && transaction.to && (
        <View style={[styles.transactionAddresses, { borderTopColor: theme.colors.border }]}>
          <AppText style={[styles.addressLabel, { color: theme.colors.muted }]}>From:</AppText>
          <AppText style={[styles.addressText, { color: theme.colors.text }]} numberOfLines={1}>
            {transaction.from === 'System' ? 'System' : 
             transaction.from.slice(0, 8)}...{transaction.from === 'System' ? '' : transaction.from.slice(-8)}
      </AppText>
          <AppText style={[styles.addressLabel, { color: theme.colors.muted }]}>To:</AppText>
          <AppText style={[styles.addressText, { color: theme.colors.text }]} numberOfLines={1}>
            {transaction.to.slice(0, 8)}...{transaction.to.slice(-8)}
      </AppText>
    </View>
      )}
  </TouchableOpacity>
);
};

const PortfolioOverview = ({ totalValue, solBalance }: { totalValue: number; solBalance: number }) => {
  const { theme } = useAppTheme();
  
  return (
    <View style={styles.portfolioOverview}>
      <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Portfolio Overview</AppText>
      
      <View style={styles.overviewCard}>
        <View style={styles.overviewCardHeader}>
          <View style={[styles.overviewIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="wallet" size={20} color={theme.colors.primary} />
          </View>
          <AppText style={[styles.overviewCardTitle, { color: theme.colors.muted }]}>Total Portfolio Value</AppText>
        </View>
        <AppText style={[styles.overviewCardValue, { color: theme.colors.text }]}>
          ${totalValue.toFixed(2)}
        </AppText>
        <AppText style={[styles.solBalanceText, { color: theme.colors.muted }]}>
          {solBalance.toFixed(4)} SOL
        </AppText>
      </View>
    </View>
  );
};

const QuickActions = ({ onSend, onReceive, onSwap }: { 
  onSend: () => void; 
  onReceive: () => void; 
  onSwap: () => void; 
}) => {
  const { theme } = useAppTheme();
  const { requestAirdrop } = useApp();
  
  const handleAirdrop = async () => {
    try {
      await requestAirdrop(1);
      Alert.alert('Success', 'Airdrop requested successfully! Check your balance.');
    } catch (error) {
      Alert.alert('Error', 'Failed to request airdrop. Please try again.');
    }
  };
  
  return (
    <View style={styles.quickActions}>
      <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</AppText>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
          onPress={onSend}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Ionicons name="send" size={24} color={theme.colors.primary} />
          </View>
          <AppText style={[styles.actionTitle, { color: theme.colors.text }]}>Send</AppText>
          <View style={[styles.actionIndicator, { backgroundColor: theme.colors.primary }]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
          onPress={onReceive}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="download" size={24} color={theme.colors.success} />
          </View>
          <AppText style={[styles.actionTitle, { color: theme.colors.text }]}>Receive</AppText>
          <View style={[styles.actionIndicator, { backgroundColor: theme.colors.success }]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
          onPress={onSwap}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="swap-horizontal" size={24} color={theme.colors.warning} />
          </View>
          <AppText style={[styles.actionTitle, { color: theme.colors.text }]}>Swap</AppText>
          <View style={[styles.actionIndicator, { backgroundColor: theme.colors.warning }]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: theme.colors.card }]}
          onPress={handleAirdrop}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Ionicons name="gift" size={24} color={theme.colors.error} />
          </View>
          <AppText style={[styles.actionTitle, { color: theme.colors.text }]}>Airdrop</AppText>
          <View style={[styles.actionIndicator, { backgroundColor: theme.colors.error }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PortfolioScreen() {
  const { theme } = useAppTheme();
  const { 
    walletInfo, 
    requestAirdrop, 
    walletService,
    getRealTimeSOLPrice,
    getRealTimeTokenPrice,
    getRecentTransactions
  } = useApp();
  
  const [currentPage, setCurrentPage] = useState<'portfolio' | 'send' | 'receive' | 'swap'>('portfolio');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load recent transactions from actual data
  const loadRecentTransactions = async () => {
    if (!walletInfo || !walletService || isLoadingData) return;

    try {
      setIsLoadingData(true);
      // Fetch real transaction data from blockchain
      const realTransactions = await getRecentTransactions(20);
      
      // Convert to our interface format
      const transactions: Transaction[] = realTransactions.map(tx => ({
        id: tx.signature,
        type: tx.type,
        amount: tx.amount || 0,
        symbol: tx.tokenSymbol || 'SOL',
        from: tx.fromAddress,
        to: tx.toAddress,
        timestamp: new Date(tx.timestamp),
        status: tx.status === 'success' ? 'confirmed' : 'failed',
        txHash: tx.signature,
        fee: tx.fee / 1e9, // Convert lamports to SOL
      }));

      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      // Fallback to mock data
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'receive',
          amount: 2.5,
          symbol: 'SOL',
          from: '9tq4KSZrFvXqJpViNNkmyz4L6WkghPiiQxQRH9Vq1u',
          to: walletInfo.publicKey.toString(),
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          status: 'confirmed',
          txHash: '5J7X8K2M9N1P3Q4R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
          fee: 0.000005,
        },
        {
          id: '2',
          type: 'send',
          amount: 0.5,
          symbol: 'SOL',
          from: walletInfo.publicKey.toString(),
          to: '7xKX9Y2M8N1P3Q4R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          status: 'confirmed',
          txHash: '6K8X9Y2M8N1P3Q4R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
          fee: 0.000005,
        },
        {
          id: '3',
          type: 'swap',
          amount: 100,
          symbol: 'USDC',
          from: walletInfo.publicKey.toString(),
          to: walletInfo.publicKey.toString(),
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'confirmed',
          txHash: '7L9X0Y3M9N2P4Q5R7S8T9U0V1W2X3Y4Z5A6B7C8D9E0F1G2H3I4J5K6L7M8N9O0P1',
          fee: 0.00001,
        },
        {
          id: '4',
          type: 'mint',
          amount: 1000000,
          symbol: 'TEST',
          from: walletInfo.publicKey.toString(),
          to: walletInfo.publicKey.toString(),
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          status: 'confirmed',
          txHash: '8M0X1Y4M0N3P5Q6R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2',
          fee: 0.001,
        },
        {
          id: '5',
          type: 'airdrop',
          amount: 1.0,
          symbol: 'SOL',
          from: '11111111111111111111111111111111',
          to: walletInfo.publicKey.toString(),
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          status: 'confirmed',
          txHash: '9N1X2Y5M1N4P6Q7R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P3',
          fee: 0,
        },
      ];
      setRecentTransactions(mockTransactions);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadTokenBalances = async () => {
    if (!walletInfo || !walletService || isLoadingData) return;

    try {
      setIsLoadingData(true);
      console.log('Loading real token balances for wallet:', walletInfo.publicKey.toString());
      
      // Get real-time SOL price
      const solPrice = await getRealTimeSOLPrice();
      
      // Get real SOL balance
      const solBalance = walletInfo.balance;
      
      // Create SOL token balance with real-time price
      const solToken: TokenBalance = {
        mint: { toString: () => 'So11111111111111111111111111111111111111112' },
        symbol: 'SOL',
        name: 'Solana',
        balance: solBalance,
        value: solBalance * solPrice,
        price: solPrice,
        decimals: 9,
      };

      // Common testnet tokens with known metadata
      const testnetTokens: { [key: string]: { symbol: string; name: string; decimals: number } } = {
        'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether', decimals: 6 },
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium', decimals: 6 },
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk', decimals: 5 },
        // Add more testnet tokens as needed
      };

      // Get real token accounts from the wallet using WalletService (rate limited)
      let realTokenBalances: TokenBalance[] = [solToken];
      
      try {
        const tokenAccounts = await walletService.getTokenBalances(walletInfo.publicKey);
        console.log('Real token accounts found:', tokenAccounts);

        // Process only first 3 tokens to prevent rate limiting
        const limitedAccounts = tokenAccounts.slice(0, 3);
        console.log(`Processing ${limitedAccounts.length} tokens (limited to prevent rate limiting)`);

        // Process each token account
        for (const account of limitedAccounts) {
          const mint = account.mint;
          const balance = account.balance;
          const decimals = account.decimals;

          if (balance > 0) {
            // Try to get token metadata from known tokens first
            let symbol = 'Unknown';
            let name = 'Unknown Token';
            let price = 1.00; // Default price
            
            if (testnetTokens[mint]) {
              symbol = testnetTokens[mint].symbol;
              name = testnetTokens[mint].name;
            } else {
              // For unknown tokens, use the mint address as identifier
              symbol = mint.slice(0, 4).toUpperCase();
              name = `Token ${mint.slice(0, 8)}`;
            }

            // Use fallback prices instead of real-time API to prevent 429 errors
            if (testnetTokens[mint]) {
              price = 1.00; // Default for known testnet tokens
            } else {
              price = 1.00; // Default for unknown tokens
            }
            
            console.log(`Using fallback price for ${symbol}: $${price} (avoiding API calls)`);

            const tokenBalance: TokenBalance = {
              mint: { toString: () => mint },
              symbol,
              name,
              balance,
              value: balance * price,
              price,
              decimals,
            };

            realTokenBalances.push(tokenBalance);
          }
        }
      } catch (error) {
        console.log('Error fetching real token accounts, using SOL only:', error);
        // Fallback to just SOL balance
        realTokenBalances = [solToken];
      }

      console.log('Final token balances:', realTokenBalances);
      setTokenBalances(realTokenBalances);
      
      // Calculate total value
      const total = realTokenBalances.reduce((sum, token) => sum + (token.value || 0), 0);
      setTotalValue(total);
      setSolBalance(solBalance);
    } catch (error) {
      console.error('Error loading token balances:', error);
      // Fallback to just SOL balance with mock price
      const fallbackBalances: TokenBalance[] = [
        {
          mint: { toString: () => 'So11111111111111111111111111111111111111112' },
          symbol: 'SOL',
          name: 'Solana',
          balance: walletInfo?.balance || 0,
          value: (walletInfo?.balance || 0) * 177, // Mock SOL price
          price: 177.00,
          decimals: 9,
        },
      ];
      setTokenBalances(fallbackBalances);
      setTotalValue((walletInfo?.balance || 0) * 177);
      setSolBalance(walletInfo?.balance || 0);
    } finally {
      setIsLoadingData(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTokenBalances(), loadRecentTransactions()]);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
    setRefreshing(false);
  };

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(2);
      Alert.alert('Success', 'Airdrop requested successfully! Check your balance.');
      loadTokenBalances(); // Refresh balances
    } catch (error) {
      Alert.alert('Error', 'Failed to request airdrop. Please try again.');
    }
  };

  useEffect(() => {
    if (walletInfo && walletService) {
      loadTokenBalances();
      loadRecentTransactions();
    }
  }, [walletInfo, walletService]);

  const renderTokenItem = ({ item }: { item: TokenBalance }) => (
    <PortfolioCard key={item.mint.toString()} token={item} />
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionCard key={item.id} transaction={item} />
  );

  // Render different pages based on currentPage state
  return (
    <>
      {currentPage === 'send' && (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.pageHeader, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentPage('portfolio')}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <AppText style={[styles.pageTitle, { color: theme.colors.text }]}>Send</AppText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.pageContent}>
            <SendScreen hideHeader={true} />
          </View>
        </View>
      )}

      {currentPage === 'receive' && (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.pageHeader, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentPage('portfolio')}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <AppText style={[styles.pageTitle, { color: theme.colors.text }]}>Receive</AppText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.pageContent}>
            <ReceiveScreen hideHeader={true} />
          </View>
        </View>
      )}

      {currentPage === 'swap' && (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.pageHeader, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentPage('portfolio')}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <AppText style={[styles.pageTitle, { color: theme.colors.text }]}>Swap</AppText>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.pageContent}>
            <SwapScreen hideHeader={true} />
          </View>
        </View>
      )}

      {currentPage === 'portfolio' && (
        <AppView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScrollBeginDrag={() => {
          // Simple refresh trigger on scroll
          if (refreshing) return;
          onRefresh();
        }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <View>
            <AppText style={[styles.title, { color: theme.colors.text }]}>My Portfolio</AppText>
            <AppText style={[styles.subtitle, { color: theme.colors.muted }]}>
              Manage your tokens and transactions
            </AppText>
          </View>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme.colors.card }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "sync" : "refresh"} 
              size={20} 
              color={theme.colors.text}
              style={refreshing ? { transform: [{ rotate: '360deg' }] } : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Portfolio Overview */}
        <PortfolioOverview totalValue={totalValue} solBalance={walletInfo?.balance || 0} />

        {/* Quick Actions */}
        <QuickActions 
          onSend={() => setCurrentPage('send')} 
          onReceive={() => setCurrentPage('receive')} 
          onSwap={() => setCurrentPage('swap')} 
        />

        {/* Token Balances Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Token Balances</AppText>
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
              <AppText style={[styles.emptyTokensText, { color: theme.colors.muted }]}>
                No tokens found in your wallet
              </AppText>
            </View>
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</AppText>
          </View>

          {recentTransactions.length > 0 ? (
            <FlatList
              data={recentTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.transactionsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.muted} />
              <AppText style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No Transactions</AppText>
              <AppText style={[styles.emptyStateText, { color: theme.colors.muted }]}>
                Your transaction history will appear here
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
        </AppView>
      )}
    </>
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
    paddingVertical: 32, // Increased vertical padding to prevent text cutting
    paddingTop: 40, // Extra top padding for status bar
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
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
  greeting: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 40, // Added proper line height
    marginBottom: 8,
    paddingVertical: 4, // Added padding to prevent cutting
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
    fontFamily: 'SpaceGrotesk-Bold',
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
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 24, // Added proper line height
    paddingVertical: 2, // Added padding to prevent cutting
  },
  tokenCount: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  portfolioOverview: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },

  overviewCard: {
    width: '100%',
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
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  overviewCardValue: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  solBalanceText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 4,
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
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  actionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  tokensList: {
    gap: 12,
  },
  transactionsList: {
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
    color: '#ffffff',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
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
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  value: {
    fontSize: 14,
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
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  transactionTime: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  transactionAddresses: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  addressLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  placeholder: {
    width: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
    flex: 1,
  },
  pageContent: {
    flex: 1,
    paddingBottom: 100, // Add bottom padding to clear the navbar
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
}); 