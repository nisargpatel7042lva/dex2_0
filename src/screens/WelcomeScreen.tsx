import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const WelcomeScreen: React.FC = () => {
  const { connectWallet, loading } = useApp();
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    try {
      await connectWallet();
      setPrivateKey('');
      setShowPrivateKeyInput(false);
    } catch (error) {
      Alert.alert('Error', 'Invalid private key');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a855f7']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="analytics" size={60} color="#ffffff" />
            </View>
            <Text style={styles.title}>DEX Screener</Text>
            <Text style={styles.subtitle}>
              Token-2022 Analytics & Trading Platform
            </Text>
          </View>

          <View style={styles.content}>
            <View style={styles.featureCard}>
              <Ionicons name="trending-up" size={24} color="#6366f1" />
              <Text style={styles.featureTitle}>Real-time Analytics</Text>
              <Text style={styles.featureText}>
                Track Token-2022 prices, volume, and market data across all DEXs
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="wallet" size={24} color="#6366f1" />
              <Text style={styles.featureTitle}>Secure Wallet</Text>
              <Text style={styles.featureText}>
                Connect your wallet to view portfolio and manage Token-2022 assets
              </Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="swap-horizontal" size={24} color="#6366f1" />
              <Text style={styles.featureTitle}>Transfer Hooks</Text>
              <Text style={styles.featureText}>
                Advanced Token-2022 features with programmable transfer hooks
              </Text>
            </View>
          </View>

          <View style={styles.walletSection}>
            <Text style={styles.sectionTitle}>Connect Your Wallet</Text>
            
            {showPrivateKeyInput ? (
              <View style={styles.privateKeyContainer}>
                <TextInput
                  style={styles.privateKeyInput}
                  placeholder="Enter private key (optional)"
                  placeholderTextColor="#9ca3af"
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
                    disabled={loading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading ? 'Importing...' : 'Import Wallet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleConnectWallet}
                  disabled={loading}
                >
                  <Ionicons name="wallet" size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Connecting...' : 'Connect Demo Wallet'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowPrivateKeyInput(true)}
                >
                  <Ionicons name="key" size={20} color="#6366f1" />
                  <Text style={styles.secondaryButtonText}>Import Private Key</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Demo Mode - Using Solana Devnet
            </Text>
            <Text style={styles.footerSubtext}>
              This is a demonstration app for Token-2022 analytics
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
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
    backgroundColor: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  privateKeyContainer: {
    gap: 12,
  },
  privateKeyInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 80,
    textAlignVertical: 'top',
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
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default WelcomeScreen; 