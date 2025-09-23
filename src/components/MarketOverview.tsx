import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MarketOverview: React.FC = () => {
  const marketData = {
    totalMarketCap: 45000000000,
    totalVolume24h: 2500000000,
    activeTokens: 1250,
    totalDEXs: 15,
  };

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
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Overview</Text>
      
      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, styles.marketCapIcon]}>
              <Ionicons name="trending-up" size={20} color="#6366f1" />
            </View>
            <Text style={styles.cardTitle}>Total Market Cap</Text>
          </View>
          <Text style={styles.cardValue}>${formatNumber(marketData.totalMarketCap)}</Text>
          <Text style={styles.cardChange}>+2.5% today</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, styles.volumeIcon]}>
              <Ionicons name="bar-chart" size={20} color="#10b981" />
            </View>
            <Text style={styles.cardTitle}>24h Volume</Text>
          </View>
          <Text style={styles.cardValue}>${formatNumber(marketData.totalVolume24h)}</Text>
          <Text style={styles.cardChange}>+8.2% today</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, styles.tokensIcon]}>
              <Ionicons name="apps" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.cardTitle}>Active Tokens</Text>
          </View>
          <Text style={styles.cardValue}>{formatNumber(marketData.activeTokens)}</Text>
          <Text style={styles.cardChange}>+12 new today</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, styles.dexIcon]}>
              <Ionicons name="swap-horizontal" size={20} color="#ef4444" />
            </View>
            <Text style={styles.cardTitle}>DEXs</Text>
          </View>
          <Text style={styles.cardValue}>{marketData.totalDEXs}</Text>
          <Text style={styles.cardChange}>All chains</Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Top Gainers</Text>
          <Text style={styles.summaryValue}>DEX2 +15.2%</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Top Losers</Text>
          <Text style={styles.summaryValue}>TOKEN -8.7%</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Most Active</Text>
          <Text style={styles.summaryValue}>Raydium</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  marketCapIcon: {
    backgroundColor: '#eef2ff',
  },
  volumeIcon: {
    backgroundColor: '#f0fdf4',
  },
  tokensIcon: {
    backgroundColor: '#fffbeb',
  },
  dexIcon: {
    backgroundColor: '#fef2f2',
  },
  cardTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardChange: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default MarketOverview; 