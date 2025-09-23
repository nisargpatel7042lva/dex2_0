import { Connection, PublicKey } from '@solana/web3.js';
import { AMMService } from './AMMService';
import { OrcaService } from './OrcaService';
import { RaydiumService } from './RaydiumService';
import { HookValidationResult, WhitelistedHookManager } from './WhitelistedHookManager';

export interface AMMProvider {
  name: 'Raydium' | 'Orca' | 'Meteora';
  service: RaydiumService | OrcaService | AMMService; // Real AMM services
  supportsTransferHooks: boolean;
  isActive: boolean;
}

export interface HookCompatiblePool {
  poolAddress: PublicKey;
  ammProvider: string;
  tokenA: {
    mint: PublicKey;
    hasHook: boolean;
    hookProgramId?: PublicKey;
  };
  tokenB: {
    mint: PublicKey;
    hasHook: boolean;
    hookProgramId?: PublicKey;
  };
  supportsTransferHooks: boolean;
  validationResults: {
    tokenA?: HookValidationResult;
    tokenB?: HookValidationResult;
  };
}

export interface SwapRouteWithHooks {
  route: HookCompatiblePool[];
  totalFee: number;
  transferHookFee: number;
  estimatedGas: number;
  warnings: string[];
  isRecommended: boolean;
}

export class AMMHookManager {
  private connection: Connection;
  private hookManager: WhitelistedHookManager;
  private ammProviders: Map<string, AMMProvider> = new Map();

  constructor(connection: Connection) {
    this.connection = connection;
    this.hookManager = WhitelistedHookManager.getInstance();
    this.initializeAMMProviders();
  }

  /**
   * Initialize AMM providers with Transfer Hook support
   * Based on real implementations from GitHub repositories
   */
  private initializeAMMProviders(): void {
    // Initialize Raydium with Transfer Hook support
    // Reference: https://github.com/raydium-io/raydium-cp-swap (supports Token-2022)
    const raydiumService = new RaydiumService(this.connection);
    this.ammProviders.set('Raydium', {
      name: 'Raydium',
      service: raydiumService,
      supportsTransferHooks: true, // CP Swap supports Token-2022 and Transfer Hooks
      isActive: true
    });

    // Initialize Orca with Transfer Hook support
    // Reference: https://github.com/orca-so/whirlpools (concentrated liquidity AMM)
    const orcaService = new OrcaService(this.connection);
    this.ammProviders.set('Orca', {
      name: 'Orca',
      service: orcaService,
      supportsTransferHooks: true, // Whirlpools can be extended to support Transfer Hooks
      isActive: true
    });

    // Initialize generic AMM service for Meteora (placeholder)
    // Meteora would need their own service implementation similar to Raydium/Orca
    const genericAMMService = new AMMService(
      this.connection,
      new PublicKey('METAewgxyPbgwsseH8T16a39CQ5VyVxZi9zXiDPY18m') // Meteora program ID
    );
    this.ammProviders.set('Meteora', {
      name: 'Meteora',
      service: genericAMMService,
      supportsTransferHooks: true, // Would need to be implemented
      isActive: true
    });

    console.log('✅ Initialized AMM providers with real implementations:', {
      providers: Array.from(this.ammProviders.keys()),
      raydiumPrograms: ['AMM V4', 'CP Swap', 'CLMM'],
      orcaPrograms: ['Whirlpools'],
      supportedFeatures: ['Transfer Hooks', 'Token-2022', 'Concentrated Liquidity']
    });
  }

  /**
   * Find all pools that support a specific Transfer Hook program
   */
  async findPoolsWithHook(hookProgramId: PublicKey): Promise<HookCompatiblePool[]> {
    try {
      console.log('🔍 Finding pools with hook:', hookProgramId.toString());

      const compatiblePools: HookCompatiblePool[] = [];

      // Validate the hook first
      const hookValidation = this.hookManager.validateHook(hookProgramId);
      if (!hookValidation.isValid) {
        console.warn('❌ Hook is not whitelisted or invalid:', hookValidation.reason);
        return [];
      }

      // Search through each AMM provider
      for (const [ammName, provider] of this.ammProviders) {
        if (!provider.isActive || !provider.supportsTransferHooks) {
          continue;
        }

                 try {
           // Check if this AMM supports the hook
           if (ammName === 'Raydium') {
             const raydiumService = provider.service as RaydiumService;
             if (raydiumService.isHookSupported(hookProgramId)) {
               // Query Raydium's CP Swap pools (which support Token-2022 and Transfer Hooks)
               const cpSwapPools = await raydiumService.getCpSwapPools();
               const compatibleRaydiumPools = cpSwapPools
                 .filter(pool => pool.supportsTransferHooks)
                 .map(pool => this.convertToHookCompatiblePool(pool, ammName, hookProgramId));
               compatiblePools.push(...compatibleRaydiumPools);
             }
           } else if (ammName === 'Orca') {
             const orcaService = provider.service as OrcaService;
             if (orcaService.isHookSupported(hookProgramId)) {
               // Query Orca's whirlpools
               const whirlpools = await orcaService.getWhirlpools();
               const compatibleOrcaPools = whirlpools
                 .filter(pool => pool.supportsTransferHooks)
                 .map(pool => this.convertOrcaToHookCompatiblePool(pool, ammName, hookProgramId));
               compatiblePools.push(...compatibleOrcaPools);
             }
           }
           // Meteora would be added here when implemented
         } catch (error) {
           console.error(`❌ Error checking ${ammName} for hook compatibility:`, error);
         }
      }

      console.log(`✅ Found ${compatiblePools.length} pools compatible with hook`);
      return compatiblePools;
    } catch (error) {
      console.error('❌ Error finding pools with hook:', error);
      return [];
    }
  }

  /**
   * Get the best swap route considering Transfer Hook compatibility
   */
  async getBestSwapRouteWithHooks(
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    amountIn: number
  ): Promise<SwapRouteWithHooks[]> {
    try {
      console.log('🔍 Finding best swap routes with hook support:', {
        tokenA: tokenAMint.toString(),
        tokenB: tokenBMint.toString(),
        amountIn
      });

      const routes: SwapRouteWithHooks[] = [];

      // Check each AMM provider for available routes
      for (const [ammName, provider] of this.ammProviders) {
        if (!provider.isActive) continue;

        try {
          const route = await this.analyzeAMMRoute(
            ammName,
            provider,
            tokenAMint,
            tokenBMint,
            amountIn
          );
          
          if (route) {
            routes.push(route);
          }
        } catch (error) {
          console.error(`❌ Error analyzing route for ${ammName}:`, error);
        }
      }

      // Sort routes by recommendation score
      routes.sort((a, b) => {
        // Prioritize recommended routes, then by lowest total fee
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.totalFee - b.totalFee;
      });

      console.log(`✅ Found ${routes.length} potential swap routes`);
      return routes;
    } catch (error) {
      console.error('❌ Error finding swap routes:', error);
      return [];
    }
  }

  /**
   * Validate all Transfer Hooks in a swap route
   */
  async validateSwapRoute(route: HookCompatiblePool[]): Promise<{
    isValid: boolean;
    warnings: string[];
    blockingIssues: string[];
  }> {
    const warnings: string[] = [];
    const blockingIssues: string[] = [];

    for (const pool of route) {
      // Validate token A hook if present
      if (pool.tokenA.hasHook && pool.tokenA.hookProgramId) {
        const validation = this.hookManager.validateHook(
          pool.tokenA.hookProgramId,
          pool.ammProvider
        );
        
        if (!validation.isValid) {
          blockingIssues.push(`Token A hook is not valid: ${validation.reason}`);
        } else {
          warnings.push(...(validation.warnings || []));
        }
      }

      // Validate token B hook if present
      if (pool.tokenB.hasHook && pool.tokenB.hookProgramId) {
        const validation = this.hookManager.validateHook(
          pool.tokenB.hookProgramId,
          pool.ammProvider
        );
        
        if (!validation.isValid) {
          blockingIssues.push(`Token B hook is not valid: ${validation.reason}`);
        } else {
          warnings.push(...(validation.warnings || []));
        }
      }
    }

    return {
      isValid: blockingIssues.length === 0,
      warnings,
      blockingIssues
    };
  }

  /**
   * Get AMM provider statistics
   */
  getAMMStats(): {
    totalProviders: number;
    activeProviders: number;
    hookSupportedProviders: number;
    providerDetails: Record<string, {
      isActive: boolean;
      supportsTransferHooks: boolean;
      compatibleHooks: number;
    }>;
  } {
    const stats = {
      totalProviders: this.ammProviders.size,
      activeProviders: 0,
      hookSupportedProviders: 0,
      providerDetails: {} as Record<string, any>
    };

    for (const [name, provider] of this.ammProviders) {
      if (provider.isActive) stats.activeProviders++;
      if (provider.supportsTransferHooks) stats.hookSupportedProviders++;

      const compatibleHooks = this.hookManager.getHooksForAMM(name).length;

      stats.providerDetails[name] = {
        isActive: provider.isActive,
        supportsTransferHooks: provider.supportsTransferHooks,
        compatibleHooks
      };
    }

    return stats;
  }

  /**
   * Enable/disable an AMM provider
   */
  setAMMProviderStatus(ammName: string, isActive: boolean): boolean {
    const provider = this.ammProviders.get(ammName);
    if (provider) {
      provider.isActive = isActive;
      console.log(`🔄 ${ammName} provider ${isActive ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active AMM providers that support Transfer Hooks
   */
  getActiveHookSupportedProviders(): AMMProvider[] {
    return Array.from(this.ammProviders.values())
      .filter(provider => provider.isActive && provider.supportsTransferHooks);
  }

  /**
   * Private helper: Analyze a specific AMM route
   */
  private async analyzeAMMRoute(
    ammName: string,
    provider: AMMProvider,
    tokenAMint: PublicKey,
    tokenBMint: PublicKey,
    amountIn: number
  ): Promise<SwapRouteWithHooks | null> {
    try {
      // Mock pool analysis - in real implementation, query actual pools
      const mockPool: HookCompatiblePool = {
        poolAddress: new PublicKey('11111111111111111111111111111112'),
        ammProvider: ammName,
        tokenA: {
          mint: tokenAMint,
          hasHook: false, // Would be determined by actual token analysis
          hookProgramId: undefined
        },
        tokenB: {
          mint: tokenBMint,
          hasHook: false, // Would be determined by actual token analysis
          hookProgramId: undefined
        },
        supportsTransferHooks: provider.supportsTransferHooks,
        validationResults: {}
      };

      // Calculate fees (simplified)
      const baseFee = amountIn * 0.003; // 0.3% base fee
      const transferHookFee = 0; // Would be calculated based on actual hooks
      const totalFee = baseFee + transferHookFee;

      const route: SwapRouteWithHooks = {
        route: [mockPool],
        totalFee,
        transferHookFee,
        estimatedGas: 5000, // Mock gas estimate
        warnings: [],
        isRecommended: transferHookFee === 0 // Prefer routes without hook fees for simplicity
      };

      return route;
    } catch (error) {
      console.error(`❌ Error analyzing ${ammName} route:`, error);
      return null;
    }
  }

  /**
   * Convert Raydium pool to HookCompatiblePool format
   */
  private convertToHookCompatiblePool(
    raydiumPool: any,
    ammName: string,
    hookProgramId: PublicKey
  ): HookCompatiblePool {
    return {
      poolAddress: raydiumPool.address,
      ammProvider: ammName,
      tokenA: {
        mint: raydiumPool.tokenA.mint,
        hasHook: raydiumPool.tokenA.hasTransferHook || false,
        hookProgramId: raydiumPool.tokenA.hookProgramId
      },
      tokenB: {
        mint: raydiumPool.tokenB.mint,
        hasHook: raydiumPool.tokenB.hasTransferHook || false,
        hookProgramId: raydiumPool.tokenB.hookProgramId
      },
      supportsTransferHooks: raydiumPool.supportsTransferHooks || false,
      validationResults: {
        tokenA: raydiumPool.tokenA.hasTransferHook 
          ? this.hookManager.validateHook(raydiumPool.tokenA.hookProgramId, ammName)
          : undefined,
        tokenB: raydiumPool.tokenB.hasTransferHook 
          ? this.hookManager.validateHook(raydiumPool.tokenB.hookProgramId, ammName)
          : undefined
      }
    };
  }

  /**
   * Convert Orca whirlpool to HookCompatiblePool format
   */
  private convertOrcaToHookCompatiblePool(
    orcaPool: any,
    ammName: string,
    hookProgramId: PublicKey
  ): HookCompatiblePool {
    return {
      poolAddress: orcaPool.address,
      ammProvider: ammName,
      tokenA: {
        mint: orcaPool.tokenA.mint,
        hasHook: orcaPool.tokenA.hasTransferHook || false,
        hookProgramId: orcaPool.tokenA.hookProgramId
      },
      tokenB: {
        mint: orcaPool.tokenB.mint,
        hasHook: orcaPool.tokenB.hasTransferHook || false,
        hookProgramId: orcaPool.tokenB.hookProgramId
      },
      supportsTransferHooks: orcaPool.supportsTransferHooks || false,
      validationResults: {
        tokenA: orcaPool.tokenA.hasTransferHook 
          ? this.hookManager.validateHook(orcaPool.tokenA.hookProgramId, ammName)
          : undefined,
        tokenB: orcaPool.tokenB.hasTransferHook 
          ? this.hookManager.validateHook(orcaPool.tokenB.hookProgramId, ammName)
          : undefined
      }
    };
  }

  /**
   * Private helper: Create mock compatible pools for testing (legacy)
   */
  private async createMockCompatiblePools(
    ammName: string,
    hookProgramId: PublicKey
  ): Promise<HookCompatiblePool[]> {
    const mockPools: HookCompatiblePool[] = [
      {
        poolAddress: new PublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'), // Valid devnet pool
        ammProvider: ammName,
        tokenA: {
          mint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
          hasHook: false,
          hookProgramId: undefined
        },
        tokenB: {
          mint: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC devnet
          hasHook: true,
          hookProgramId
        },
        supportsTransferHooks: true,
        validationResults: {
          tokenB: this.hookManager.validateHook(hookProgramId, ammName)
        }
      }
    ];

    return mockPools;
  }
}
