
import { useAppTheme } from '@/components/app-theme';
import OnboardingScreen from '@/components/OnboardingScreen';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export default function SignIn() {
  const { theme } = useAppTheme();
  const { connectWallet, loading, error, servicesInitialized } = useApp();
  const [loadingText, setLoadingText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [titleTapCount, setTitleTapCount] = useState(0);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const logoScale = useState(new Animated.Value(0.8))[0];

  // Check if onboarding has been completed
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      setShowOnboarding(onboardingCompleted !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error, show onboarding as a fallback
      setShowOnboarding(true);
    } finally {
      setIsLoadingOnboarding(false);
    }
  };

  const handleTitleTap = async () => {
    const newCount = titleTapCount + 1;
    setTitleTapCount(newCount);
    
    if (newCount >= 5) {
      // Reset onboarding status
      try {
        await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
        setShowOnboarding(true);
        setTitleTapCount(0);
        Alert.alert('Onboarding Reset', 'Onboarding has been reset. You will see it again on next app launch.');
      } catch (error) {
        console.error('Error resetting onboarding:', error);
      }
    }
  };

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
      console.log('=== CALLING CONNECT WALLET ===');
      await connectWallet();
      // Wallet connection automatically handles authentication
      // No need for separate signIn() call
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // Show more specific error messages
      let errorMessage = 'Failed to connect wallet. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Wallet connection timed out. Please ensure you have a Solana wallet app installed and try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Wallet connection was cancelled. Please try again.';
        } else if (error.message.includes('No wallet account')) {
          errorMessage = 'No wallet account found. Please make sure your wallet is unlocked and has accounts.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Wallet Connection Error', 
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Still hide onboarding even if saving fails
      setShowOnboarding(false);
    }
  };

  // Show loading while checking onboarding status
  if (isLoadingOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <LinearGradient
          colors={['#000000', '#111111', '#1a1a1a']}
          style={styles.gradient}
        >
        <ActivityIndicator size="large" color="#6366f1" />
        </LinearGradient>
      </View>
    );
  }

  // Show onboarding if not completed
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

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
          <Text style={styles.appTitle} onPress={handleTitleTap}>DEX Screener</Text>
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
            Experience the future of decentralized trading
              </Text>
          <Text style={styles.subtagline}>
            Trade Token-2022 with Transfer Hooks on Solana
              </Text>
        </Animated.View>

        {/* Connect Wallet Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
                  <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: servicesInitialized ? theme.colors.primary : theme.colors.muted,
                opacity: loading || !servicesInitialized ? 0.6 : 1,
              },
            ]}
                  onPress={handleConnectWallet}
            disabled={loading || !servicesInitialized}
                >
            {!servicesInitialized ? (
              <>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.primaryButtonText}>Initializing services...</Text>
              </>
            ) : loading ? (
              <>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.primaryButtonText}>{loadingText}</Text>
              </>
            ) : (
              <>
                <Ionicons name="wallet" size={24} color="#000" />
                <Text style={styles.primaryButtonText}> Connect Wallet</Text>
              </>
            )}
          </TouchableOpacity>

          {!servicesInitialized && !error && (
            <Text style={styles.warningText}>
              Please wait while we initialize the trading services...
            </Text>
          )}

          {error && (
            <Text style={styles.errorText}>
              Error: {error}
            </Text>
          )}
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
              <Text style={styles.featureText}>Secure Trading</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>Instant Swaps</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color={theme.colors.accent} />
              <Text style={styles.featureText}>Real-time Data</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="link" size={24} color={theme.colors.warning} />
              <Text style={styles.featureText}>Transfer Hooks</Text>
            </View>
          </View>
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
  subtagline: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  buttonSection: {
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
  warningText: {
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  featuresSection: {
    width: '100%',
    marginTop: 60,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
  },
  featureText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'SpaceGrotesk-Regular',
  },
});
