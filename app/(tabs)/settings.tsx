import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { useAuth } from '@/components/auth/auth-provider';
import VideoModeToggle from '@/components/VideoModeToggle';
import { useApp } from '@/src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';

const SettingItem = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showSwitch = false, 
  switchValue = false, 
  onSwitchChange = () => {},
  showArrow = true,
  danger = false 
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showArrow?: boolean;
  danger?: boolean;
}) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)' }]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={danger ? theme.colors.error : theme.colors.primary} 
          />
        </View>
        <View style={styles.settingContent}>
          <AppText style={[styles.settingTitle, { color: danger ? theme.colors.error : theme.colors.text }]}>
            {title}
          </AppText>
          {subtitle && (
            <AppText style={[styles.settingSubtitle, { color: theme.colors.muted }]}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={switchValue ? '#ffffff' : theme.colors.muted}
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title }: { title: string }) => {
  const { theme } = useAppTheme();
  
  return (
    <AppText style={[styles.sectionHeader, { color: theme.colors.primary }]}>
      {title}
    </AppText>
  );
};

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const { walletInfo, disconnectWallet, token2022Mints, router, setRouter } = useApp();
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: () => {
            disconnectWallet();
            signOut();
          }
        },
      ]
    );
  };

  const handleExportWallet = () => {
    Alert.alert(
      'Export Wallet',
      'This will export your wallet private key. Keep it secure and never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          // In a real app, this would export the private key securely
          Alert.alert('Export', 'Wallet export functionality would be implemented here.');
        }},
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all app data including wallet connections and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would clear all stored data
            Alert.alert('Cleared', 'All app data has been cleared.');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={[styles.title, { color: theme.colors.text }]}>Settings</AppText>
          <AppText style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Manage your app preferences
          </AppText>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <SectionHeader title="Wallet" />
          
          {walletInfo ? (
            <>
              <View style={[styles.walletInfo, { backgroundColor: theme.colors.card }]}>
                <View style={styles.walletHeader}>
                  <View style={[styles.walletIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                    <Ionicons name="wallet" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.walletDetails}>
                    <AppText style={[styles.walletTitle, { color: theme.colors.text }]}>Connected Wallet</AppText>
                    <AppText style={[styles.walletAddress, { color: theme.colors.muted }]}>
                      {walletInfo.publicKey.toString().substring(0, 8)}...{walletInfo.publicKey.toString().substring(walletInfo.publicKey.toString().length - 8)}
                    </AppText>
                    <AppText style={[styles.walletBalance, { color: theme.colors.primary }]}>
                      {walletInfo.balance.toFixed(4)} SOL
                    </AppText>
                  </View>
                </View>
                
                <View style={styles.walletStats}>
                  <View style={styles.walletStat}>
                    <AppText style={[styles.walletStatLabel, { color: theme.colors.muted }]}>Token-2022 Mints</AppText>
                    <AppText style={[styles.walletStatValue, { color: theme.colors.text }]}>
                      {token2022Mints.length}
                    </AppText>
                  </View>
                  <View style={styles.walletStat}>
                    <AppText style={[styles.walletStatLabel, { color: theme.colors.muted }]}>Network</AppText>
                    <AppText style={[styles.walletStatValue, { color: theme.colors.text }]}>Devnet</AppText>
                  </View>
                </View>
              </View>

              <SettingItem
                icon="download-outline"
                title="Export Wallet"
                subtitle="Export your private key for backup"
                onPress={handleExportWallet}
              />

              <SettingItem
                icon="log-out-outline"
                title="Disconnect Wallet"
                subtitle="Disconnect your current wallet"
                onPress={handleDisconnect}
                danger
              />
            </>
          ) : (
            <View style={[styles.noWallet, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.muted} />
              <AppText style={[styles.noWalletTitle, { color: theme.colors.text }]}>No Wallet Connected</AppText>
              <AppText style={[styles.noWalletSubtitle, { color: theme.colors.muted }]}>
                Connect a wallet to manage your Token-2022 assets
              </AppText>
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive alerts for price changes and transactions"
            showSwitch
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
            showArrow={false}
          />

          <SettingItem
            icon="finger-print-outline"
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID to unlock the app"
            showSwitch
            switchValue={biometricEnabled}
            onSwitchChange={setBiometricEnabled}
            showArrow={false}
          />

          <SettingItem
            icon="swap-horizontal-outline"
            title={`Router: ${router === 'jupiter' ? 'Jupiter' : 'Raydium'}`}
            subtitle="Choose the swap routing engine"
            onPress={() => {
              if (setRouter) setRouter(router === 'jupiter' ? 'raydium' : 'jupiter');
            }}
            showArrow
          />
        </View>

        {/* Developer Tools Section */}
        <View style={styles.section}>
          <SectionHeader title="Developer Tools" />
          <VideoModeToggle />
        </View>

        {/* Token-2022 Section */}
        <View style={styles.section}>
          <SectionHeader title="Token-2022 Features" />
          
          <SettingItem
            icon="link-outline"
            title="Transfer Hooks"
            subtitle="Manage custom transfer logic for your tokens"
            onPress={() => Alert.alert('Transfer Hooks', 'Transfer hooks management would be implemented here.')}
          />

          <SettingItem
            icon="eye-off-outline"
            title="Confidential Transfers"
            subtitle="Configure private token transfer settings"
            onPress={() => Alert.alert('Confidential Transfers', 'Confidential transfer settings would be implemented here.')}
          />

          <SettingItem
            icon="document-text-outline"
            title="Metadata Pointers"
            subtitle="Manage dynamic metadata for your tokens"
            onPress={() => Alert.alert('Metadata Pointers', 'Metadata pointer management would be implemented here.')}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionHeader title="Support" />
          
          <SettingItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get help with using the app"
            onPress={() => Alert.alert('Help', 'Help and FAQ would be implemented here.')}
          />

          <SettingItem
            icon="document-outline"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => Alert.alert('Terms', 'Terms of service would be displayed here.')}
          />

          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="Learn about our privacy practices"
            onPress={() => Alert.alert('Privacy', 'Privacy policy would be displayed here.')}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <SectionHeader title="Data Management" />
          
          <SettingItem
            icon="trash-outline"
            title="Clear All Data"
            subtitle="Remove all app data and reset to defaults"
            onPress={handleClearData}
            danger
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <SectionHeader title="App Information" />
          
          <View style={[styles.appInfo, { backgroundColor: theme.colors.card }]}>
            <View style={styles.appInfoItem}>
              <AppText style={[styles.appInfoLabel, { color: theme.colors.muted }]}>Version</AppText>
              <AppText style={[styles.appInfoValue, { color: theme.colors.text }]}>1.0.0</AppText>
            </View>
            <View style={styles.appInfoItem}>
              <AppText style={[styles.appInfoLabel, { color: theme.colors.muted }]}>Build</AppText>
              <AppText style={[styles.appInfoValue, { color: theme.colors.text }]}>2024.1.1</AppText>
            </View>
            <View style={styles.appInfoItem}>
              <AppText style={[styles.appInfoLabel, { color: theme.colors.muted }]}>Network</AppText>
              <AppText style={[styles.appInfoValue, { color: theme.colors.text }]}>Solana Devnet</AppText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150, // Increased bottom padding to clear the navbar
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24, // Increased vertical padding to prevent text cutting
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    lineHeight: 40, // Added proper line height
    marginBottom: 8,
    paddingVertical: 4, // Added padding to prevent cutting
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  walletInfo: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletDetails: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  walletAddress: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletBalance: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  walletStat: {
    alignItems: 'center',
    flex: 1,
  },
  walletStatLabel: {
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  walletStatValue: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  noWallet: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noWalletTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  noWalletSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  settingRight: {
    alignItems: 'center',
  },
  appInfo: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appInfoLabel: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  appInfoValue: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
}); 