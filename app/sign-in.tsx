import { useAppTheme } from '@/components/app-theme';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignIn() {
  const { theme } = useAppTheme();
  const { connectWallet, loading, error } = useApp();
  const [loadingText, setLoadingText] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const logoScale = useState(new Animated.Value(0.8))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConnectWallet = async () => {
    try {
      setLoadingText('Connecting to your wallet...');
      await connectWallet();
      // Wallet connection automatically handles authentication
      // No need for separate signIn() call
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      Alert.alert(
        'Wallet Connection Error', 
        'Failed to connect wallet. Please make sure you have a Solana wallet app installed (like Phantom, Solflare, or Slope) and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#111111', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* App Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.appLogo}
            />
          </View>
          <Text style={styles.appTitle}>DEX Screener</Text>
          <Text style={styles.appSubtitle}>
            Token-2022 Analytics & Trading Platform
          </Text>
        </Animated.View>

        {/* Tagline Section */}
        <Animated.View
          style={[
            styles.taglineSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.tagline}>
            Discover the future of token trading with advanced analytics and revolutionary Token-2022 features
          </Text>
        </Animated.View>

        {/* Connect Wallet Section */}
        <Animated.View
          style={[
            styles.walletSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnectWallet}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={styles.loadingText}>{loadingText}</Text>
              </View>
            ) : (
              <>
                <Ionicons
                  name="wallet"
                  size={24}
                  color="#000000"
                  style={styles.buttonIcon}
                />
                <Text style={styles.primaryButtonText}>Connect Wallet</Text>
              </>
            )}
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            Connect your Solana wallet to start trading
          </Text>
          <Text style={styles.footerSubtext}>
            Sign the contract to connect your real wallet
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  taglineSection: {
    marginBottom: 60,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletSection: {
    width: '100%',
    marginBottom: 60,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
