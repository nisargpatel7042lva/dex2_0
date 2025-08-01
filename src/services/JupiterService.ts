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
      console.log('Getting Jupiter quote:', { inputMint, outputMint, amount, slippageBps });
      
      const response = await fetch(`${this.baseUrl}/quote`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Build query parameters
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippageBps.toString(),
        onlyDirectRoutes: 'false',
        asLegacyTransaction: 'false',
      });

      const url = `${this.baseUrl}/quote?${params.toString()}`;
      console.log('Jupiter API URL:', url);

      const quoteResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error('Jupiter API error response:', errorText);
        throw new Error(`Jupiter API error: ${quoteResponse.status} - ${errorText}`);
      }

      const data = await quoteResponse.json();
      console.log('Jupiter quote response:', data);

      return {
        inputMint: data.inputMint,
        outputMint: data.outputMint,
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        otherAmountThreshold: data.otherAmountThreshold,
        swapMode: data.swapMode,
        slippageBps: data.slippageBps,
        platformFee: data.platformFee,
        priceImpactPct: data.priceImpactPct,
        routePlan: data.routePlan,
        contextSlot: data.contextSlot,
        timeTaken: data.timeTaken,
      };
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      throw error;
    }
  }

  /**
   * Get swap transaction from Jupiter
   */
  async getSwapTransaction(
    quoteResponse: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true
  ): Promise<string> {
    try {
      console.log('Getting swap transaction for user:', userPublicKey);
      
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapUnwrapSOL,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter swap API error response:', errorText);
        throw new Error(`Jupiter swap API error: ${response.status} - ${errorText}`);
      }

      const data: JupiterSwapResponse = await response.json();
      console.log('Jupiter swap transaction response:', data);
      
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

  /**
   * Test Jupiter API connectivity
   */
  async testAPI(): Promise<boolean> {
    try {
      console.log('Testing Jupiter API connectivity...');
      
      // Test with SOL to USDC quote
      const testQuote = await this.getQuote(
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        '1000000000', // 1 SOL in lamports
        50 // 0.5% slippage
      );
      
      console.log('Jupiter API test successful:', testQuote);
      return true;
    } catch (error) {
      console.error('Jupiter API test failed:', error);
      return false;
    }
  }
} 