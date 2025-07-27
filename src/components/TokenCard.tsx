import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TokenMarketData } from '../services/DEXService';

interface TokenCardProps {
  token: TokenMarketData;
  onPress?: () => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, onPress }) => {
  const isPositive = token.priceChangePercent24h >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
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

      <View style={styles.stats}>
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

      <View style={styles.footer}>
        <View style={styles.dexInfo}>
          <Text style={styles.dexText}>{token.dexId.toUpperCase()}</Text>
        </View>
        <View style={styles.transactions}>
          <Text style={styles.txLabel}>TXs 24h</Text>
          <Text style={styles.txValue}>
            {token.txns.h24.buys + token.txns.h24.sells}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dexInfo: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dexText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  transactions: {
    alignItems: 'flex-end',
  },
  txLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  txValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default TokenCard; 