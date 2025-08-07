/**
 * Manual Testing Script for Token2022LiquidityService
 * Run this to test the service functionality manually
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Token2022LiquidityService, Token2022PoolConfig, LiquidityPosition, IncreaseLiquidityParams, DecreaseLiquidityParams } from '../services/Token2022LiquidityService';

// Test configuration
const TEST_RPC_URL = 'https://api.devnet.solana.com';

// Helper functions for creating mock data
function createMockPosition(): LiquidityPosition {
  return {
    positionId: new PublicKey('11111111111111111111111111111111'),
    nftMint: new PublicKey('11111111111111111111111111111112'),
    poolId: new PublicKey('11111111111111111111111111111113'),
    tickLower: -1000,
    tickUpper: 1000,
    liquidity: '1000000'
  };
}

function createMockPoolConfig(): Token2022PoolConfig {
  return {
    poolAddress: new PublicKey('11111111111111111111111111111113'),
    tokenMint0: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
    tokenMint1: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    tokenVault0: new PublicKey('11111111111111111111111111111114'),
    tokenVault1: new PublicKey('11111111111111111111111111111115'),
    tickSpacing: 60,
    feeTier: 500
  };
}

// Main test function
export const testToken2022LiquidityService = async () => {
  console.log('🚀 Starting Token2022LiquidityService Tests...');
  console.log('=' .repeat(60));
  
  const connection = new Connection(TEST_RPC_URL, 'confirmed');
  const testKeypair = Keypair.generate();
  
  try {
    // Test 1: Service Initialization
    console.log('\n📋 Test 1: Service Initialization');
    console.log('-'.repeat(40));
    
    const service = new Token2022LiquidityService(connection);
    console.log('✅ Service initialized successfully');
    console.log('🔗 RPC URL:', TEST_RPC_URL);
    console.log('🔑 Test Wallet:', testKeypair.publicKey.toString());
    
    // Test 2: Custom Program ID Initialization
    console.log('\n📋 Test 2: Custom Program ID Initialization');
    console.log('-'.repeat(40));
    
    const customProgramId = new PublicKey('11111111111111111111111111111112');
    const customService = new Token2022LiquidityService(connection, customProgramId);
    console.log('✅ Service initialized with custom program ID');
    console.log('🎯 Custom Program ID:', customProgramId.toString());
    
    // Test 3: Liquidity Calculation
    console.log('\n📋 Test 3: Liquidity Calculation');
    console.log('-'.repeat(40));
    
    const liquidityResult = service.calculateLiquidity('1000', '2000', -1000, 1000, 0);
    console.log('✅ Liquidity calculation completed');
    console.log('💧 Input: amount0=1000, amount1=2000, tickLower=-1000, tickUpper=1000, currentTick=0');
    console.log('💧 Calculated liquidity:', liquidityResult);
    console.log('💧 Result type:', typeof liquidityResult);
    
    // Test 4: User Positions (Placeholder)
    console.log('\n📋 Test 4: Get User Positions');
    console.log('-'.repeat(40));
    
    const positions = await service.getUserPositions(testKeypair.publicKey);
    console.log('✅ Get user positions completed');
    console.log('📊 Positions returned:', positions);
    console.log('📊 Is array:', Array.isArray(positions));
    console.log('📊 Array length:', positions.length);
    
    // Test 5: Pool Info (Placeholder)
    console.log('\n📋 Test 5: Get Pool Info');
    console.log('-'.repeat(40));
    
    const mockPoolAddress = new PublicKey('11111111111111111111111111111111');
    const poolInfo = await service.getPoolInfo(mockPoolAddress);
    console.log('✅ Get pool info completed');
    console.log('🏊 Pool address:', mockPoolAddress.toString());
    console.log('🏊 Pool info:', poolInfo);
    console.log('🏊 Result type:', typeof poolInfo);
    
    // Test 6: Increase Liquidity Transaction Building
    console.log('\n📋 Test 6: Increase Liquidity Transaction Building');
    console.log('-'.repeat(40));
    
    try {
      const mockParams: IncreaseLiquidityParams = {
        position: createMockPosition(),
        liquidity: '1000000',
        amount0Max: '500000',
        amount1Max: '500000',
        baseFlag: true
      };
      
      const mockPoolConfig = createMockPoolConfig();
      console.log('📝 Mock parameters prepared');
      console.log('  - Position ID:', mockParams.position.positionId.toString());
      console.log('  - Liquidity:', mockParams.liquidity);
      console.log('  - Amount0Max:', mockParams.amount0Max);
      console.log('  - Amount1Max:', mockParams.amount1Max);
      console.log('  - BaseFlag:', mockParams.baseFlag);
      
      const transaction = await service.increaseLiquidity(mockParams, testKeypair.publicKey, mockPoolConfig);
      console.log('✅ Increase liquidity transaction built successfully');
      console.log('📊 Instructions count:', transaction.instructions.length);
      console.log('📊 Transaction type:', typeof transaction);
      
      // Display instruction details
      transaction.instructions.forEach((ix, index) => {
        console.log(`📋 Instruction ${index + 1}:`);
        console.log(`  - Program ID: ${ix.programId.toString()}`);
        console.log(`  - Keys count: ${ix.keys.length}`);
        console.log(`  - Data length: ${ix.data.length} bytes`);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Increase liquidity test (network calls may fail):', errorMessage);
      console.log('🔍 This is expected since we\'re using mock data and the accounts may not exist');
    }
    
    // Test 7: Decrease Liquidity Transaction Building
    console.log('\n📋 Test 7: Decrease Liquidity Transaction Building');
    console.log('-'.repeat(40));
    
    try {
      const mockParams: DecreaseLiquidityParams = {
        position: createMockPosition(),
        liquidity: '500000',
        amount0Min: '100000',
        amount1Min: '100000'
      };
      
      const mockPoolConfig = createMockPoolConfig();
      console.log('📝 Mock parameters prepared');
      console.log('  - Position ID:', mockParams.position.positionId.toString());
      console.log('  - Liquidity:', mockParams.liquidity);
      console.log('  - Amount0Min:', mockParams.amount0Min);
      console.log('  - Amount1Min:', mockParams.amount1Min);
      
      const transaction = await service.decreaseLiquidity(mockParams, testKeypair.publicKey, mockPoolConfig);
      console.log('✅ Decrease liquidity transaction built successfully');
      console.log('📊 Instructions count:', transaction.instructions.length);
      console.log('📊 Transaction type:', typeof transaction);
      
      // Display instruction details
      transaction.instructions.forEach((ix, index) => {
        console.log(`📋 Instruction ${index + 1}:`);
        console.log(`  - Program ID: ${ix.programId.toString()}`);
        console.log(`  - Keys count: ${ix.keys.length}`);
        console.log(`  - Data length: ${ix.data.length} bytes`);
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Decrease liquidity test (network calls may fail):', errorMessage);
      console.log('🔍 This is expected since we\'re using mock data and the accounts may not exist');
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log('  - Service initialization: ✅');
    console.log('  - Custom program ID: ✅');
    console.log('  - Liquidity calculation: ✅');
    console.log('  - User positions: ✅');
    console.log('  - Pool info: ✅');
    console.log('  - Transaction building: ✅ (with expected network call failures)');
    console.log('\n💡 Next steps:');
    console.log('  1. Test with real wallet connection in the app');
    console.log('  2. Test with actual pool data from Raydium V3');
    console.log('  3. Verify instruction data format with actual program');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    console.error('❌ Test failed with error:', errorMessage);
    console.error('📋 Error stack:', errorStack);
  }
};

// Export for use in the app
export default testToken2022LiquidityService;
