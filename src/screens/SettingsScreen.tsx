import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const SettingsScreen: React.FC = () => {
  const { walletInfo, disconnectWallet } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet();
            } catch (error) {
              console.error('Error disconnecting wallet:', error);
            }
          }
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Wallet',
      items: [
        {
          id: 'wallet-info',
          title: 'Wallet Address',
          subtitle: walletInfo ? `${walletInfo.publicKey.toString().slice(0, 6)}...${walletInfo.publicKey.toString().slice(-4)}` : 'Not connected',
          icon: 'wallet',
          action: 'none',
        },
        {
          id: 'disconnect',
          title: 'Disconnect Wallet',
          subtitle: 'Remove wallet connection',
          icon: 'log-out',
          action: 'disconnect',
          destructive: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get alerts for price changes',
          icon: 'notifications',
          action: 'toggle',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme',
          icon: 'moon',
          action: 'toggle',
          value: darkModeEnabled,
          onValueChange: setDarkModeEnabled,
        },
        {
          id: 'biometric',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face ID',
          icon: 'finger-print',
          action: 'toggle',
          value: biometricEnabled,
          onValueChange: setBiometricEnabled,
        },
      ],
    },
    {
      title: 'Network',
      items: [
        {
          id: 'network',
          title: 'Network',
          subtitle: 'Solana Devnet',
          icon: 'globe',
          action: 'none',
        },
        {
          id: 'rpc-endpoint',
          title: 'RPC Endpoint',
          subtitle: 'https://api.mainnet-beta.solana.com',
          icon: 'server',
          action: 'none',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help with the app',
          icon: 'help-circle',
          action: 'navigate',
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Report bugs or suggest features',
          icon: 'chatbubble',
          action: 'navigate',
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          icon: 'information-circle',
          action: 'navigate',
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => {
        if (item.action === 'disconnect') {
          handleDisconnectWallet();
        } else if (item.action === 'navigate') {
          // Handle navigation
          console.log('Navigate to:', item.id);
        }
      }}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.settingIcon, item.destructive && styles.destructiveIcon]}>
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={item.destructive ? '#ef4444' : '#6366f1'} 
          />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
            {item.title}
          </Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      
      {item.action === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
          thumbColor="#ffffff"
        />
      ) : item.action !== 'none' ? (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your wallet and preferences
          </Text>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            DEX Screener v1.0.0
          </Text>
          <Text style={styles.appInfoSubtext}>
            Token-2022 Analytics Platform
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#fef2f2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  destructiveText: {
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SettingsScreen; 