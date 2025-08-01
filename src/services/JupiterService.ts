import { Transaction } from '@solana/web3.js';

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    feeBps: number;
    feeAccounts: Record<string, string>;
  };
  priceImpactPct: number;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

export interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

export interface SwapInfo {
  ammLabel: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface JupiterSwapRequest {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
}

export class JupiterService {
  private baseUrl: string;
  private testnetBaseUrl: string;

  constructor() {
    this.baseUrl = 'https://quote-api.jup.ag/v6';
    this.testnetBaseUrl = 'https://quote-api.jup.ag/v6'; // Jupiter uses same API for testnet
  }

  /**
   * Get swap quote from Jupiter
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<JupiterQuote> {
    try {
      const response = await fetch(`${this.baseUrl}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputMint,
          outputMint,
          amount,
          slippageBps,
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        inputMint: data.inputMint,
        outputMint: data.outputMint,
        amountIn: data.inAmount,
        amountOut: data.outAmount,
        priceImpact: data.priceImpactPct,
        fee: data.otherAmountThreshold,
        routes: data.routes,
        swapMode: data.swapMode,
      };
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      throw error;
    }
  }

  /**
   * Get swap transaction
   */
  async getSwapTransaction(
    quoteResponse: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true
  ): Promise<string> {
    const swapRequest: JupiterSwapRequest = {
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL,
    };

    try {
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapRequest),
      });

      if (!response.ok) {
        throw new Error(`Jupiter swap API error: ${response.status}`);
      }

      const data: JupiterSwapResponse = await response.json();
      return data.swapTransaction;
    } catch (error) {
      console.error('Error getting swap transaction:', error);
      throw error;
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(
    swapTransaction: string,
    wallet: any
  ): Promise<string> {
    try {
      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(swapTransaction, 'base64'));
      
      // Sign and send the transaction
      const signature = await wallet.sendTransaction(transaction);
      
      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens(): Promise<any[]> {
    try {
      const response = await fetch('https://token.jup.ag/all');
      if (!response.ok) {
        throw new Error(`Jupiter tokens API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      throw error;
    }
  }

  /**
   * Get token price
   */
  async getTokenPrice(mint: string): Promise<number> {
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
      if (!response.ok) {
        throw new Error(`Jupiter price API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data[mint]?.price || 0;
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  /**
   * Get multiple token prices
   */
  async getTokenPrices(mints: string[]): Promise<Record<string, number>> {
    try {
      const ids = mints.join(',');
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${ids}`);
      if (!response.ok) {
        throw new Error(`Jupiter price API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Error getting token prices:', error);
      return {};
    }
  }
} 