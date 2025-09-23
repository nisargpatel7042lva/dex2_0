import { useAppTheme } from '@/components/app-theme';
import { AppView } from '@/components/app-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface WelcomeSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconColor: string;
  gradient: [string, string, string];
}

const welcomeSlides: WelcomeSlide[] = [
  {
    id: 1,
    title: 'Welcome to DEX Screener',
    subtitle: 'The Future of Token Analytics',
    description: 'Experience the next generation of decentralized trading with advanced Token-2022 analytics and real-time market insights.',
    icon: 'analytics',
    iconColor: '#6366f1',
    gradient: ['#000000', '#111111', '#1a1a1a'],
  },
  {
    id: 2,
    title: 'Revolutionary Token-2022',
    subtitle: 'Beyond Traditional Tokens',
    description: 'Discover tokens with transfer hooks, confidential transfers, and dynamic metadata - features that make Token-2022 the most advanced token standard on Solana.',
    icon: 'rocket',
    iconColor: '#10b981',
    gradient: ['#000000', '#0f172a', '#1e293b'],
  },
  {
    id: 3,
    title: 'Advanced Trading Features',
    subtitle: 'Professional-Grade Tools',
    description: 'Access real-time analytics, portfolio tracking, and advanced trading tools designed for both beginners and professional traders.',
    icon: 'trending-up',
    iconColor: '#f59e0b',
    gradient: ['#000000', '#1a1a1a', '#262626'],
  },
  {
    id: 4,
    title: 'Ready to Start?',
    subtitle: 'Connect Your Wallet',
    description: 'Join thousands of traders already using DEX Screener. Connect your wallet and start exploring the future of token trading.',
    icon: 'wallet',
    iconColor: '#ef4444',
    gradient: ['#000000', '#111111', '#1a1a1a'],
  },
];

const WelcomeSlideComponent = ({ slide, isActive }: { slide: WelcomeSlide; isActive: boolean }) => {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
      >
        <View style={styles.slideContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${slide.iconColor}20` }]}>
            <Ionicons name={slide.icon as any} size={80} color={slide.iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.slideTitle, { color: theme.colors.text }]}>
            {slide.title}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.slideSubtitle, { color: theme.colors.primary }]}>
            {slide.subtitle}
          </Text>

          {/* Description */}
          <Text style={[styles.slideDescription, { color: theme.colors.muted }]}>
            {slide.description}
          </Text>

          {/* Feature highlights for slide 2 */}
          {slide.id === 2 && (
            <View style={styles.featureHighlights}>
              <View style={styles.featureItem}>
                <Ionicons name="link" size={20} color={theme.colors.accent} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Transfer Hooks
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="eye-off" size={20} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Confidential Transfers
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="document-text" size={20} color={theme.colors.warning} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Dynamic Metadata
                </Text>
              </View>
            </View>
          )}

          {/* Stats for slide 3 */}
          {slide.id === 3 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>10K+</Text>
                <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Active Users</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>$50M+</Text>
                <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Trading Volume</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>99.9%</Text>
                <Text style={[styles.statLabel, { color: theme.colors.muted }]}>Uptime</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

export default function WelcomeScreen() {
  const { theme } = useAppTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (currentSlide < welcomeSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      // Mark welcome as shown and navigate to sign-in screen
      try {
        await AsyncStorage.setItem('welcome_shown', 'true');
      } catch (error) {
        console.error('Error saving welcome status:', error);
      }
      router.push('/sign-in');
    }
  };

  const handleSkip = async () => {
    // Mark welcome as shown and navigate to sign-in screen
    try {
      await AsyncStorage.setItem('welcome_shown', 'true');
    } catch (error) {
      console.error('Error saving welcome status:', error);
    }
    router.push('/sign-in');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <AppView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.colors.muted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {welcomeSlides.map((slide) => (
          <WelcomeSlideComponent key={slide.id} slide={slide} isActive={currentSlide === slide.id - 1} />
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {welcomeSlides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentSlide ? theme.colors.primary : theme.colors.muted,
                opacity: index === currentSlide ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: '#000000' }]}>
            {currentSlide === welcomeSlides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentSlide === welcomeSlides.length - 1 ? 'arrow-forward' : 'chevron-forward'}
            size={20}
            color="#000000"
          />
        </TouchableOpacity>
      </View>
    </AppView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  featureHighlights: {
    marginTop: 32,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 32,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
}); 