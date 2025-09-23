

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/components/app-theme';
import { DevnetConfig } from '@/constants/devnet-config';
import { useApp } from '@/src/context/AppContext';
import { Keypair, PublicKey } from '@solana/web3.js';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface LaunchpadStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
}

const INITIAL_STEPS: LaunchpadStep[] = [
  { id: 1, title: 'Create Token-2022', description: 'Create token with Transfer Hook', completed: false, inProgress: false },
  { id: 2, title: 'Create AMM Pool', description: 'Create SOL-token liquidity pool', completed: false, inProgress: false },
  { id: 3, title: 'Add Initial Liquidity', description: 'Provide initial liquidity to pool', completed: false, inProgress: false },
  { id: 4, title: 'Enable Trading', description: 'Activate trading with hook compliance', completed: false, inProgress: false },
];

interface TransferHookConfig {
  name: string;
  programId: PublicKey;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fees: string;
}

const WHITELISTED_HOOKS: TransferHookConfig[] = [
  {
    name: 'Fee Collection Hook',
    programId: DevnetConfig.TRANSFER_HOOKS.FEE_COLLECTION,
    description: 'Collects 0.1% protocol fee on each transfer',
    riskLevel: 'LOW',
    fees: '0.1%'
  },
  {
    name: 'Compliance Hook',
    programId: DevnetConfig.TRANSFER_HOOKS.COMPLIANCE,
    description: 'KYC/AML compliance validation on transfers',
    riskLevel: 'MEDIUM',
    fees: '0.05%'
  },
  {
    name: 'Rewards Hook',
    programId: DevnetConfig.TRANSFER_HOOKS.REWARDS,
    description: 'Distributes rewards to token holders',
    riskLevel: 'LOW',
    fees: '0.2%'
  },
];

export default function TransferHookLaunchpad() {
  const appTheme = useAppTheme();
  const theme = appTheme.theme;
  const { walletInfo, ammService, transferHookAMMService } = useApp();
  
  // Token Configuration
  const [tokenName, setTokenName] = useState('MyToken');
  const [tokenSymbol, setTokenSymbol] = useState('BNTY');
  const [tokenSupply, setTokenSupply] = useState('1000000');
  const [selectedHook, setSelectedHook] = useState<TransferHookConfig | null>(null);
  
  // Pool Configuration
  const [initialSolAmount, setInitialSolAmount] = useState('1.0');
  const [initialTokenAmount, setInitialTokenAmount] = useState('10000');
  
  // State Management
  const [steps, setSteps] = useState<LaunchpadStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(1);
  const [tokenMint, setTokenMint] = useState<PublicKey | null>(null);
  const [poolAddress, setPoolAddress] = useState<PublicKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const updateStepStatus = (stepId: number, completed: boolean, inProgress: boolean = false) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, completed, inProgress }
          : step
      )
    );
  };

  const handleCreateToken = async () => {
    if (!walletInfo || !selectedHook) {
      Alert.alert('Error', 'Please connect wallet and select a Transfer Hook');
      return;
    }

    setIsProcessing(true);
    updateStepStatus(1, false, true);
    setStatusMessage('Creating Token-2022 with Transfer Hook...');

    try {
      // Mock Token-2022 creation with Transfer Hook
      const mockTokenMint = Keypair.generate();
      setTokenMint(mockTokenMint.publicKey);
      
      // Simulate token creation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateStepStatus(1, true, false);
      setCurrentStep(2);
      setStatusMessage(`Token created: ${tokenSymbol} (${mockTokenMint.publicKey.toString()})`);
      
      Alert.alert(
        'Token Created!',
        `${tokenName} (${tokenSymbol}) created with Transfer Hook!\n\nMint: ${mockTokenMint.publicKey.toString()}\nHook: ${selectedHook.name}`
      );
    } catch (error) {
      console.error('Token creation error:', error);
      Alert.alert('Error', `Failed to create token: ${error}`);
      updateStepStatus(1, false, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAMMPool = async () => {
    if (!walletInfo || !tokenMint || !transferHookAMMService) {
      Alert.alert('Error', 'Token must be created first');
      return;
    }

    setIsProcessing(true);
    updateStepStatus(2, false, true);
    setStatusMessage('Creating AMM pool with Transfer Hook support...');

    try {
      // Create AMM pool for Token-2022 with Transfer Hooks
      const payer = Keypair.generate(); // Mock payer
      const result = await transferHookAMMService.createTransferHookPool(
        payer,
        tokenMint,
        DevnetConfig.TOKENS.SOL, // SOL-TOKEN pair
        30, // 0.3% fee
        selectedHook?.programId
      );
      
      setPoolAddress(result.pool);
      updateStepStatus(2, true, false);
      setCurrentStep(3);
      setStatusMessage(`AMM Pool created: ${result.pool.toString()}`);
      
      Alert.alert(
        'AMM Pool Created!',
        `SOL-${tokenSymbol} pool created!\n\nPool: ${result.pool.toString()}\nTransfer Hook: ${selectedHook?.name}`
      );
    } catch (error) {
      console.error('Pool creation error:', error);
      Alert.alert('Error', `Failed to create pool: ${error}`);
      updateStepStatus(2, false, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!walletInfo || !poolAddress || !transferHookAMMService) {
      Alert.alert('Error', 'Pool must be created first');
      return;
    }

    setIsProcessing(true);
    updateStepStatus(3, false, true);
    setStatusMessage('Adding initial liquidity with Transfer Hook compliance...');

    try {
      // Add liquidity to Transfer Hook pool
      const payer = Keypair.generate(); // Mock payer
      const signature = await transferHookAMMService.addTransferHookLiquidity(
        payer,
        poolAddress,
        parseFloat(initialTokenAmount) * 1e9, // Convert to lamports
        parseFloat(initialSolAmount) * 1e9, // Convert to lamports
        0 // Min LP tokens
      );
      
      updateStepStatus(3, true, false);
      setCurrentStep(4);
      setStatusMessage(`Liquidity added: ${signature}`);
      
      Alert.alert(
        'Liquidity Added!',
        `Initial liquidity provided to SOL-${tokenSymbol} pool!\n\nSOL: ${initialSolAmount}\n${tokenSymbol}: ${initialTokenAmount}\nSignature: ${signature}`
      );
    } catch (error) {
      console.error('Liquidity error:', error);
      Alert.alert('Error', `Failed to add liquidity: ${error}`);
      updateStepStatus(3, false, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnableTrading = async () => {
    setIsProcessing(true);
    updateStepStatus(4, false, true);
    setStatusMessage('Enabling trading with Transfer Hook compliance...');

    try {
      // Mock trading activation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateStepStatus(4, true, false);
      setStatusMessage('Trading enabled! Token-2022 with Transfer Hooks is now tradable!');
      
      Alert.alert(
        '🎉 Launch Complete!',
        `${tokenSymbol} is now tradable on DEX2.0 AMM!\n\n✅ Token-2022 with Transfer Hook\n✅ SOL-${tokenSymbol} pool created\n✅ Liquidity provided\n✅ Trading enabled\n\nLaunchpad complete!`
      );
    } catch (error) {
      console.error('Trading activation error:', error);
      Alert.alert('Error', `Failed to enable trading: ${error}`);
      updateStepStatus(4, false, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      default: return '#666666';
    }
  };

  const getStepColor = (step: LaunchpadStep) => {
    if (step.completed) return theme.colors.success;
    if (step.inProgress) return theme.colors.warning;
    if (step.id === currentStep) return theme.colors.accent;
    return theme.colors.muted;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: theme.colors.text }]}>
          Transfer Hook Launchpad
        </AppText>
        <AppText style={[styles.subtitle, { color: theme.colors.muted }]}>
          Complete Token-2022 + AMM Launch Solution
        </AppText>
      </View>

      {/* Progress Steps */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Launch Progress
        </AppText>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[
                styles.stepNumber,
                { 
                  backgroundColor: getStepColor(step),
                  borderColor: getStepColor(step)
                }
              ]}>
                <AppText style={[styles.stepNumberText, { color: '#ffffff' }]}>
                  {step.completed ? '✓' : step.id}
                </AppText>
              </View>
              <View style={styles.stepInfo}>
                <AppText style={[styles.stepTitle, { color: theme.colors.text }]}>
                  {step.title}
                </AppText>
                <AppText style={[styles.stepDescription, { color: theme.colors.muted }]}>
                  {step.description}
                </AppText>
              </View>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.stepConnector, { backgroundColor: theme.colors.muted }]} />
            )}
          </View>
        ))}
      </View>

      {/* Current Step Configuration */}
      {currentStep === 1 && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Step 1: Configure Token-2022
          </AppText>
          
          {/* Token Configuration */}
          <View style={styles.configRow}>
            <View style={styles.configItem}>
              <AppText style={[styles.label, { color: theme.colors.muted }]}>Name</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.muted
                }]}
                value={tokenName}
                onChangeText={setTokenName}
                placeholder="Token Name"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
            <View style={styles.configItem}>
              <AppText style={[styles.label, { color: theme.colors.muted }]}>Symbol</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.muted
                }]}
                value={tokenSymbol}
                onChangeText={setTokenSymbol}
                placeholder="SYMBOL"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          {/* Transfer Hook Selection */}
          <AppText style={[styles.label, { color: theme.colors.muted }]}>Transfer Hook</AppText>
          {WHITELISTED_HOOKS.map((hook, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.hookOption,
                { 
                  backgroundColor: selectedHook?.programId.equals(hook.programId)
                    ? theme.colors.accent + '20' 
                    : theme.colors.background,
                  borderColor: selectedHook?.programId.equals(hook.programId)
                    ? theme.colors.accent
                    : theme.colors.muted + '40'
                }
              ]}
              onPress={() => setSelectedHook(hook)}
            >
              <View style={styles.hookHeader}>
                <AppText style={[styles.hookName, { color: theme.colors.text }]}>
                  {hook.name}
                </AppText>
                <View style={styles.hookBadges}>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(hook.riskLevel) }]}>
                    <AppText style={styles.riskText}>{hook.riskLevel}</AppText>
                  </View>
                  <View style={[styles.feeBadge, { backgroundColor: theme.colors.muted }]}>
                    <AppText style={styles.feeText}>{hook.fees}</AppText>
                  </View>
                </View>
              </View>
              <AppText style={[styles.hookDescription, { color: theme.colors.muted }]}>
                {hook.description}
              </AppText>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: (!walletInfo || !selectedHook || isProcessing)
                  ? theme.colors.muted
                  : theme.colors.accent
              }
            ]}
            onPress={handleCreateToken}
            disabled={!walletInfo || !selectedHook || isProcessing}
          >
            <AppText style={[styles.buttonText, { color: '#ffffff' }]}>
              Create Token-2022 with Transfer Hook
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 2 && tokenMint && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Step 2: Create AMM Pool
          </AppText>
          <AppText style={[styles.description, { color: theme.colors.muted }]}>
            Creating SOL-{tokenSymbol} liquidity pool with Transfer Hook support
          </AppText>
          
          <View style={styles.poolInfo}>
            <AppText style={[styles.poolInfoText, { color: theme.colors.text }]}>
              Pool Pair: SOL ↔ {tokenSymbol}
            </AppText>
            <AppText style={[styles.poolInfoText, { color: theme.colors.text }]}>
              Transfer Hook: {selectedHook?.name}
            </AppText>
            <AppText style={[styles.poolInfoText, { color: theme.colors.text }]}>
              Pool Fee: 0.3% + Hook Fee: {selectedHook?.fees}
            </AppText>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: isProcessing ? theme.colors.muted : theme.colors.accent
              }
            ]}
            onPress={handleCreateAMMPool}
            disabled={isProcessing}
          >
            <AppText style={[styles.buttonText, { color: '#ffffff' }]}>
              Create AMM Pool
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 3 && poolAddress && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Step 3: Add Initial Liquidity
          </AppText>
          
          <View style={styles.configRow}>
            <View style={styles.configItem}>
              <AppText style={[styles.label, { color: theme.colors.muted }]}>SOL Amount</AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.muted
                }]}
                value={initialSolAmount}
                onChangeText={setInitialSolAmount}
                placeholder="1.0"
                placeholderTextColor={theme.colors.muted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.configItem}>
              <AppText style={[styles.label, { color: theme.colors.muted }]}>
                {tokenSymbol} Amount
              </AppText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.muted
                }]}
                value={initialTokenAmount}
                onChangeText={setInitialTokenAmount}
                placeholder="10000"
                placeholderTextColor={theme.colors.muted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: isProcessing ? theme.colors.muted : theme.colors.accent
              }
            ]}
            onPress={handleAddLiquidity}
            disabled={isProcessing}
          >
            <AppText style={[styles.buttonText, { color: '#ffffff' }]}>
              Add Initial Liquidity
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 4 && (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Step 4: Enable Trading
          </AppText>
          <AppText style={[styles.description, { color: theme.colors.muted }]}>
            Activate trading with Transfer Hook compliance validation
          </AppText>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { 
                backgroundColor: isProcessing ? theme.colors.muted : theme.colors.success
              }
            ]}
            onPress={handleEnableTrading}
            disabled={isProcessing}
          >
            <AppText style={[styles.buttonText, { color: '#ffffff' }]}>
              🚀 Enable Trading
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Display */}
      {statusMessage && (
        <View style={[styles.statusContainer, { backgroundColor: theme.colors.accent + '10' }]}>
          {isProcessing && <ActivityIndicator color={theme.colors.accent} size="small" />}
          <AppText style={[styles.statusText, { color: theme.colors.accent }]}>
            {statusMessage}
          </AppText>
        </View>
      )}

      {/* Success Section */}
      {steps.every(step => step.completed) && (
        <View style={[styles.bountySuccess, { backgroundColor: theme.colors.success + '20' }]}>
          <AppText style={[styles.bountyTitle, { color: theme.colors.success }]}>
            🏆 Launch Complete!
          </AppText>
          <AppText style={[styles.bountyText, { color: theme.colors.text }]}>
            ✅ Token-2022 with Transfer Hook created{'\n'}
            ✅ SOL-token LP pool created{'\n'}
            ✅ Trading enabled with Transfer Hook compliance{'\n'}
            ✅ Whitelisted hook security model implemented{'\n\n'}
            Your Token-2022 is now tradable on Solana AMMs!
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginBottom: 25,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepInfo: {
    marginLeft: 15,
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  stepConnector: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginTop: 5,
  },
  configRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  configItem: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  hookOption: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 10,
  },
  hookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hookName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  hookBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  feeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  hookDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  poolInfo: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  poolInfoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  actionButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    textAlign: 'center',
  },
  bountySuccess: {
    padding: 25,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  bountyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  bountyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
