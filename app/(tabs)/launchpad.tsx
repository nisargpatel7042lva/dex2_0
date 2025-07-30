import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import React, { useState } from 'react';
import {
    Alert,
    Clipboard,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
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
  const [createdToken, setCreatedToken] = useState<{
    mint: string;
    signature: string;
  } | null>(null);

  const createToken = async () => {
    if (!walletInfo) {
      setError('❌ Wallet not connected');
      return;
    }

    // Validation
    if (!tokenName || !tokenSymbol || !tokenDescription) {
      setError('❌ Please fill in all required fields');
      return;
    }

    if (parseInt(tokenSupply) <= 0) {
      setError('❌ Total supply must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate token creation (in real implementation, this would call the blockchain)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      const mockMint = 'Token' + Date.now().toString().padStart(44, '1');
      const mockSignature = 'signature_' + Date.now();
      
      setCreatedToken({
        mint: mockMint,
        signature: mockSignature,
      });
      
      setSuccess('✅ Token created successfully!');
      
      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setTokenDescription('');
      setTokenDecimals('6');
      setTokenSupply('1000000');
      setTokenWebsite('');
      setTokenTwitter('');
      setTokenTelegram('');
    } catch (err) {
      setError(`❌ ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied!', 'Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const viewOnExplorer = (signature: string) => {
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    Linking.openURL(explorerUrl);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>🚀 Token Launchpad</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Create your Token-2022 project
          </Text>
        </View>

        {/* Token Creation Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🪙 Create New Token</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Token Name *</Text>
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
            <Text style={[styles.label, { color: theme.colors.text }]}>Token Symbol *</Text>
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
            <Text style={[styles.label, { color: theme.colors.text }]}>Description *</Text>
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
              <Text style={[styles.label, { color: theme.colors.text }]}>Decimals</Text>
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
              <Text style={[styles.label, { color: theme.colors.text }]}>Total Supply</Text>
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
            <Text style={[styles.label, { color: theme.colors.text }]}>Website (Optional)</Text>
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
              <Text style={[styles.label, { color: theme.colors.text }]}>Twitter (Optional)</Text>
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
              <Text style={[styles.label, { color: theme.colors.text }]}>Telegram (Optional)</Text>
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
            <Text style={[styles.createButtonText, { color: '#000' }]}>
              {loading ? '⏳ Creating Token...' : '🚀 Launch Token'}
            </Text>
          </TouchableOpacity>

          {createdToken && (
            <View style={styles.successMessage}>
              <Text style={[styles.successText, { color: theme.colors.success }]}>
                ✅ Token Created Successfully!
              </Text>
              <Text style={[styles.tokenInfo, { color: theme.colors.text }]}>
                Mint: {createdToken.mint.slice(0, 8)}...{createdToken.mint.slice(-8)}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.colors.accent }]}
                  onPress={() => copyToClipboard(createdToken.mint)}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>📋 Copy Mint</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.colors.accent }]}
                  onPress={() => viewOnExplorer(createdToken.signature)}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text }]}>🔗 View TX</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Success/Error Messages */}
        {success && (
          <View style={[styles.messageContainer, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.messageText, { color: theme.colors.success }]}>{success}</Text>
          </View>
        )}

        {error && (
          <View style={[styles.messageContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.messageText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  successMessage: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tokenInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 