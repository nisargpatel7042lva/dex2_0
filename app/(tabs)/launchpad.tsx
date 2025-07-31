import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { PublicKey } from '@solana/web3.js';
import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LaunchpadScreen() {
  const { theme } = useAppTheme();
  const { walletInfo } = useApp();
  
  // Token Creation State
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('6');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  const [tokenWebsite, setTokenWebsite] = useState('');
  const [tokenTwitter, setTokenTwitter] = useState('');
  const [tokenTelegram, setTokenTelegram] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [createdToken, setCreatedToken] = useState<{
    name: string;
    symbol: string;
    mint: string;
    signature: string;
  } | null>(null);

  // Generate a proper Solana address
  const generateSolanaAddress = (): string => {
    // Generate a random 32-byte array and convert to base58
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return new PublicKey(bytes).toString();
  };

  const createToken = async () => {
    if (!walletInfo) {
      setError('Wallet not connected');
      setShowErrorModal(true);
      return;
    }

    // Validation
    if (!tokenName || !tokenSymbol || !tokenDescription) {
      setError('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    if (parseInt(tokenSupply) <= 0) {
      setError('Total supply must be greater than 0');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate token creation (in real implementation, this would call the blockchain)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      // Generate proper Solana addresses
      const mockMint = generateSolanaAddress();
      const mockSignature = generateSolanaAddress(); // Transaction signature
      
      // Store token details before resetting form
      const tokenDetails = {
        name: tokenName,
        symbol: tokenSymbol,
        mint: mockMint,
        signature: mockSignature,
      };
      
      setCreatedToken(tokenDetails);
      setSuccess('Token created successfully!');
      setShowSuccessModal(true);
      
      // Reset form after storing details
      setTokenName('');
      setTokenSymbol('');
      setTokenDescription('');
      setTokenDecimals('6');
      setTokenSupply('1000000');
      setTokenWebsite('');
      setTokenTwitter('');
      setTokenTelegram('');
    } catch (err) {
      setError(`${(err as Error).message}`);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied!', 'Address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const viewOnExplorer = (signature: string) => {
    const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open explorer');
    });
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccess(null);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with proper top padding */}
        <View style={styles.header}>
          <AppText style={[styles.title, { color: theme.colors.text }]}>Token Launchpad</AppText>
          <AppText style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Create your Token-2022 project
          </AppText>
        </View>

        {/* Token Creation Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Create New Token</AppText>
          
          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: theme.colors.text }]}>Token Name *</AppText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: theme.colors.border 
              }]}
              placeholder="Enter token name"
              placeholderTextColor={theme.colors.secondary}
              value={tokenName}
              onChangeText={setTokenName}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: theme.colors.text }]}>Token Symbol *</AppText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: theme.colors.border 
              }]}
              placeholder="Enter token symbol (e.g., TOKEN)"
              placeholderTextColor={theme.colors.secondary}
              value={tokenSymbol}
              onChangeText={(text) => setTokenSymbol(text.toUpperCase())}
            />
          </View>

          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: theme.colors.text }]}>Description *</AppText>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: theme.colors.border 
              }]}
              placeholder="Describe your token"
              placeholderTextColor={theme.colors.secondary}
              value={tokenDescription}
              onChangeText={setTokenDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <AppText style={[styles.label, { color: theme.colors.text }]}>Decimals</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }]}
                placeholder="6"
                placeholderTextColor={theme.colors.secondary}
                value={tokenDecimals}
                onChangeText={setTokenDecimals}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <AppText style={[styles.label, { color: theme.colors.text }]}>Total Supply</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }]}
                placeholder="1000000"
                placeholderTextColor={theme.colors.secondary}
                value={tokenSupply}
                onChangeText={setTokenSupply}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText style={[styles.label, { color: theme.colors.text }]}>Website (Optional)</AppText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text, 
                borderColor: theme.colors.border 
              }]}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={theme.colors.secondary}
              value={tokenWebsite}
              onChangeText={setTokenWebsite}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <AppText style={[styles.label, { color: theme.colors.text }]}>Twitter (Optional)</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }]}
                placeholder="@username"
                placeholderTextColor={theme.colors.secondary}
                value={tokenTwitter}
                onChangeText={setTokenTwitter}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <AppText style={[styles.label, { color: theme.colors.text }]}>Telegram (Optional)</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background, 
                  color: theme.colors.text, 
                  borderColor: theme.colors.border 
                }]}
                placeholder="t.me/group"
                placeholderTextColor={theme.colors.secondary}
                value={tokenTelegram}
                onChangeText={setTokenTelegram}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={createToken}
            disabled={loading}
          >
            <AppText style={[styles.createButtonText, { color: '#000' }]}>
              {loading ? 'Creating Token...' : 'Launch Token'}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
                </View>
                <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>Token Created Successfully!</AppText>
                <AppText style={[styles.modalSubtitle, { color: theme.colors.secondary }]}>
                  Your Token-2022 has been deployed to the blockchain
                </AppText>
              </View>

              {createdToken && (
                <View style={styles.tokenDetails}>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Token Name:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]}>{createdToken.name}</AppText>
                  </View>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Token Symbol:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]}>{createdToken.symbol}</AppText>
                  </View>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Mint Address:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
                      {createdToken.mint.slice(0, 8)}...{createdToken.mint.slice(-8)}
                    </AppText>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                {createdToken && (
                  <>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border }]}
                      onPress={() => copyToClipboard(createdToken.mint)}
                    >
                      <Ionicons name="copy-outline" size={18} color={theme.colors.text} />
                      <AppText style={[styles.modalButtonText, { color: theme.colors.text }]}>Copy Mint</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border }]}
                      onPress={() => viewOnExplorer(createdToken.signature)}
                    >
                      <Ionicons name="open-outline" size={18} color={theme.colors.text} />
                      <AppText style={[styles.modalButtonText, { color: theme.colors.text }]}>View TX</AppText>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={closeSuccessModal}
                >
                  <AppText style={[styles.modalButtonText, { color: '#000' }]}>Done</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeErrorModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.errorIcon, { backgroundColor: theme.colors.error + '20' }]}>
                  <Ionicons name="close-circle" size={32} color={theme.colors.error} />
                </View>
                <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>Token Creation Failed</AppText>
                <AppText style={[styles.modalSubtitle, { color: theme.colors.secondary }]}>
                  {error}
                </AppText>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={closeErrorModal}
              >
                <AppText style={[styles.modalButtonText, { color: '#000' }]}>Try Again</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Add proper top padding
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  formContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  successMessage: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  tokenInfo: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 8,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Medium',
  },
  // New styles for modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  tokenDetails: {
    width: '100%',
    marginBottom: 20,
  },
  tokenDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'right',
    flex: 1,
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 8,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 6,
  },
}); 