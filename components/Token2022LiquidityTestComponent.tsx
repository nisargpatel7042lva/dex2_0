/**
 * Testing Component for Token2022LiquidityService Integration
 * Use this component to test the service within your React Native app
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { PublicKey } from '@solana/web3.js';
import { useApp } from '../src/context/AppContext';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export const Token2022LiquidityTestComponent: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { 
    token2022LiquidityService, 
    walletInfo,
    servicesInitialized,
    getUserLiquidityPositions,
    getToken2022PoolInfo,
    increaseLiquidity,
    decreaseLiquidity,
    calculateOptimalLiquidity
  } = useApp();

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearResults();
    
    try {
      // Test 1: Services Initialization
      addTestResult({
        test: 'Services Initialization',
        status: 'pending',
        message: 'Checking if services are initialized...'
      });
      
      if (servicesInitialized && token2022LiquidityService) {
        addTestResult({
          test: 'Services Initialization',
          status: 'success',
          message: 'Services initialized successfully',
          details: { servicesInitialized, hasService: !!token2022LiquidityService }
        });
      } else {
        addTestResult({
          test: 'Services Initialization',
          status: 'error',
          message: 'Services not initialized',
          details: { servicesInitialized, hasService: !!token2022LiquidityService }
        });
      }

      // Test 2: Wallet Connection
      addTestResult({
        test: 'Wallet Connection',
        status: 'pending',
        message: 'Checking wallet connection...'
      });
      
      if (walletInfo) {
        addTestResult({
          test: 'Wallet Connection',
          status: 'success',
          message: 'Wallet connected successfully',
          details: { 
            publicKey: walletInfo.publicKey.toString(),
            balance: walletInfo.balance,
            isConnected: walletInfo.isConnected
          }
        });
      } else {
        addTestResult({
          test: 'Wallet Connection',
          status: 'error',
          message: 'Wallet not connected',
          details: { walletInfo: null }
        });
      }

      // Test 3: Calculate Optimal Liquidity
      addTestResult({
        test: 'Calculate Optimal Liquidity',
        status: 'pending',
        message: 'Testing liquidity calculation...'
      });
      
      try {
        const liquidityAmount = calculateOptimalLiquidity('1000', '2000', -1000, 1000, 0);
        addTestResult({
          test: 'Calculate Optimal Liquidity',
          status: 'success',
          message: 'Liquidity calculation successful',
          details: { 
            input: { amount0: '1000', amount1: '2000', tickLower: -1000, tickUpper: 1000, currentTick: 0 },
            result: liquidityAmount
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addTestResult({
          test: 'Calculate Optimal Liquidity',
          status: 'error',
          message: `Liquidity calculation failed: ${errorMessage}`,
          details: { error: errorMessage }
        });
      }

      // Test 4: Get User Liquidity Positions
      if (walletInfo) {
        addTestResult({
          test: 'Get User Liquidity Positions',
          status: 'pending',
          message: 'Fetching user positions...'
        });
        
        try {
          const positions = await getUserLiquidityPositions(walletInfo.publicKey);
          addTestResult({
            test: 'Get User Liquidity Positions',
            status: 'success',
            message: 'User positions fetched successfully',
            details: { 
              positionsCount: positions.length,
              positions: positions.slice(0, 3) // Show first 3 positions
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          addTestResult({
            test: 'Get User Liquidity Positions',
            status: 'error',
            message: `Failed to fetch positions: ${errorMessage}`,
            details: { error: errorMessage }
          });
        }
      }

      // Test 5: Get Pool Info
      addTestResult({
        test: 'Get Pool Info',
        status: 'pending',
        message: 'Testing pool info retrieval...'
      });
      
      try {
        const mockPoolAddress = new PublicKey('11111111111111111111111111111111');
        const poolInfo = await getToken2022PoolInfo(mockPoolAddress);
        addTestResult({
          test: 'Get Pool Info',
          status: 'success',
          message: 'Pool info retrieved successfully',
          details: { 
            poolAddress: mockPoolAddress.toString(),
            poolInfo: poolInfo
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addTestResult({
          test: 'Get Pool Info',
          status: 'error',
          message: `Failed to get pool info: ${errorMessage}`,
          details: { error: errorMessage }
        });
      }

      // Test 6: Transaction Building (Increase Liquidity)
      addTestResult({
        test: 'Increase Liquidity Transaction',
        status: 'pending',
        message: 'Testing increase liquidity transaction building...'
      });
      
      try {
        const mockParams = {
          position: {
            positionId: new PublicKey('11111111111111111111111111111111'),
            nftMint: new PublicKey('11111111111111111111111111111112'),
            poolId: new PublicKey('11111111111111111111111111111113'),
            tickLower: -1000,
            tickUpper: 1000,
            liquidity: '1000000'
          },
          liquidity: '1000000',
          amount0Max: '500000',
          amount1Max: '500000',
          baseFlag: true
        };
        
        const mockPoolConfig = {
          poolAddress: new PublicKey('11111111111111111111111111111113'),
          tokenMint0: new PublicKey('So11111111111111111111111111111111111111112'),
          tokenMint1: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          tokenVault0: new PublicKey('11111111111111111111111111111114'),
          tokenVault1: new PublicKey('11111111111111111111111111111115'),
          tickSpacing: 60,
          feeTier: 500
        };

        // Note: This will fail without real accounts, but tests the function signature
        await increaseLiquidity(mockParams, mockPoolConfig);
        
        addTestResult({
          test: 'Increase Liquidity Transaction',
          status: 'success',
          message: 'Transaction building method called successfully',
          details: { mockParams, mockPoolConfig }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addTestResult({
          test: 'Increase Liquidity Transaction',
          status: 'error',
          message: `Expected error (mock data): ${errorMessage}`,
          details: { error: errorMessage, note: 'This is expected with mock data' }
        });
      }

    } catch (globalError) {
      const errorMessage = globalError instanceof Error ? globalError.message : 'Unknown error';
      addTestResult({
        test: 'Global Test Runner',
        status: 'error',
        message: `Test runner failed: ${errorMessage}`,
        details: { error: errorMessage }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Token-2022 Liquidity Service Tests</Text>
        <Text style={styles.subtitle}>Test the integration and functionality</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.runButton, isRunning && styles.disabledButton]} 
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.resultsTitle}>Test Results ({testResults.length})</Text>
        
        {testResults.map((result, index) => (
          <View key={index} style={styles.testResult}>
            <View style={styles.testHeader}>
              <Text style={styles.testIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.testName}>{result.test}</Text>
            </View>
            
            <Text style={[styles.testMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
            
            {result.details && (
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => Alert.alert('Details', JSON.stringify(result.details, null, 2))}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {testResults.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No test results yet. Run the tests to see results.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  runButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#FF5722',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  testResult: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  testName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailsButton: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
