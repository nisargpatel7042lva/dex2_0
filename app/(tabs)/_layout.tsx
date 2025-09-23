
import { useAppTheme } from '@/components/app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  { key: 'launchpad', title: 'Launch', icon: 'rocket-outline', iconSelected: 'rocket', screen: 'launchpad' },
  { key: 'portfolio', title: 'Portfolio', icon: 'pie-chart-outline', iconSelected: 'pie-chart', screen: 'portfolio' },
  { key: 'settings', title: 'Settings', icon: 'settings-outline', iconSelected: 'settings', screen: 'settings' },
];

export default function TabLayout() {
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('index');

  useEffect(() => {
    if (pathname) {
      const pathSegments = pathname.split('/');
      const currentTab = pathSegments[pathSegments.length - 1] || 'index';
      setActiveTab(currentTab);
    }
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
          <Tabs.Screen name="launchpad" />
          <Tabs.Screen name="portfolio" />
          <Tabs.Screen name="settings" />
          <Tabs.Screen 
            name="transfer-hook-launchpad" 
            options={{ 
              href: null  // This hides it from the tab bar
            }} 
          />
        </Tabs>
      </View>

      {/* Simple Floating Bottom Tab Bar */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBar, { backgroundColor: theme.colors.background }]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.key)}
            >
              <Ionicons
                name={activeTab === tab.key ? (tab.iconSelected as any) : (tab.icon as any)}
                size={24}
                color={activeTab === tab.key ? theme.colors.primary : theme.colors.secondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === tab.key ? theme.colors.primary : theme.colors.secondary,
                  },
                ]}
              >
                {tab.title}
              </Text>
            </Pressable>
          ))}
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
    bottom: 20,
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    marginTop: 4,
  },
});
