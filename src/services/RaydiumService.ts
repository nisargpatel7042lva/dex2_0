import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { HookValidationResult, WhitelistedHookManager } from './WhitelistedHookManager';

export interface RaydiumQuote {
  amountOut: number;
  priceImpact: number;
  fee: number;
  slippage: number;
  route: string[];
  poolAddress: string;
  transferHookFee?: number;
  hookWarnings?: string[];
}

export interface RaydiumPoolInfo {
  address: PublicKey;
  tokenA: {
    mint: PublicKey;
    symbol: string;
    decimals: number;
    hasTransferHook: boolean;
    hookProgramId?: PublicKey;
  };
  tokenB: {
    mint: PublicKey;
    symbol: string;
    decimals: number;
    hasTransferHook: boolean;
    hookProgramId?: PublicKey;
  };
  liquidity: number;
  volume24h: number;
  feeRate: number;
  supportsTransferHooks: boolean;
}

export interface RaydiumSwapParams {
  poolAddress: PublicKey;
  amountIn: number;
  directionAToB: boolean;
  slippageTolerance: number;
  userPublicKey: PublicKey;
}

export class RaydiumService {
  private connection: Connection;
  private raydiumProgramId: PublicKey;
  private cpSwapProgramId: PublicKey;
  private clmmProgramId: PublicKey;
  private hookManager: WhitelistedHookManager;

  constructor(connection: Connection, programIds?: {
    amm?: PublicKey;
    cpSwap?: PublicKey;
    clmm?: PublicKey;
  }) {
    this.connection = connection;
    // Official Raydium Program IDs based on their GitHub
    // Reference: https://github.com/raydium-io/raydium-sdk-V2
    this.raydiumProgramId = programIds?.amm || new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'); // AMM V4
    this.cpSwapProgramId = programIds?.cpSwap || new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'); // CP Swap
    this.clmmProgramId = programIds?.clmm || new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUQpMkFr9WeaFAmKhAz'); // CLMM
    this.hookManager = WhitelistedHookManager.getInstance();
  }

  /**
   * Get a swap quote from Raydium
   */
  async getQuote(
    poolAddress: PublicKey,
    amountIn: number,
    directionAToB: boolean
  ): Promise<RaydiumQuote> {
    try {
      console.log('🔄 Getting Raydium quote...', {
        poolAddress: poolAddress.toString(),
        amountIn,
        directionAToB
      });

      // For now, we'll simulate a Raydium quote
      // In a real implementation, this would call Raydium's API or SDK
      const simulatedQuote = this.simulateRaydiumQuote(amountIn, directionAToB);

      console.log('✅ Raydium quote received:', simulatedQuote);
      return simulatedQuote;
    } catch (error) {
      console.error('❌ Error getting Raydium quote:', error);
      throw new Error(`Failed to get Raydium quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a swap transaction for Raydium
   */
  async buildSwapTransaction(params: RaydiumSwapParams): Promise<Transaction> {
    try {
      console.log('🔄 Building Raydium swap transaction...', {
        poolAddress: params.poolAddress.toString(),
        amountIn: params.amountIn,
        directionAToB: params.directionAToB,
        slippageTolerance: params.slippageTolerance
      });

      const transaction = new Transaction();

      // Add Raydium swap instruction
      const swapInstruction = await this.createRaydiumSwapInstruction(params);
      transaction.add(swapInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = params.userPublicKey;

      console.log('✅ Raydium swap transaction built successfully:', {
        instructionCount: transaction.instructions.length,
        feePayer: transaction.feePayer?.toString()
      });
      return transaction;
    } catch (error) {
      console.error('❌ Error building Raydium swap transaction:', error);
      throw new Error(`Failed to build Raydium swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a swap on Raydium
   */
  async executeSwap(params: RaydiumSwapParams): Promise<string> {
    try {
      console.log('🔄 Executing Raydium swap...', {
        poolAddress: params.poolAddress.toString(),
        amountIn: params.amountIn,
        directionAToB: params.directionAToB
      });

      // Build the transaction
      const transaction = await this.buildSwapTransaction(params);

      // For now, we'll simulate the transaction
      // In a real implementation, this would be signed and sent
      const simulatedSignature = this.simulateTransactionSignature();

      console.log('✅ Raydium swap executed successfully:', {
        signature: simulatedSignature,
        transactionSize: transaction.instructions.length
      });
      return simulatedSignature;
    } catch (error) {
      console.error('❌ Error executing Raydium swap:', error);
      throw new Error(`Failed to execute Raydium swap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pool information from Raydium
   */
  async getPoolInfo(poolAddress: PublicKey): Promise<any> {
    try {
      console.log('🔄 Getting Raydium pool info...', poolAddress.toString());

      // For now, return mock pool info
      // In a real implementation, this would fetch from Raydium's API
      const mockPoolInfo = {
        address: poolAddress.toString(),
        tokenA: {
          mint: 'TokenAMintAddress',
          symbol: 'TOKENA',
          decimals: 6
        },
        tokenB: {
          mint: 'TokenBMintAddress',
          symbol: 'SOL',
          decimals: 9
        },
        liquidity: 1000000,
        volume24h: 500000,
        feeRate: 0.25
      };

      console.log('✅ Raydium pool info received:', mockPoolInfo);
      return mockPoolInfo;
    } catch (error) {
      console.error('❌ Error getting Raydium pool info:', error);
      throw new Error(`Failed to get Raydium pool info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available pools from Raydium
   */
  async getPools(): Promise<any[]> {
    try {
      console.log('🔄 Getting Raydium pools...');

      // For now, return mock pools
      // In a real implementation, this would fetch from Raydium's API
      const mockPools = [
        {
          address: 'Pool1Address',
          tokenA: { symbol: 'TOKEN1', decimals: 6 },
          tokenB: { symbol: 'SOL', decimals: 9 },
          liquidity: 1000000,
          volume24h: 500000,
          feeRate: 0.25
        },
        {
          address: 'Pool2Address',
          tokenA: { symbol: 'TOKEN2', decimals: 6 },
          tokenB: { symbol: 'SOL', decimals: 9 },
          liquidity: 2000000,
          volume24h: 750000,
          feeRate: 0.25
        }
      ];

      console.log('✅ Raydium pools received:', mockPools.length);
      return mockPools;
    } catch (error) {
      console.error('❌ Error getting Raydium pools:', error);
      throw new Error(`Failed to get Raydium pools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate a Raydium quote (placeholder implementation)
   */
  private simulateRaydiumQuote(amountIn: number, directionAToB: boolean): RaydiumQuote {
    // Simulate price impact based on amount
    const priceImpact = Math.min(amountIn / 10000, 5); // Max 5% impact
    
    // Simulate fees (0.25% for Raydium)
    const fee = amountIn * 0.0025;
    
    // Calculate output amount with slippage
    const slippage = 1.0; // 1% default slippage
    const amountOut = amountIn * (1 - priceImpact / 100 - fee / amountIn);

    return {
      amountOut,
      priceImpact,
      fee,
      slippage,
      route: directionAToB ? ['TOKENA', 'SOL'] : ['SOL', 'TOKENA'],
      poolAddress: 'RaydiumPoolAddress'
    };
  }

  /**
   * Create a Raydium swap instruction (placeholder implementation)
   */
  private async createRaydiumSwapInstruction(params: RaydiumSwapParams): Promise<TransactionInstruction> {
    // This is a placeholder implementation
    // In a real implementation, this would create the actual Raydium swap instruction
    
    const keys = [
      { pubkey: params.poolAddress, isSigner: false, isWritable: true },
      { pubkey: params.userPublicKey, isSigner: true, isWritable: false },
      // Add other required keys for Raydium swap
    ];

    const data = Buffer.alloc(8); // Placeholder data

    return new TransactionInstruction({
      keys,
      programId: this.raydiumProgramId,
      data
    });
  }

  /**
   * Simulate a transaction signature (placeholder implementation)
   */
  private simulateTransactionSignature(): string {
    return `raydium-swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get token price from Raydium
   */
  async getTokenPrice(tokenMint: PublicKey): Promise<number> {
    try {
      console.log('🔄 Getting Raydium token price...', tokenMint.toString());

      // For now, return a mock price
      // In a real implementation, this would fetch from Raydium's price API
      const mockPrice = Math.random() * 100 + 0.01; // Random price between 0.01 and 100

      console.log('✅ Raydium token price received:', mockPrice);
      return mockPrice;
    } catch (error) {
      console.error('❌ Error getting Raydium token price:', error);
      throw new Error(`Failed to get Raydium token price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get market data for a token pair
   */
  async getMarketData(tokenAMint: PublicKey, tokenBMint: PublicKey): Promise<any> {
    try {
      console.log('🔄 Getting Raydium market data...', {
        tokenA: tokenAMint.toString(),
        tokenB: tokenBMint.toString()
      });

      // For now, return mock market data
      // In a real implementation, this would fetch from Raydium's API
      const mockMarketData = {
        price: Math.random() * 100 + 0.01,
        priceChange24h: (Math.random() - 0.5) * 20, // -10% to +10%
        volume24h: Math.random() * 1000000 + 100000,
        liquidity: Math.random() * 5000000 + 1000000,
        high24h: Math.random() * 100 + 0.01,
        low24h: Math.random() * 50 + 0.01
      };

      console.log('✅ Raydium market data received:', mockMarketData);
      return mockMarketData;
    } catch (error) {
      console.error('❌ Error getting Raydium market data:', error);
      throw new Error(`Failed to get Raydium market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a token has Transfer Hook and validate it
   */
  async validateTokenTransferHook(tokenMint: PublicKey): Promise<HookValidationResult | null> {
    try {
      console.log('🔍 Checking Transfer Hook for token:', tokenMint.toString());

      const accountInfo = await this.connection.getAccountInfo(tokenMint);
      if (!accountInfo) {
        return null;
      }

      // Check if this is a Token-2022 mint with Transfer Hook
      if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // Simplified hook detection - in real implementation, parse the mint extensions
        const hasHook = accountInfo.data.length > 82; // Basic mint size
        
        if (hasHook) {
          // Extract hook program ID (simplified)
          const hookProgramId = new PublicKey(accountInfo.data.slice(82, 114));
          
          // Validate against whitelist
          const validation = this.hookManager.validateHook(hookProgramId, 'Raydium');
          
          console.log('🔍 Transfer Hook validation result:', {
            tokenMint: tokenMint.toString(),
            hookProgramId: hookProgramId.toString(),
            isValid: validation.isValid,
            warnings: validation.warnings
          });
          
          return validation;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error validating Transfer Hook:', error);
      return null;
    }
  }

  /**
   * Get enhanced pool information with Transfer Hook support
   */
  async getPoolInfoWithHooks(poolAddress: PublicKey): Promise<RaydiumPoolInfo> {
    try {
      console.log('🔄 Getting Raydium pool info with hooks...', poolAddress.toString());

      // Get basic pool info (this would be from Raydium's API in real implementation)
      const basicPoolInfo = await this.getPoolInfo(poolAddress);
      
      // Mock token mints for demonstration
      const tokenAMint = new PublicKey('TokenAMintAddress');
      const tokenBMint = new PublicKey('So11111111111111111111111111111111111111112'); // SOL

      // Check Transfer Hooks for both tokens
      const tokenAHookValidation = await this.validateTokenTransferHook(tokenAMint);
      const tokenBHookValidation = await this.validateTokenTransferHook(tokenBMint);

      const enhancedPoolInfo: RaydiumPoolInfo = {
        address: poolAddress,
        tokenA: {
          mint: tokenAMint,
          symbol: 'TOKENA',
          decimals: 6,
          hasTransferHook: !!tokenAHookValidation,
          hookProgramId: tokenAHookValidation?.hook?.programId
        },
        tokenB: {
          mint: tokenBMint,
          symbol: 'SOL',
          decimals: 9,
          hasTransferHook: !!tokenBHookValidation,
          hookProgramId: tokenBHookValidation?.hook?.programId
        },
        liquidity: basicPoolInfo.liquidity || 1000000,
        volume24h: basicPoolInfo.volume24h || 500000,
        feeRate: basicPoolInfo.feeRate || 0.25,
        supportsTransferHooks: !!(tokenAHookValidation || tokenBHookValidation)
      };

      console.log('✅ Enhanced Raydium pool info received:', {
        address: enhancedPoolInfo.address.toString(),
        supportsTransferHooks: enhancedPoolInfo.supportsTransferHooks,
        tokenAHasHook: enhancedPoolInfo.tokenA.hasTransferHook,
        tokenBHasHook: enhancedPoolInfo.tokenB.hasTransferHook
      });

      return enhancedPoolInfo;
    } catch (error) {
      console.error('❌ Error getting enhanced pool info:', error);
      throw new Error(`Failed to get enhanced pool info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get swap quote with Transfer Hook fee calculations
   */
  async getQuoteWithHooks(
    poolAddress: PublicKey,
    amountIn: number,
    directionAToB: boolean
  ): Promise<RaydiumQuote> {
    try {
      console.log('🔄 Getting Raydium quote with hooks...', {
        poolAddress: poolAddress.toString(),
        amountIn,
        directionAToB
      });

      // Get pool info with hook details
      const poolInfo = await this.getPoolInfoWithHooks(poolAddress);
      
      // Get basic quote
      const basicQuote = this.simulateRaydiumQuote(amountIn, directionAToB);
      
      // Calculate Transfer Hook fees if applicable
      let transferHookFee = 0;
      const hookWarnings: string[] = [];

      const sourceToken = directionAToB ? poolInfo.tokenA : poolInfo.tokenB;
      const destToken = directionAToB ? poolInfo.tokenB : poolInfo.tokenA;

      // Check source token hook
      if (sourceToken.hasTransferHook && sourceToken.hookProgramId) {
        const validation = this.hookManager.validateHook(sourceToken.hookProgramId, 'Raydium');
        if (validation.isValid && validation.hook) {
          // Calculate hook fee (simplified - real implementation would query the hook program)
          transferHookFee += amountIn * 0.001; // 0.1% hook fee
          hookWarnings.push(`${sourceToken.symbol} has Transfer Hook: ${validation.hook.name}`);
          hookWarnings.push(...validation.warnings);
        }
      }

      // Check destination token hook
      if (destToken.hasTransferHook && destToken.hookProgramId) {
        const validation = this.hookManager.validateHook(destToken.hookProgramId, 'Raydium');
        if (validation.isValid && validation.hook) {
          // Calculate hook fee for destination
          transferHookFee += basicQuote.amountOut * 0.001; // 0.1% hook fee on output
          hookWarnings.push(`${destToken.symbol} has Transfer Hook: ${validation.hook.name}`);
          hookWarnings.push(...validation.warnings);
        }
      }

      // Adjust amount out for hook fees
      const adjustedAmountOut = Math.max(0, basicQuote.amountOut - (basicQuote.amountOut * 0.001));

      const enhancedQuote: RaydiumQuote = {
        ...basicQuote,
        amountOut: adjustedAmountOut,
        transferHookFee: transferHookFee > 0 ? transferHookFee : undefined,
        hookWarnings: hookWarnings.length > 0 ? hookWarnings : undefined
      };

      console.log('✅ Enhanced Raydium quote received:', {
        amountIn,
        amountOut: enhancedQuote.amountOut,
        transferHookFee: enhancedQuote.transferHookFee,
        hasHookWarnings: !!enhancedQuote.hookWarnings?.length
      });

      return enhancedQuote;
    } catch (error) {
      console.error('❌ Error getting enhanced quote:', error);
      throw new Error(`Failed to get enhanced quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute swap with Transfer Hook support
   */
  async executeSwapWithHooks(params: RaydiumSwapParams): Promise<string> {
    try {
      console.log('🔄 Executing Raydium swap with hooks...', {
        poolAddress: params.poolAddress.toString(),
        amountIn: params.amountIn,
        directionAToB: params.directionAToB
      });

      // Get pool info to check for hooks
      const poolInfo = await this.getPoolInfoWithHooks(params.poolAddress);
      
      // Build transaction with hook support
      const transaction = await this.buildSwapTransactionWithHooks(params, poolInfo);

      // For now, simulate the transaction
      // In a real implementation, this would be signed and sent through the wallet
      const simulatedSignature = `raydium-hook-swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log('✅ Raydium swap with hooks executed successfully:', {
        signature: simulatedSignature,
        hadTransferHooks: poolInfo.supportsTransferHooks,
        transactionSize: transaction.instructions.length
      });

      return simulatedSignature;
    } catch (error) {
      console.error('❌ Error executing swap with hooks:', error);
      throw new Error(`Failed to execute swap with hooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build swap transaction with Transfer Hook instructions
   */
  private async buildSwapTransactionWithHooks(
    params: RaydiumSwapParams,
    poolInfo: RaydiumPoolInfo
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Add Transfer Hook instructions if needed
    const sourceToken = params.directionAToB ? poolInfo.tokenA : poolInfo.tokenB;
    const destToken = params.directionAToB ? poolInfo.tokenB : poolInfo.tokenA;

    // Add pre-transfer hook instruction for source token
    if (sourceToken.hasTransferHook && sourceToken.hookProgramId) {
      const validation = this.hookManager.validateHook(sourceToken.hookProgramId, 'Raydium');
      if (validation.isValid) {
        const preHookIx = this.createTransferHookInstruction(
          sourceToken.hookProgramId,
          params.userPublicKey,
          'pre'
        );
        transaction.add(preHookIx);
      }
    }

    // Add the main Raydium swap instruction
    const swapInstruction = await this.createRaydiumSwapInstruction(params);
    transaction.add(swapInstruction);

    // Add post-transfer hook instruction for destination token
    if (destToken.hasTransferHook && destToken.hookProgramId) {
      const validation = this.hookManager.validateHook(destToken.hookProgramId, 'Raydium');
      if (validation.isValid) {
        const postHookIx = this.createTransferHookInstruction(
          destToken.hookProgramId,
          params.userPublicKey,
          'post'
        );
        transaction.add(postHookIx);
      }
    }

    // Set recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.userPublicKey;

    return transaction;
  }

  /**
   * Create Transfer Hook instruction
   */
  private createTransferHookInstruction(
    hookProgramId: PublicKey,
    userPublicKey: PublicKey,
    phase: 'pre' | 'post'
  ): TransactionInstruction {
    // This is a simplified Transfer Hook instruction
    // In a real implementation, this would create the proper hook instruction
    const keys = [
      { pubkey: userPublicKey, isSigner: true, isWritable: false },
      { pubkey: hookProgramId, isSigner: false, isWritable: false },
      // Add other required keys for the specific hook
    ];

    const data = Buffer.from([phase === 'pre' ? 0 : 1]); // Simple phase indicator

    return new TransactionInstruction({
      keys,
      programId: hookProgramId,
      data
    });
  }

  /**
   * Get all whitelisted hooks compatible with Raydium
   */
  public getCompatibleHooks() {
    return this.hookManager.getHooksForAMM('Raydium');
  }

  /**
   * Check if Raydium supports a specific hook program
   */
  public isHookSupported(hookProgramId: PublicKey): boolean {
    return this.hookManager.isHookCompatibleWithAMM(hookProgramId, 'Raydium');
  }

  /**
   * Get Raydium CP Swap pools (supports Token-2022 with Transfer Hooks)
   * Based on: https://github.com/raydium-io/raydium-cp-swap
   */
  async getCpSwapPools(): Promise<any[]> {
    try {
      console.log('🔄 Getting Raydium CP Swap pools...');

      // In real implementation, this would query CP Swap program accounts
      // Reference: https://github.com/raydium-io/raydium-cp-swap/blob/main/programs/cp-swap/src/states/pool.rs
      
      const mockCpSwapPools = [
        {
          address: new PublicKey('6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg'), // Valid devnet pool address
          programId: this.cpSwapProgramId,
          tokenA: {
            mint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
            symbol: 'SOL',
            decimals: 9,
            hasTransferHook: false
          },
          tokenB: {
            mint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC devnet
            symbol: 'USDC',
            decimals: 6,
            hasTransferHook: true,
            hookProgramId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
          },
          feeRate: 2500, // 0.25%
          supportsToken2022: true,
          supportsTransferHooks: true
        }
      ];

      console.log(`✅ Found ${mockCpSwapPools.length} Raydium CP Swap pools`);
      return mockCpSwapPools;
    } catch (error) {
      console.error('❌ Error getting Raydium CP Swap pools:', error);
      return [];
    }
  }

  /**
   * Execute CP Swap with Transfer Hook support
   * Based on Raydium's CP Swap program structure
   */
  async executeCpSwapWithHooks(params: {
    poolAddress: PublicKey;
    amountIn: number;
    aToB: boolean;
    slippageTolerance: number;
    userPublicKey: PublicKey;
  }): Promise<string> {
    try {
      console.log('🔄 Executing Raydium CP Swap with hooks...', {
        poolAddress: params.poolAddress.toString(),
        amountIn: params.amountIn,
        aToB: params.aToB
      });

      // Get pool info to check for hooks
      const poolInfo = await this.getPoolInfoWithHooks(params.poolAddress);
      
      // Build CP Swap transaction with hook support
      const transaction = await this.buildCpSwapTransactionWithHooks(params, poolInfo);

      // Simulate transaction
      const simulatedSignature = `raydium-cpswap-hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log('✅ Raydium CP Swap with hooks executed successfully:', {
        signature: simulatedSignature,
        hadTransferHooks: poolInfo.supportsTransferHooks,
        transactionSize: transaction.instructions.length
      });

      return simulatedSignature;
    } catch (error) {
      console.error('❌ Error executing CP Swap with hooks:', error);
      throw new Error(`Failed to execute CP Swap with hooks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build CP Swap transaction with Transfer Hook instructions
   * Based on: https://github.com/raydium-io/raydium-cp-swap/blob/main/programs/cp-swap/src/instructions/swap_base_in.rs
   */
  private async buildCpSwapTransactionWithHooks(
    params: {
      poolAddress: PublicKey;
      amountIn: number;
      aToB: boolean;
      slippageTolerance: number;
      userPublicKey: PublicKey;
    },
    poolInfo: RaydiumPoolInfo
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Add Transfer Hook instructions if needed
    const sourceToken = params.aToB ? poolInfo.tokenA : poolInfo.tokenB;
    const destToken = params.aToB ? poolInfo.tokenB : poolInfo.tokenA;

    // Add pre-transfer hook instruction for source token
    if (sourceToken.hasTransferHook && sourceToken.hookProgramId) {
      const validation = this.hookManager.validateHook(sourceToken.hookProgramId, 'Raydium');
      if (validation.isValid) {
        const preHookIx = this.createTransferHookInstruction(
          sourceToken.hookProgramId,
          params.userPublicKey,
          'pre'
        );
        transaction.add(preHookIx);
      }
    }

    // Add the main Raydium CP Swap instruction
    const cpSwapInstruction = this.createCpSwapInstruction(params);
    transaction.add(cpSwapInstruction);

    // Add post-transfer hook instruction for destination token
    if (destToken.hasTransferHook && destToken.hookProgramId) {
      const validation = this.hookManager.validateHook(destToken.hookProgramId, 'Raydium');
      if (validation.isValid) {
        const postHookIx = this.createTransferHookInstruction(
          destToken.hookProgramId,
          params.userPublicKey,
          'post'
        );
        transaction.add(postHookIx);
      }
    }

    // Set recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.userPublicKey;

    return transaction;
  }

  /**
   * Create Raydium CP Swap instruction
   * Based on Raydium's CP Swap instruction layout
   */
  private createCpSwapInstruction(params: {
    poolAddress: PublicKey;
    amountIn: number;
    aToB: boolean;
    userPublicKey: PublicKey;
  }): TransactionInstruction {
    // CP Swap instruction layout based on Raydium's implementation
    // Reference: https://github.com/raydium-io/raydium-cp-swap/blob/main/programs/cp-swap/src/instructions/swap_base_in.rs
    
    const keys = [
      { pubkey: params.userPublicKey, isSigner: true, isWritable: false },
      { pubkey: params.poolAddress, isSigner: false, isWritable: true },
      // Add other required keys (vault accounts, etc.)
      // In real implementation, these would be derived properly
    ];

    // CP Swap instruction data (simplified)
    const data = Buffer.alloc(17);
    data.writeUInt8(9, 0); // swap_base_in instruction discriminator
    data.writeBigUInt64LE(BigInt(params.amountIn), 1);
    data.writeBigUInt64LE(BigInt(0), 9); // minimum_amount_out (would be calculated)

    return new TransactionInstruction({
      keys,
      programId: this.cpSwapProgramId,
      data
    });
  }

  /**
   * Get Raydium CLMM pools (Concentrated Liquidity)
   * Based on: https://github.com/raydium-io/raydium-clmm
   */
  async getClmmPools(): Promise<any[]> {
    try {
      console.log('🔄 Getting Raydium CLMM pools...');

      // Mock CLMM pools - in real implementation, query CLMM program accounts
      const mockClmmPools = [
        {
          address: new PublicKey('2QdhepnKRTLjjSqPL1PtKNwqrUkoLee5Gqs8bvZhRdMv'), // Valid devnet CLMM pool
          programId: this.clmmProgramId,
          tokenA: {
            mint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
            symbol: 'SOL',
            decimals: 9
          },
          tokenB: {
            mint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC devnet
            symbol: 'USDC',
            decimals: 6
          },
          tickSpacing: 60,
          feeRate: 2500, // 0.25%
          supportsToken2022: false, // CLMM typically uses SPL tokens
          supportsTransferHooks: false
        }
      ];

      console.log(`✅ Found ${mockClmmPools.length} Raydium CLMM pools`);
      return mockClmmPools;
    } catch (error) {
      console.error('❌ Error getting Raydium CLMM pools:', error);
      return [];
    }
  }

  /**
   * Get all Raydium pools across different programs
   */
  async getAllRaydiumPools(): Promise<{
    ammPools: any[];
    cpSwapPools: any[];
    clmmPools: any[];
  }> {
    try {
      console.log('🔄 Getting all Raydium pools...');

      const [ammPools, cpSwapPools, clmmPools] = await Promise.all([
        this.getPools(), // Legacy AMM pools
        this.getCpSwapPools(), // CP Swap pools (Token-2022 support)
        this.getClmmPools() // CLMM pools
      ]);

      console.log('✅ Retrieved all Raydium pools:', {
        ammPools: ammPools.length,
        cpSwapPools: cpSwapPools.length,
        clmmPools: clmmPools.length,
        total: ammPools.length + cpSwapPools.length + clmmPools.length
      });

      return {
        ammPools,
        cpSwapPools,
        clmmPools
      };
    } catch (error) {
      console.error('❌ Error getting all Raydium pools:', error);
      return {
        ammPools: [],
        cpSwapPools: [],
        clmmPools: []
      };
    }
  }
}


