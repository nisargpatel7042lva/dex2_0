import { useAppTheme } from '@/components/app-theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
}

const onboardingData: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Dex2.0',
    subtitle: 'The Future of Token Trading',
    description: 'Experience the next generation of decentralized trading with Token-2022 and Transfer Hooks on Solana.',
    icon: 'rocket',
    color: '#6366f1',
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: '2',
    title: 'Advanced Token Features',
    subtitle: 'Token-2022 with Transfer Hooks',
    description: 'Trade tokens with built-in transfer hooks, confidential transfers, and advanced metadata pointers.',
    icon: 'shield-checkmark',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: '3',
    title: 'Automated Market Making',
    subtitle: 'Seamless Trading Experience',
    description: 'Swap tokens instantly using our advanced AMM with constant product formula and real-time pricing.',
    icon: 'trending-up',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
  {
    id: '4',
    title: 'Ready to Start Trading?',
    subtitle: 'Connect Your Wallet',
    description: 'Join the future of decentralized finance. Connect your wallet and start trading Token-2022 assets.',
    icon: 'wallet',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const titleScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const iconScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.slideContent}>
          {/* Icon Container */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { 
                backgroundColor: `${item.color}20`,
                transform: [{ scale: iconScale }],
                opacity,
              }
            ]}
          >
            <Ionicons name={item.icon as any} size={80} color={item.color} />
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Animated.Text 
              style={[
                styles.title,
                { 
                  color: theme.colors.text,
                  transform: [{ scale: titleScale }],
                }
              ]}
            >
              {item.title}
            </Animated.Text>
            
            <Text style={[styles.subtitle, { color: item.color }]}>
              {item.subtitle}
            </Text>
            
            <Text style={[styles.description, { color: theme.colors.muted }]}>
              {item.description}
            </Text>
          </View>

          {/* Feature Highlights */}
          {index === 1 && (
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Transfer Hooks for Custom Logic
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Confidential Transfers
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Advanced Metadata Pointers
                </Text>
              </View>
            </View>
          )}

          {index === 2 && (
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Instant Token Swaps
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="analytics" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Real-time Price Feeds
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield" size={20} color={item.color} />
                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                  Secure Smart Contracts
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: index === currentIndex ? onboardingData[index].color : theme.colors.border,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.colors.muted }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Pagination */}
      {renderPagination()}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { 
              backgroundColor: onboardingData[currentIndex].color,
              shadowColor: onboardingData[currentIndex].color,
            }
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={currentIndex === onboardingData.length - 1 ? 'arrow-forward' : 'chevron-forward'} 
            size={20} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  slide: {
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
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  featureList: {
    width: '100%',
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionContainer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
}); 