import { useAppTheme } from '@/components/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface TabItem {
  key: string;
  title: string;
  icon: string;
  iconSelected: string;
  screen: string;
}

const tabs: TabItem[] = [
  { key: 'index', title: 'Home', icon: 'home-outline', iconSelected: 'home', screen: 'index' },
  { key: 'trading', title: 'Trade', icon: 'trending-up-outline', iconSelected: 'trending-up', screen: 'trading' },
  { key: 'portfolio', title: 'Portfolio', icon: 'pie-chart-outline', iconSelected: 'pie-chart', screen: 'portfolio' },
  { key: 'settings', title: 'Settings', icon: 'settings-outline', iconSelected: 'settings', screen: 'settings' },
];

export default function TabLayout() {
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('index');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const currentTab = pathname.split('/').pop() || 'index';
    setActiveTab(currentTab);
  }, [pathname]);

  const animateTransition = (direction: 'left' | 'right') => {
    setIsAnimating(true);
    
    // Fade out current screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'left' ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animations for next screen
      slideAnim.setValue(direction === 'left' ? 50 : -50);
      fadeAnim.setValue(0.3);
      scaleAnim.setValue(0.95);
      
      // Animate in new screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleTabPress = (tabKey: string) => {
    if (activeTab === tabKey || isAnimating) return;
    
    // Determine animation direction based on tab order
    const currentIndex = tabs.findIndex(tab => tab.key === activeTab);
    const newIndex = tabs.findIndex(tab => tab.key === tabKey);
    const direction = newIndex > currentIndex ? 'left' : 'right';
    
    setActiveTab(tabKey);
    animateTransition(direction);
    
    // Navigate to the new screen
    if (tabKey === 'index') {
      router.push('/(tabs)/');
    } else {
      router.push(`/(tabs)/${tabKey}`);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide default tab bar
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="trading" />
          <Tabs.Screen name="portfolio" />
          <Tabs.Screen name="settings" />
        </Tabs>
      </Animated.View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.7}
                disabled={isAnimating}
              >
                {isActive && (
                  <Animated.View 
                    style={[
                      styles.activeIndicator,
                      {
                        transform: [
                          {
                            scale: isActive ? 1 : 0.8
                          }
                        ]
                      }
                    ]} 
                  />
                )}

                <Ionicons
                  name={isActive ? tab.iconSelected : tab.icon}
                  size={22}
                  color={isActive ? '#fff' : '#666'}
                  style={[
                    styles.tabIcon,
                    {
                      transform: [
                        {
                          scale: isActive ? 1.1 : 1
                        }
                      ]
                    }
                  ]}
                />

                <Text style={[
                  styles.tabTitle,
                  isActive && styles.activeTabTitle
                ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#fff',
    opacity: 0.1,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabTitle: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 0.2,
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontWeight: '600',
  },
  activeTabTitle: {
    color: '#fff',
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
  },
});
