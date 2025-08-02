
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
  routePlan: any[];
  contextSlot: number;
  timeTaken: number;
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

  constructor() {
    // Use the new lite-api.jup.ag endpoint for free usage
    this.baseUrl = 'https://lite-api.jup.ag';
  }

  /**
   * Get swap quote using Jupiter v1 API
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50,
    feeBps?: number,
    onlyDirectRoutes?: boolean,
    asLegacyTransaction?: boolean
  ): Promise<JupiterQuote> {
    try {
      console.log('Getting Jupiter quote:', {
        inputMint,
        outputMint,
        amount,
        slippageBps
      });

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippageBps.toString(),
        ...(feeBps && { feeBps: feeBps.toString() }),
        ...(onlyDirectRoutes && { onlyDirectRoutes: onlyDirectRoutes.toString() }),
        ...(asLegacyTransaction && { asLegacyTransaction: asLegacyTransaction.toString() })
      });

      const response = await fetch(`${this.baseUrl}/swap/v1/quote?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter API error:', response.status, errorText);
        throw new Error(`Jupiter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Jupiter quote received:', data);
      return data;
    } catch (error) {
      console.error('Error getting Jupiter quote:', error);
      throw error;
    }
  }

  /**
   * Get swap transaction using Jupiter v1 API
   */
  async getSwapTransaction(
    quoteResponse: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true
  ): Promise<string> {
    try {
      console.log('Getting Jupiter swap transaction for:', userPublicKey);

      const requestBody: JupiterSwapRequest = {
        quoteResponse,
        userPublicKey,
        wrapUnwrapSOL,
      };

      const response = await fetch(`${this.baseUrl}/swap/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter swap API error:', response.status, errorText);
        throw new Error(`Jupiter swap API error: ${response.status} - ${errorText}`);
      }

      const data: JupiterSwapResponse = await response.json();
      console.log('Jupiter swap transaction received');
      return data.swapTransaction;
    } catch (error) {
      console.error('Error getting Jupiter swap transaction:', error);
      throw error;
    }
  }

  /**
   * Execute swap using Jupiter v1 API
   */
  async executeSwap(
    quoteResponse: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true
  ): Promise<string> {
    try {
      console.log('Executing Jupiter swap for:', userPublicKey);

      // First get the swap transaction
      const swapTransaction = await this.getSwapTransaction(
        quoteResponse,
        userPublicKey,
        wrapUnwrapSOL
      );

      // The swap transaction is returned as a base64 encoded string
      // This would need to be signed and sent by the wallet
      console.log('Swap transaction ready for signing');
      return swapTransaction;
    } catch (error) {
      console.error('Error executing Jupiter swap:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens using Jupiter Token API v1
   */
  async getSupportedTokens(): Promise<any[]> {
    try {
      console.log('Getting supported tokens from Jupiter');

      const response = await fetch(`${this.baseUrl}/tokens/v1/mints/tradable`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter tokens API error:', response.status, errorText);
        throw new Error(`Jupiter tokens API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Supported tokens received:', data.length, 'tokens');
      return data;
    } catch (error) {
      console.error('Error getting supported tokens:', error);
      throw error;
    }
  }

  /**
   * Get token price using Jupiter Price API v2
   */
  async getTokenPrice(mint: string): Promise<number> {
    try {
      console.log('Getting token price for:', mint);

      const response = await fetch(`${this.baseUrl}/price/v2/price?ids=${mint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter price API error:', response.status, errorText);
        throw new Error(`Jupiter price API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token price received:', data);
      
      if (data.data && data.data[mint]) {
        return data.data[mint].price;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting token price:', error);
      return 0;
    }
  }

  /**
   * Get multiple token prices using Jupiter Price API v2
   */
  async getTokenPrices(mints: string[]): Promise<Record<string, number>> {
    try {
      console.log('Getting token prices for:', mints.length, 'tokens');

      const ids = mints.join(',');
      const response = await fetch(`${this.baseUrl}/price/v2/price?ids=${ids}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter price API error:', response.status, errorText);
        throw new Error(`Jupiter price API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token prices received:', data);
      
      const prices: Record<string, number> = {};
      if (data.data) {
        for (const mint of mints) {
          prices[mint] = data.data[mint]?.price || 0;
        }
      }
      
      return prices;
    } catch (error) {
      console.error('Error getting token prices:', error);
      return {};
    }
  }

  /**
   * Get token metadata using Jupiter Token API v1
   */
  async getTokenMetadata(mint: string): Promise<any> {
    try {
      console.log('Getting token metadata for:', mint);

      const response = await fetch(`${this.baseUrl}/tokens/v1/token/${mint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter token metadata API error:', response.status, errorText);
        throw new Error(`Jupiter token metadata API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token metadata received:', data);
      return data;
    } catch (error) {
      console.error('Error getting token metadata:', error);
      return null;
    }
  }

  /**
   * Get tokens by tag using Jupiter Token API v1
   */
  async getTokensByTag(tag: string): Promise<any[]> {
    try {
      console.log('Getting tokens by tag:', tag);

      const response = await fetch(`${this.baseUrl}/tokens/v1/tagged/${tag}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Jupiter tagged tokens API error:', response.status, errorText);
        throw new Error(`Jupiter tagged tokens API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Tagged tokens received:', data.length, 'tokens');
      return data;
    } catch (error) {
      console.error('Error getting tagged tokens:', error);
      return [];
    }
  }
} 