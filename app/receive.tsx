import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReceiveScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  const [copied, setCopied] = useState(false);

  const walletAddress = walletInfo?.publicKey.toString() || '';

  const copyToClipboard = async () => {
    try {
      await Clipboard.setString(walletInfo?.publicKey.toString() || '');
      setCopied(true);
      Alert.alert('Copied!', 'Address copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const shareAddress = () => {
    Alert.alert(
      'Share Address',
      'Share your wallet address with others to receive payments',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          // In a real app, this would use the Share API
          Alert.alert('Share', 'Sharing functionality would be implemented here');
        }}
      ]
    );
  };

  if (!walletInfo) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!hideHeader && (
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>Receive</AppText>
            <View style={styles.placeholder} />
          </View>
        )}
        
        <View style={styles.centerContent}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.muted} />
          <AppText style={[styles.noWalletText, { color: theme.colors.text }]}>
            Connect your wallet to receive payments
          </AppText>
          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/sign-in')}
          >
            <AppText style={styles.connectButtonText}>Connect Wallet</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      {!hideHeader && (
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>Receive</AppText>
          <TouchableOpacity onPress={shareAddress} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Code Section */}
        <View style={[styles.qrCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Wallet Address
          </AppText>
          
          <View style={styles.qrContainer}>
            {/* Mock QR Code - In a real app, you'd use a QR code library */}
            <View style={[styles.qrCode, { backgroundColor: '#fff', borderColor: theme.colors.border }]}>
              <View style={styles.qrGrid}>
                {Array.from({ length: 25 }, (_, i) => (
                  <View key={i} style={[styles.qrCell, { backgroundColor: i % 3 === 0 ? '#000' : '#fff' }]} />
                ))}
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: theme.colors.primary }]}
            onPress={copyToClipboard}
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#000" />
            <AppText style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy Address'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Address Display */}
        <View style={[styles.addressCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Wallet Address</AppText>
          
          <View style={[styles.addressContainer, { backgroundColor: theme.colors.background }]}>
            <AppText style={[styles.addressText, { color: theme.colors.text }]} numberOfLines={2}>
              {walletAddress}
            </AppText>
          </View>
          
          <AppText style={[styles.addressNote, { color: theme.colors.muted }]}>
            Share this address to receive SOL and other tokens
          </AppText>
        </View>

        {/* Network Info */}
        <View style={[styles.networkCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Network Information</AppText>
          
          <View style={[styles.networkRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.networkInfo}>
              <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
              <AppText style={[styles.networkLabel, { color: theme.colors.text }]}>Network</AppText>
            </View>
            <AppText style={[styles.networkValue, { color: theme.colors.text }]}>Solana Devnet</AppText>
          </View>
          
          <View style={[styles.networkRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.networkInfo}>
              <Ionicons name="diamond-outline" size={20} color={theme.colors.primary} />
              <AppText style={[styles.networkLabel, { color: theme.colors.text }]}>Token</AppText>
            </View>
            <AppText style={[styles.networkValue, { color: theme.colors.text }]}>SOL</AppText>
          </View>
          
          <View style={styles.networkRow}>
            <View style={styles.networkInfo}>
              <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
              <AppText style={[styles.networkLabel, { color: theme.colors.text }]}>Current Balance</AppText>
            </View>
            <AppText style={[styles.networkValue, { color: theme.colors.text }]}>
              {walletInfo.balance.toFixed(4)} SOL
            </AppText>
          </View>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>How to Receive</AppText>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <AppText style={styles.stepNumberText}>1</AppText>
            </View>
            <View style={styles.stepContent}>
              <AppText style={[styles.stepTitle, { color: theme.colors.text }]}>Share Your Address</AppText>
              <AppText style={[styles.stepDescription, { color: theme.colors.muted }]}>
                Share your wallet address with the sender
              </AppText>
            </View>
          </View>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <AppText style={styles.stepNumberText}>2</AppText>
            </View>
            <View style={styles.stepContent}>
              <AppText style={[styles.stepTitle, { color: theme.colors.text }]}>Wait for Transaction</AppText>
              <AppText style={[styles.stepDescription, { color: theme.colors.muted }]}>
                The sender will initiate the transaction
              </AppText>
            </View>
          </View>
          
          <View style={styles.instructionStep}>
            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
              <AppText style={styles.stepNumberText}>3</AppText>
            </View>
            <View style={styles.stepContent}>
              <AppText style={[styles.stepTitle, { color: theme.colors.text }]}>Receive Funds</AppText>
              <AppText style={[styles.stepDescription, { color: theme.colors.muted }]}>
                Funds will appear in your wallet once confirmed
              </AppText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  shareButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noWalletText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    textAlign: 'center',
    marginVertical: 20,
  },
  connectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  qrCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrContainer: {
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 168,
    height: 168,
  },
  qrCell: {
    width: 6.72,
    height: 6.72,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 8,
  },
  addressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  addressNote: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  networkCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkLabel: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginLeft: 12,
  },
  networkValue: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    lineHeight: 20,
  },
});