import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Clipboard,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ReceiveScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, generateAddressQRCode } = useApp();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const walletAddress = walletInfo?.publicKey.toString() || '';

  // Generate QR code when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      generateQRCode();
    }
  }, [walletAddress]);

  const generateQRCode = async () => {
    if (!walletAddress) return;
    
    try {
      const qrCode = await generateAddressQRCode(walletAddress);
      setQrCodeDataUrl(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to a simple text representation
      setQrCodeDataUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMjgiIHk9IjEyOCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJibGFjayIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UVJDb2RlPC90ZXh0Pgo8L3N2Zz4K');
    }
  };

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
            {qrCodeDataUrl ? (
              <Image 
                source={{ uri: qrCodeDataUrl }} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.qrCode, { backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="qr-code-outline" size={64} color={theme.colors.muted} />
                <AppText style={[styles.qrLoadingText, { color: theme.colors.muted }]}>
                  Generating QR Code...
                </AppText>
              </View>
            )}
          </View>
          
          <AppText style={[styles.qrInstructions, { color: theme.colors.muted }]}>
            Scan this QR code to send SOL or tokens to your wallet
          </AppText>
        </View>

        {/* Address Section */}
        <View style={[styles.addressCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Wallet Address
          </AppText>
          
          <View style={[styles.addressContainer, { backgroundColor: theme.colors.background }]}>
            <AppText style={[styles.addressText, { color: theme.colors.text }]} numberOfLines={2}>
              {walletAddress}
            </AppText>
          </View>
          
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: copied ? theme.colors.success : theme.colors.primary }]}
            onPress={copyToClipboard}
          >
            <Ionicons 
              name={copied ? "checkmark" : "copy-outline"} 
              size={20} 
              color={theme.colors.background} 
            />
            <AppText style={[styles.copyButtonText, { color: theme.colors.background }]}>
              {copied ? 'Copied!' : 'Copy Address'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Instructions Section */}
        <View style={[styles.instructionsCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            How to Receive
          </AppText>
          
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="qr-code" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.instructionContent}>
              <AppText style={[styles.instructionTitle, { color: theme.colors.text }]}>
                Share QR Code
              </AppText>
              <AppText style={[styles.instructionText, { color: theme.colors.muted }]}>
                Let others scan your QR code to send you SOL or tokens
              </AppText>
            </View>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="copy" size={20} color={theme.colors.success} />
            </View>
            <View style={styles.instructionContent}>
              <AppText style={[styles.instructionTitle, { color: theme.colors.text }]}>
                Copy Address
              </AppText>
              <AppText style={[styles.instructionText, { color: theme.colors.muted }]}>
                Share your wallet address with others manually
              </AppText>
            </View>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={[styles.instructionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.warning} />
            </View>
            <View style={styles.instructionContent}>
              <AppText style={[styles.instructionTitle, { color: theme.colors.text }]}>
                Secure & Fast
              </AppText>
              <AppText style={[styles.instructionText, { color: theme.colors.muted }]}>
                Transactions are processed instantly on Solana blockchain
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  shareButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noWalletText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-SemiBold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  connectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  qrCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  qrLoadingText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 8,
  },
  qrInstructions: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  addressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  addressContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    lineHeight: 20,
  },
});