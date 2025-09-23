import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Common tokens for selection
const COMMON_TOKENS = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9, isNative: true },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, isNative: false },
  { symbol: 'USDT', name: 'Tether', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, isNative: false },
];

export default function SendScreen({ hideHeader = false }: { hideHeader?: boolean }) {
  const { theme } = useAppTheme();
  const { walletInfo, walletService, getTokenBalances } = useApp();
  
  // Transfer state
  const [selectedToken, setSelectedToken] = useState(COMMON_TOKENS[0]); // SOL by default
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [availableTokens, setAvailableTokens] = useState(COMMON_TOKENS);
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [maxAmount, setMaxAmount] = useState('0');

  // Fee calculation (mock)
  const networkFee = 0.000005; // SOL
  const totalFee = selectedToken.symbol === 'SOL' ? networkFee : 0; // Only SOL pays network fees
  const totalAmount = amount ? parseFloat(amount) + totalFee : 0;

  // Load token balances when wallet connects
  useEffect(() => {
    if (walletInfo && walletService) {
      loadTokenBalances();
    }
  }, [walletInfo, selectedToken]);

  const loadTokenBalances = async () => {
    try {
      const balances = await getTokenBalances();
      setTokenBalances(balances);
      
      // Find balance for selected token
      const tokenBalance = balances.find(
        (token: any) => token.mint?.toString() === selectedToken.mint
      );
      
      if (tokenBalance && tokenBalance.balance > 0) {
        setMaxAmount(tokenBalance.balance.toString());
      } else if (selectedToken.symbol === 'SOL' && walletInfo) {
        // For SOL, use wallet balance but reserve some for fees
        const reserveAmount = 0.005;
        const availableBalance = Math.max(0, walletInfo.balance - reserveAmount);
        setMaxAmount(availableBalance.toFixed(9));
      } else {
        setMaxAmount('0');
      }
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  };

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
    
    // Limit decimal places based on token decimals
    if (parts[1] && parts[1].length > selectedToken.decimals) return;
    
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
    const availableBalance = parseFloat(maxAmount);
    
    if (numAmount > availableBalance) {
      Alert.alert('Error', `Insufficient ${selectedToken.symbol} balance`);
      return;
    }

    if (selectedToken.symbol === 'SOL' && totalAmount > walletInfo.balance) {
      Alert.alert('Error', 'Insufficient SOL balance to cover amount + fees');
      return;
    }

    setLoading(true);
    
    try {
      // Show signing prompt
      Alert.alert(
        'Sign Transaction',
        `Please sign the ${selectedToken.symbol} transfer transaction in your wallet to proceed.`,
        [{ text: 'OK' }]
      );
      
      let signature: string;
      
      if (selectedToken.isNative) {
        // SOL transfer
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
        
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        const transaction = new Transaction();
        
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: walletInfo.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: Math.floor(numAmount * LAMPORTS_PER_SOL),
        });
        
        transaction.add(transferInstruction);
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletInfo.publicKey;
        
        signature = await walletService.sendTransaction(transaction);
      } else {
        // Token-2022 transfer
        const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');
        const { createTransferInstruction, getAssociatedTokenAddress } = await import('@solana/spl-token');
        
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        const transaction = new Transaction();
        
        // Get token accounts
        const sourceTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(selectedToken.mint),
          walletInfo.publicKey
        );
        
        const destinationTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(selectedToken.mint),
          new PublicKey(recipientAddress)
        );
        
        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          sourceTokenAccount,
          destinationTokenAccount,
          walletInfo.publicKey,
          Math.floor(numAmount * Math.pow(10, selectedToken.decimals))
        );
        
        transaction.add(transferInstruction);
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletInfo.publicKey;
        
        signature = await walletService.sendTransaction(transaction);
      }
      
      // Show confirmation message
      Alert.alert(
        'Transaction Submitted',
        `Your ${selectedToken.symbol} transfer transaction has been submitted. Waiting for confirmation...`,
        [{ text: 'OK' }]
      );
      
      Alert.alert(
        'Transfer Successful!',
        `Sent ${amount} ${selectedToken.symbol} to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}\n\nTransaction: ${signature.slice(0, 8)}...${signature.slice(-8)}\n\nView on Solscan: https://solscan.io/tx/${signature}`,
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
      
      // Reset form
      setAmount('');
      setRecipientAddress('');
      setNote('');
      
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    setAmount('');
    setMaxAmount('0');
    setShowTokenSelector(false);
  };

  const setMaxAmountValue = () => {
    const maxAmountFloat = parseFloat(maxAmount);
    if (maxAmountFloat > 0) {
      const precision = Math.min(selectedToken.decimals, 9);
      let formattedAmount = maxAmountFloat.toFixed(precision);
      formattedAmount = parseFloat(formattedAmount).toString();
      setAmount(formattedAmount);
    }
  };

  const renderTokenItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.tokenSelectorItem, { backgroundColor: theme.colors.background }]}
      onPress={() => handleTokenSelect(item)}
    >
      <View style={styles.tokenSelectorInfo}>
        <View style={[styles.tokenSelectorIcon, { backgroundColor: theme.colors.primary }]}>
          <AppText style={styles.tokenSelectorIconText}>{item.symbol.charAt(0)}</AppText>
        </View>
        <View>
          <AppText style={[styles.tokenSelectorSymbolText, { color: theme.colors.text }]}>
            {item.symbol}
          </AppText>
          <AppText style={[styles.tokenSelectorName, { color: theme.colors.muted }]}>
            {item.name}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  const pasteAddress = async () => {
    // In a real app, this would use Clipboard API
    Alert.alert('Paste', 'Paste functionality would be implemented here');
  };

  const scanQR = () => {
    Alert.alert('Scan QR', 'QR scanning functionality would be implemented here');
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
        {/* Token Selection */}
        <View style={[styles.inputCard, { backgroundColor: theme.colors.card }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>Token</AppText>
          
          <TouchableOpacity 
            style={styles.tokenSelector}
            onPress={() => setShowTokenSelector(true)}
          >
            <View style={styles.tokenInfo}>
              <View style={[styles.tokenIcon, { backgroundColor: theme.colors.primary }]}>
                <AppText style={styles.tokenIconText}>{selectedToken.symbol.charAt(0)}</AppText>
              </View>
              <View>
                <AppText style={[styles.tokenSymbol, { color: theme.colors.text }]}>
                  {selectedToken.symbol}
                </AppText>
                <AppText style={[styles.tokenName, { color: theme.colors.muted }]}>
                  {selectedToken.name}
                </AppText>
              </View>
            </View>
            <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          
          <AppText style={[styles.balanceText, { color: theme.colors.muted }]}>
            Available: {parseFloat(maxAmount).toFixed(selectedToken.decimals)} {selectedToken.symbol}
          </AppText>
        </View>

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
                  borderColor: parseFloat(amount || '0') > parseFloat(maxAmount) 
                    ? '#ef4444' 
                    : theme.colors.border
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
              onPress={setMaxAmountValue}
            >
              <AppText style={[styles.maxButtonText, { color: theme.colors.background }]}>MAX</AppText>
            </TouchableOpacity>
          </View>
          
          {parseFloat(amount || '0') > parseFloat(maxAmount) && (
            <AppText style={[styles.errorText, { color: '#ef4444' }]}>
              Insufficient balance
            </AppText>
          )}
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
        {selectedToken.symbol === 'SOL' && (
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
        )}

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
              backgroundColor: loading || !isValidAddress || !amount || parseFloat(amount || '0') > parseFloat(maxAmount) 
                ? theme.colors.muted 
                : theme.colors.primary,
              opacity: loading || !isValidAddress || !amount || parseFloat(amount || '0') > parseFloat(maxAmount) ? 0.6 : 1,
            }
          ]}
          onPress={handleSend}
          disabled={loading || !isValidAddress || !amount || parseFloat(amount || '0') > parseFloat(maxAmount)}
        >
          <AppText style={[styles.sendButtonText, { color: theme.colors.background }]}>
            {loading ? 'Sending...' : `Send ${selectedToken.symbol}`}
          </AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* Token Selector Modal */}
      <Modal
        visible={showTokenSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTokenSelector(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.card }]}>
            <AppText style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Token to Send
            </AppText>
            <TouchableOpacity onPress={() => setShowTokenSelector(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableTokens}
            renderItem={renderTokenItem}
            keyExtractor={(item) => item.mint}
            style={styles.tokenList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
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
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenSymbol: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenSelectorSymbol: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenName: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  tokenSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tokenSelectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenSelectorIconText: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenSelectorSymbolText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  tokenSelectorName: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  tokenList: {
    paddingHorizontal: 10,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
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
  errorText: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginTop: 8,
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
  modalContainer: {
    flex: 1,
    paddingTop: 50, // Adjust for header height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
  },
}); 