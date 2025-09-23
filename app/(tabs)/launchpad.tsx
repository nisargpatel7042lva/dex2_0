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
  const { 
    walletInfo, 
    walletService,
    createTokenLaunch, 
    createTransferHookToken
  } = useApp();
  
  // Token configuration state
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [decimals, setDecimals] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  
  // Transfer Hook configuration
  const [enableTransferHook, setEnableTransferHook] = useState(false);
  const [transferHookProgramId, setTransferHookProgramId] = useState('');
  const [transferHookAuthority, setTransferHookAuthority] = useState('');
  const [transferHookData, setTransferHookData] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [presaleInfo, setPresaleInfo] = useState<{
    name: string;
    symbol: string;
    mint: string;
    signature: string;
    description: string;
    decimals: number;
    totalSupply: number;
    website?: string;
    twitter?: string;
    telegram?: string;
    hasTransferHook: boolean;
    transferHookProgramId?: string;
  } | null>(null);



  const handleLaunchToken = async () => {
    if (!tokenName.trim() || !tokenSymbol.trim() || !tokenDescription.trim()) {
      setError('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    if (parseInt(totalSupply) <= 0 || parseInt(decimals) < 0 || parseInt(decimals) > 9) {
      setError('Please enter valid supply and decimals');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if wallet is connected
      if (!walletInfo) {
        setError('Please connect your wallet first');
        setShowErrorModal(true);
        return;
      }

      // Check wallet balance
      if (walletInfo.balance < 0.01) {
        setError('Insufficient SOL balance. You need at least 0.01 SOL to create tokens. Please request an airdrop first.');
        setShowErrorModal(true);
        return;
      }

      // Debug: Test wallet connection status
      console.log('🔍 Wallet connection debug info:', {
        walletInfo: walletInfo ? {
          publicKey: walletInfo.publicKey.toString(),
          balance: walletInfo.balance,
          isConnected: walletInfo.isConnected
        } : null,
        walletService: walletService ? {
          isConnected: walletService.isWalletConnected(),
          publicKey: walletService.getPublicKey()?.toString(),
          authToken: walletService.getAuthToken() ? 'Present' : 'Missing'
        } : null
      });

      // Prepare Transfer Hook configuration
      let transferHookConfig = undefined;
      if (enableTransferHook && transferHookProgramId && transferHookAuthority) {
        transferHookConfig = {
          programId: new PublicKey(transferHookProgramId),
          authority: new PublicKey(transferHookAuthority),
          data: transferHookData ? Buffer.from(transferHookData, 'hex') : undefined,
        };
      }

      console.log('Launching token with config:', {
        name: tokenName,
        symbol: tokenSymbol,
        description: tokenDescription,
        decimals: parseInt(decimals),
        totalSupply: parseInt(totalSupply),
        enableTransferHook,
        transferHookConfig,
      });

      let result;
      if (enableTransferHook && transferHookConfig) {
        result = await createTransferHookToken({
          name: tokenName,
          symbol: tokenSymbol,
          description: tokenDescription,
          decimals: parseInt(decimals),
          totalSupply: parseInt(totalSupply),
          hookFee: 0.1, // Default hook fee
        });
      } else {
        // Create regular token
        result = await createTokenLaunch({
          name: tokenName,
          symbol: tokenSymbol,
          description: tokenDescription,
          decimals: parseInt(decimals),
          totalSupply: parseInt(totalSupply),
          website: website || undefined,
          twitter: twitter || undefined,
          telegram: telegram || undefined,
        });
      }

      console.log('Token launch result:', result);

      // Show success modal
      setShowSuccessModal(true);

      // Generate mock data for display
      const mockMint = result.mint?.toString() || 'MockMintAddress123456789';
      const mockSignature = result.signature || 'MockSignature123456789';

      setPresaleInfo({
        mint: mockMint,
        signature: mockSignature,
        name: tokenName,
        symbol: tokenSymbol,
        description: tokenDescription,
        decimals: parseInt(decimals),
        totalSupply: parseInt(totalSupply),
        website: website || undefined,
        twitter: twitter || undefined,
        telegram: telegram || undefined,
        hasTransferHook: enableTransferHook,
        transferHookProgramId: transferHookProgramId || undefined,
      });


      
      // Clear form
      setTokenName('');
      setTokenSymbol('');
      setTokenDescription('');
      setDecimals('6');
      setTotalSupply('1000000');
      setWebsite('');
      setTwitter('');
      setTelegram('');
      setEnableTransferHook(false);
      setTransferHookProgramId('');
      setTransferHookAuthority('');
      setTransferHookData('');
    } catch (err) {
      console.error('Error launching token:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied!', 'Address copied to clipboard');
    } catch {
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
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                value={decimals}
                onChangeText={setDecimals}
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
                value={totalSupply}
                onChangeText={setTotalSupply}
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
              value={website}
              onChangeText={setWebsite}
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
                value={twitter}
                onChangeText={setTwitter}
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
                value={telegram}
                onChangeText={setTelegram}
              />
            </View>
          </View>

          {/* Transfer Hook Configuration */}
          <View style={styles.transferHookSection}>
            <TouchableOpacity
              style={styles.transferHookToggle}
              onPress={() => setEnableTransferHook(!enableTransferHook)}
            >
              <View style={[styles.checkbox, { 
                backgroundColor: enableTransferHook ? theme.colors.primary : 'transparent',
                borderColor: theme.colors.border 
              }]}>
                {enableTransferHook && (
                  <Ionicons name="checkmark" size={16} color="#000000" />
                )}
              </View>
              <View style={styles.transferHookInfo}>
                <AppText style={[styles.transferHookTitle, { color: theme.colors.text }]}>
                  Enable Transfer Hook
                </AppText>
                <AppText style={[styles.transferHookDescription, { color: theme.colors.secondary }]}>
                  Add custom logic to token transfers (advanced)
                </AppText>
              </View>
            </TouchableOpacity>

            {enableTransferHook && (
              <View style={styles.transferHookConfig}>
                <View style={styles.inputGroup}>
                  <AppText style={[styles.label, { color: theme.colors.text }]}>Hook Program ID</AppText>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      color: theme.colors.text, 
                      borderColor: theme.colors.border 
                    }]}
                    placeholder="Enter program ID"
                    placeholderTextColor={theme.colors.secondary}
                    value={transferHookProgramId}
                    onChangeText={setTransferHookProgramId}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={[styles.label, { color: theme.colors.text }]}>Hook Authority</AppText>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      color: theme.colors.text, 
                      borderColor: theme.colors.border 
                    }]}
                    placeholder="Enter authority address"
                    placeholderTextColor={theme.colors.secondary}
                    value={transferHookAuthority}
                    onChangeText={setTransferHookAuthority}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={[styles.label, { color: theme.colors.text }]}>Hook Data (Optional)</AppText>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      color: theme.colors.text, 
                      borderColor: theme.colors.border 
                    }]}
                    placeholder="Enter hex data"
                    placeholderTextColor={theme.colors.secondary}
                    value={transferHookData}
                    onChangeText={setTransferHookData}
                  />
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleLaunchToken}
            disabled={loading}
          >
            <AppText style={[styles.createButtonText, { color: '#000000' }]}>
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

              {presaleInfo && (
                <View style={styles.tokenDetails}>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Token Name:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]}>{presaleInfo.name}</AppText>
                  </View>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Token Symbol:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]}>{presaleInfo.symbol}</AppText>
                  </View>
                  <View style={styles.tokenDetailRow}>
                    <AppText style={[styles.detailLabel, { color: theme.colors.muted }]}>Mint Address:</AppText>
                    <AppText style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={1}>
                      {presaleInfo.mint.slice(0, 8)}...{presaleInfo.mint.slice(-8)}
                    </AppText>
                  </View>
                </View>
              )}

              <View style={styles.modalActions}>
                {presaleInfo && (
                  <>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border }]}
                      onPress={() => copyToClipboard(presaleInfo.mint)}
                    >
                      <Ionicons name="copy-outline" size={18} color={theme.colors.text} />
                      <AppText style={[styles.modalButtonText, { color: theme.colors.text }]}>Copy Mint</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: theme.colors.accent, borderColor: theme.colors.border }]}
                      onPress={() => viewOnExplorer(presaleInfo.signature)}
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
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60, // Add proper top padding
    paddingBottom: 150, // Increased bottom padding to clear the floating navbar
  },
  header: {
    marginBottom: 24,
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
  formContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 26, // Added proper line height
    marginBottom: 20,
    paddingVertical: 2, // Added padding to prevent cutting
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
    marginBottom: 20, // Add extra bottom margin for the button
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
  transferHookSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  transferHookToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transferHookInfo: {
    flex: 1,
  },
  transferHookTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 4,
  },
  transferHookDescription: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  transferHookConfig: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}); 