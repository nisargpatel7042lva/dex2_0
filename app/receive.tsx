import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReceiveScreen() {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  const [copied, setCopied] = useState(false);

  const walletAddress = walletInfo?.publicKey.toString() || '';

  const copyToClipboard = async () => {
    try {
      Clipboard.setString(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const shareAddress = () => {
    Alert.alert('Share Address', 'Share functionality would be implemented here.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Receive Tokens</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* QR Code Card */}
        <View style={[styles.qrCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.qrContainer}>
            <View style={[styles.qrCode, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="qr-code" size={120} color={theme.colors.primary} />
            </View>
            <Text style={[styles.qrLabel, { color: theme.colors.muted }]}>
              Scan to receive tokens
            </Text>
          </View>
        </View>

        {/* Address Card */}
        <View style={[styles.addressCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.addressTitle, { color: theme.colors.text }]}>
            Your Wallet Address
          </Text>
          
          <View style={[styles.addressContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.addressText, { color: theme.colors.text }]}>
              {walletAddress}
            </Text>
          </View>

          <View style={styles.addressActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}
              onPress={shareAddress}
            >
              <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions Card */}
        <View style={[styles.instructionsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.instructionsTitle, { color: theme.colors.text }]}>
            How to Receive Tokens
          </Text>
          
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="qr-code" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                Share your QR code or wallet address with the sender
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            </View>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                Wait for the transaction to be confirmed on the blockchain
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Ionicons name="wallet" size={16} color={theme.colors.warning} />
            </View>
            <View style={styles.instructionContent}>
              <Text style={[styles.instructionText, { color: theme.colors.text }]}>
                Tokens will appear in your wallet automatically
              </Text>
            </View>
          </View>
        </View>

        {/* Supported Networks */}
        <View style={[styles.networksCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.networksTitle, { color: theme.colors.text }]}>
            Supported Networks
          </Text>
          
          <View style={styles.networkItem}>
            <View style={[styles.networkIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="logo-bitcoin" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.networkInfo}>
              <Text style={[styles.networkName, { color: theme.colors.text }]}>Solana</Text>
              <Text style={[styles.networkDescription, { color: theme.colors.muted }]}>
                Mainnet & Devnet
              </Text>
            </View>
            <View style={[styles.networkStatus, { backgroundColor: theme.colors.success }]}>
              <Text style={[styles.networkStatusText, { color: '#fff' }]}>Active</Text>
            </View>
          </View>

          <View style={styles.networkItem}>
            <View style={[styles.networkIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="cube" size={20} color={theme.colors.success} />
            </View>
            <View style={styles.networkInfo}>
              <Text style={[styles.networkName, { color: theme.colors.text }]}>Token-2022</Text>
              <Text style={[styles.networkDescription, { color: theme.colors.muted }]}>
                Advanced token features
              </Text>
            </View>
            <View style={[styles.networkStatus, { backgroundColor: theme.colors.success }]}>
              <Text style={[styles.networkStatusText, { color: '#fff' }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.error} />
          <View style={styles.securityContent}>
            <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
              Security Notice
            </Text>
            <Text style={[styles.securityText, { color: theme.colors.muted }]}>
              Only send tokens to this address. Never share your private keys or seed phrase with anyone.
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  qrCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  addressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  addressContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  networksCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  networksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  networkDescription: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  networkStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  securityCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  securityContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  securityText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
}); 