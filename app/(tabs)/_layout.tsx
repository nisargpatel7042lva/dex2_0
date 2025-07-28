import { useAppTheme } from '@/components/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  useEffect(() => {
    const currentTab = pathname.split('/').pop() || 'index';
    setActiveTab(currentTab);
  }, [pathname]);

  const handleTabPress = (tabKey: string) => {
    if (activeTab === tabKey) return;
    
    setActiveTab(tabKey);
    
    // Navigate to the new screen
    if (tabKey === 'index') {
      router.push('/(tabs)/' as any);
    } else {
      router.push(`/(tabs)/${tabKey}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide default tab bar
            animation: 'fade',
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="trading" />
          <Tabs.Screen name="portfolio" />
          <Tabs.Screen name="settings" />
        </Tabs>
      </View>

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
              >
                {isActive && (
                  <View style={styles.activeIndicator} />
                )}

                <Ionicons
                  name={(isActive ? tab.iconSelected : tab.icon) as any}
                  size={22}
                  color={isActive ? '#fff' : '#666'}
                  style={styles.tabIcon}
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
