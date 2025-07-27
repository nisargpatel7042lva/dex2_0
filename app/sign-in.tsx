import { useAppTheme } from '@/components/app-theme'
import { AppView } from '@/components/app-view'
import { useAuth } from '@/components/auth/auth-provider'
import { useApp } from '@/src/context/AppContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function SignIn() {
  const { signIn, isLoading } = useAuth()
  const { connectWallet, requestAirdrop } = useApp()
  const { theme } = useAppTheme()
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  });

  const handleConnectWallet = async () => {
    try {
      await signIn()
      await connectWallet()
      router.replace('/')
    } catch (err) {
      Alert.alert('Error', 'Failed to connect wallet')
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key')
      return;
    }

    try {
      await signIn()
      await connectWallet(privateKey)
      setPrivateKey('');
      setShowPrivateKeyInput(false);
      router.replace('/')
    } catch (err) {
      Alert.alert('Error', 'Invalid private key')
    }
  };

  const handleRequestAirdrop = async () => {
    try {
      await requestAirdrop(1)
      Alert.alert('Success', 'Airdrop requested successfully!')
    } catch (err) {
      Alert.alert('Error', 'Failed to request airdrop')
    }
  };

  if (isLoading) {
    return (
      <AppView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Connecting...</Text>
      </AppView>
    )
  }

  return (
    <AppView style={styles.container}>
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoContainer}>
              <Ionicons name="analytics" size={60} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>DEX Screener</Text>
            <Text style={styles.subtitle}>
              Token-2022 Analytics & Trading Platform
            </Text>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.featureCard}>
              <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
              <Text style={styles.featureTitle}>Real-time Analytics</Text>
              <Text style={styles.featureText}>
                Track Token-2022 prices, volume, and market data across all DEXs
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="wallet" size={24} color={theme.colors.primary} />
              <Text style={styles.featureTitle}>Secure Wallet</Text>
              <Text style={styles.featureText}>
                Connect your wallet to view portfolio and manage Token-2022 assets
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
              <Text style={styles.featureTitle}>Transfer Hooks</Text>
              <Text style={styles.featureText}>
                Advanced Token-2022 features with programmable transfer hooks
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.walletSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>Connect Your Wallet</Text>
            
            {showPrivateKeyInput ? (
              <View style={styles.privateKeyContainer}>
                <TextInput
                  style={styles.privateKeyInput}
                  placeholder="Enter private key (optional)"
                  placeholderTextColor={theme.colors.muted}
                  value={privateKey}
                  onChangeText={setPrivateKey}
                  secureTextEntry
                  multiline
                />
                <View style={styles.privateKeyButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => setShowPrivateKeyInput(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleImportWallet}
                    disabled={isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Importing...' : 'Import Wallet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleConnectWallet}
                  disabled={isLoading}
                >
                  <Ionicons name="wallet" size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Connecting...' : 'Connect Demo Wallet'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowPrivateKeyInput(true)}
                >
                  <Ionicons name="key" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>Import Private Key</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.airdropButton]}
                  onPress={handleRequestAirdrop}
                >
                  <Ionicons name="gift" size={20} color="#ffffff" />
                  <Text style={styles.airdropButtonText}>Request Airdrop</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>
              Demo Mode - Using Solana Devnet
            </Text>
            <Text style={styles.footerSubtext}>
              This is a demonstration app for Token-2022 analytics
            </Text>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  content: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  airdropButton: {
    backgroundColor: '#10b981',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  airdropButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  privateKeyContainer: {
    gap: 12,
  },
  privateKeyInput: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  privateKeyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
