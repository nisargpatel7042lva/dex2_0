import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';


export default function SendScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, walletService } = useApp();
  
  // Transfer state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);

  // Fee calculation (mock)
  const networkFee = 0.000005; // SOL
  const totalFee = networkFee;
  const totalAmount = amount ? parseFloat(amount) + totalFee : 0;

  const validateAddress = (address: string) => {
    // Basic Solana address validation (44 characters, base58)
    const isValid = address.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    setIsValidAddress(isValid);
    return isValid;
  };

  const handleAddressChange = (address: string) => {
    setRecipientAddress(address);
    if (address.length > 0) {
      validateAddress(address);
    } else {
      setIsValidAddress(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places to 9 (Solana's max)
    if (parts[1] && parts[1].length > 9) return;
    
    setAmount(cleanValue);
  };

  const handleSend = async () => {
    if (!walletInfo || !walletService) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!recipientAddress || !isValidAddress) {
      Alert.alert('Error', 'Please enter a valid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount > walletInfo.balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (totalAmount > walletInfo.balance) {
      Alert.alert('Error', 'Insufficient balance to cover amount + fees');
      return;
    }

    setLoading(true);
    
    try {
      // Show signing prompt
      Alert.alert(
        'Sign Transaction',
        'Please sign the transfer transaction in your wallet to proceed.',
        [{ text: 'OK' }]
      );
      
      // Create real SOL transfer transaction
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      
      const connection = new Connection('https://api.testnet.solana.com', 'confirmed');
      const transaction = new Transaction();
      
      // Add transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: walletInfo.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: Math.floor(numAmount * LAMPORTS_PER_SOL),
      });
      
      transaction.add(transferInstruction);
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletInfo.publicKey;
      
      // Sign and send transaction using the wallet service
      const signature = await walletService.sendTransaction(transaction);
      
      // Show confirmation message
      Alert.alert(
        'Transaction Submitted',
        'Your transfer transaction has been submitted. Waiting for confirmation...',
        [{ text: 'OK' }]
      );
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      Alert.alert(
        'Transfer Successful!',
        `Sent ${amount} SOL to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}\n\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}\n\nView on Solscan: https://solscan.io/tx/${signature}`,
        [
          { text: 'OK', onPress: () => router.back() },
          { 
            text: 'View Transaction', 
            onPress: () => {
              console.log('Open transaction:', `https://solscan.io/tx/${signature}`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pasteAddress = async () => {
    // In a real app, this would use Clipboard API
    Alert.alert('Paste', 'Paste functionality would be implemented here');
  };

  const scanQR = () => {
    Alert.alert('Scan QR', 'QR scanning functionality would be implemented here');
  };

  const setMaxAmount = () => {
    if (walletInfo) {
      const maxAmount = Math.max(0, walletInfo.balance - totalFee);
      setAmount(maxAmount.toFixed(9));
    }
  };

  if (!walletInfo) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!hideHeader && (
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>Send</AppText>
            <View style={styles.placeholder} />
          </View>
        )}
        
        <View style={styles.centerContent}>
          <Ionicons name="wallet-outline" size={64} color={theme.colors.muted} />
          <AppText style={[styles.noWalletText, { color: theme.colors.text }]}>
            Connect your wallet to send payments
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
          <AppText style={[styles.headerTitle, { color: theme.colors.text }]}>Send</AppText>
          <View style={styles.placeholder} />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recipient Address */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Recipient Address</AppText>
          
          <View style={styles.addressInputContainer}>
            <TextInput
              style={[
                styles.addressInput,
                { 
                  color: theme.colors.text,
                  borderColor: isValidAddress ? theme.colors.success : theme.colors.border,
                  backgroundColor: theme.colors.background,
                }
              ]}
              placeholder="Enter Solana address (44 characters)"
              placeholderTextColor={theme.colors.muted}
              value={recipientAddress}
              onChangeText={handleAddressChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.addressActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={pasteAddress}
              >
                <Ionicons name="clipboard-outline" size={20} color={theme.colors.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={scanQR}
              >
                <Ionicons name="qr-code-outline" size={20} color={theme.colors.background} />
              </TouchableOpacity>
            </View>
          </View>
          
          {recipientAddress.length > 0 && (
            <AppText style={[
              styles.validationText,
              { color: isValidAddress ? theme.colors.success : theme.colors.error }
            ]}>
              {isValidAddress ? 'Valid Solana address' : 'Invalid address format'}
            </AppText>
          )}
        </View>

        {/* Amount */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Amount</AppText>
          
          <View style={styles.amountInputContainer}>
            <TextInput
              style={[
                styles.amountInput,
                { 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                }
              ]}
              placeholder="0.0"
              placeholderTextColor={theme.colors.muted}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.maxButton, { backgroundColor: theme.colors.primary }]}
              onPress={setMaxAmount}
            >
              <AppText style={[styles.maxButtonText, { color: theme.colors.background }]}>MAX</AppText>
            </TouchableOpacity>
          </View>
          
          <AppText style={[styles.balanceText, { color: theme.colors.muted }]}>
            Available: {walletInfo.balance.toFixed(9)} SOL
          </AppText>
        </View>

        {/* Note (Optional) */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Note (Optional)</AppText>
          
          <TextInput
            style={[
              styles.noteInput,
              { 
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              }
            ]}
            placeholder="Add a note to this transaction"
            placeholderTextColor={theme.colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Fee Breakdown */}
        <View style={[styles.feeCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Fee Breakdown</AppText>
          
          <View style={[styles.feeRow, { borderBottomColor: theme.colors.border }]}>
            <AppText style={[styles.feeLabel, { color: theme.colors.muted }]}>Network Fee</AppText>
            <AppText style={[styles.feeValue, { color: theme.colors.text }]}>
              {networkFee.toFixed(9)} SOL
            </AppText>
          </View>
          
          <View style={styles.feeRow}>
            <AppText style={[styles.feeLabel, { color: theme.colors.muted }]}>Total Amount</AppText>
            <AppText style={[styles.feeValue, { color: theme.colors.text }]}>
              {totalAmount.toFixed(9)} SOL
            </AppText>
          </View>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
            <AppText style={[styles.securityTitle, { color: theme.colors.text }]}>Security Notice</AppText>
          </View>
          <AppText style={[styles.securityText, { color: theme.colors.muted }]}>
            Always double-check the recipient address before sending. Transactions cannot be reversed once confirmed.
          </AppText>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: loading || !isValidAddress || !amount ? theme.colors.muted : theme.colors.primary,
              opacity: loading || !isValidAddress || !amount ? 0.6 : 1,
            }
          ]}
          onPress={handleSend}
          disabled={loading || !isValidAddress || !amount}
        >
          <AppText style={[styles.sendButtonText, { color: theme.colors.background }]}>
            {loading ? 'Sending...' : 'Send Transaction'}
          </AppText>
        </TouchableOpacity>
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
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 150, // Increased bottom padding to clear the navbar
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
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    marginRight: 12,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
  },
  validationText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    marginRight: 12,
  },
  maxButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  maxButtonText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  noteInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    textAlignVertical: 'top',
  },
  feeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  feeLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  feeValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  securityCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginLeft: 8,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    lineHeight: 20,
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
}); 