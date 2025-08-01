import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TransferHookLaunchpadScreen() {
  const { theme } = useAppTheme();
  const { walletInfo, createTransferHookToken, createTransferHookPool } = useApp();
  
  // Form state
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');
  const [decimals, setDecimals] = useState('9');
  const [totalSupply, setTotalSupply] = useState('');
  const [hookFee, setHookFee] = useState('0.1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleCreateTransferHookToken = async () => {
    if (!tokenName || !tokenSymbol || !tokenDescription || !decimals || !totalSupply) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create Token-2022 with Transfer Hook
      const mint = await createTransferHookToken({
        name: tokenName,
        symbol: tokenSymbol,
        description: tokenDescription,
        decimals: parseInt(decimals),
        totalSupply: parseInt(totalSupply),
        hookFee: parseFloat(hookFee),
      });

      setSuccessMessage(
        `Transfer Hook Token created successfully!\n\n` +
        `Name: ${tokenName}\n` +
        `Symbol: ${tokenSymbol}\n` +
        `Hook Fee: ${hookFee}%\n` +
        `Mint Address: ${mint.mint.toString().slice(0, 8)}...${mint.mint.toString().slice(-8)}\n\n` +
        `Transaction: ${mint.signature.slice(0, 8)}...${mint.signature.slice(-8)}\n\n` +
        `View on Solana Explorer: https://explorer.solana.com/tx/${mint.signature}?cluster=testnet`
      );
      setShowSuccessModal(true);

      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setTokenDescription('');
      setDecimals('9');
      setTotalSupply('');
      setHookFee('0.1');
    } catch (err) {
      console.error('Error creating transfer hook token:', err);
      setError(`Failed to create transfer hook token: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransferHookPool = async () => {
    if (!tokenName || !tokenSymbol) {
      Alert.alert('Error', 'Please create a token first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create AMM pool for Transfer Hook token
      const pool = await createTransferHookPool({
        tokenAMint: 'So11111111111111111111111111111111111111112', // SOL
        tokenBMint: 'TokenMintAddress', // Your token mint
        feeRate: 30, // 0.3%
        hookFeeRate: parseFloat(hookFee),
      });

      setSuccessMessage(
        `Transfer Hook AMM Pool created successfully!\n\n` +
        `Pool Address: ${pool.pool.toString().slice(0, 8)}...${pool.pool.toString().slice(-8)}\n` +
        `Fee Rate: 0.3%\n` +
        `Hook Fee: ${hookFee}%\n\n` +
        `Transaction: ${pool.signature.slice(0, 8)}...${pool.signature.slice(-8)}\n\n` +
        `View on Solana Explorer: https://explorer.solana.com/tx/${pool.signature}?cluster=testnet`
      );
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error creating transfer hook pool:', err);
      setError(`Failed to create transfer hook pool: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (!walletInfo) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.muted} />
          <AppText style={[styles.noWalletText, { color: theme.colors.text }]}>
            Connect your wallet to create Transfer Hook tokens
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>
            Transfer Hook Launchpad
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: theme.colors.muted }]}>
            Create Token-2022 with Transfer Hooks & AMM Pools
          </AppText>
        </View>

        {/* Token Information */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Token Information
          </AppText>
          
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Token Name (e.g., My Transfer Hook Token)"
            placeholderTextColor={theme.colors.muted}
            value={tokenName}
            onChangeText={setTokenName}
          />
          
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Token Symbol (e.g., MTHT)"
            placeholderTextColor={theme.colors.muted}
            value={tokenSymbol}
            onChangeText={setTokenSymbol}
            autoCapitalize="characters"
          />
          
          <TextInput
            style={[styles.textArea, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Token Description"
            placeholderTextColor={theme.colors.muted}
            value={tokenDescription}
            onChangeText={setTokenDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Token Configuration */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Token Configuration
          </AppText>
          
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Decimals (e.g., 9)"
            placeholderTextColor={theme.colors.muted}
            value={decimals}
            onChangeText={setDecimals}
            keyboardType="numeric"
          />
          
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Total Supply (e.g., 1000000)"
            placeholderTextColor={theme.colors.muted}
            value={totalSupply}
            onChangeText={setTotalSupply}
            keyboardType="numeric"
          />
        </View>

        {/* Transfer Hook Configuration */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Transfer Hook Configuration
          </AppText>
          
          <View style={styles.hookInfo}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <AppText style={[styles.hookInfoText, { color: theme.colors.muted }]}>
              Transfer hooks execute custom logic on every token transfer
            </AppText>
          </View>
          
          <TextInput
            style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.background }]}
            placeholder="Hook Fee % (e.g., 0.1)"
            placeholderTextColor={theme.colors.muted}
            value={hookFee}
            onChangeText={setHookFee}
            keyboardType="numeric"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: loading ? theme.colors.muted : theme.colors.primary }
            ]}
            onPress={handleCreateTransferHookToken}
            disabled={loading}
          >
            <AppText style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Transfer Hook Token'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createPoolButton,
              { backgroundColor: loading ? theme.colors.muted : theme.colors.success }
            ]}
            onPress={handleCreateTransferHookPool}
            disabled={loading}
          >
            <AppText style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create AMM Pool'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={[styles.featuresCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Transfer Hook Features
          </AppText>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <AppText style={[styles.featureText, { color: theme.colors.text }]}>
              Custom transfer logic execution
            </AppText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <AppText style={[styles.featureText, { color: theme.colors.text }]}>
              Automatic fee collection
            </AppText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <AppText style={[styles.featureText, { color: theme.colors.text }]}>
              AMM trading support
            </AppText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <AppText style={[styles.featureText, { color: theme.colors.text }]}>
              Permissionless hook approval
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
            <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>
              Success!
            </AppText>
            <ScrollView style={styles.modalScroll}>
              <AppText style={[styles.modalText, { color: theme.colors.text }]}>
                {successMessage}
              </AppText>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <AppText style={styles.modalButtonText}>Close</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
            <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>
              Error
            </AppText>
            <AppText style={[styles.modalText, { color: theme.colors.text }]}>
              {error}
            </AppText>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
              onPress={() => setShowErrorModal(false)}
            >
              <AppText style={styles.modalButtonText}>Close</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
  },
  inputCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 12,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  hookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hookInfoText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createPoolButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  featuresCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    marginLeft: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    marginVertical: 16,
  },
  modalScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
}); 