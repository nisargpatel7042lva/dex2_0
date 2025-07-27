import { useAppTheme } from '@/components/app-theme';
import { useAuth } from '@/components/auth/auth-provider';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
  const { connectWallet, requestAirdrop, loading } = useApp();
  const { signIn } = useAuth();
  const [loadingText, setLoadingText] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const logoScale = useState(new Animated.Value(0.8))[0];

  useState(() => {
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
      setLoadingText('Connecting wallet...');
      await connectWallet();
      setLoadingText('Requesting airdrop...');
      await requestAirdrop(2);
      setLoadingText('Setting up your account...');
      await signIn();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Connection Error', 'Failed to connect wallet. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#111111', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* App Logo Section */}
        <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/icon.png')} style={styles.appLogo} />
          </View>
          <Text style={styles.appTitle}>DEX Screener</Text>
          <Text style={styles.appSubtitle}>Token-2022 Analytics & Trading Platform</Text>
        </Animated.View>

        {/* Tagline Section */}
        <Animated.View style={[styles.taglineSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.tagline}>
            Discover the future of token trading with advanced analytics and revolutionary Token-2022 features
          </Text>
        </Animated.View>

        {/* Connect Wallet Section */}
        <Animated.View style={[styles.walletSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnectWallet}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet" size={24} color="#000000" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            Demo Mode - Using Solana Devnet
          </Text>
          <Text style={styles.footerSubtext}>
            Experience the power of Token-2022 program
          </Text>
        </Animated.View>
      </LinearGradient>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {loadingText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  appLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  taglineSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'SpaceGrotesk-SemiBold',
    maxWidth: 300,
  },
  walletSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
