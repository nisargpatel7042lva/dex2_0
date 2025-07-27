import { Connection, PublicKey } from '@solana/web3.js';

export interface TokenMarketData {
  mint: PublicKey;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  fdv: number; // Fully diluted valuation
  liquidity: number;
  pairAddress: string;
  dexId: string;
  chainId: string;
  url: string;
  pairCreatedAt: number;
  liquidityUsd: number;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
  };
}

export interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

export interface SearchResult {
  pairs: PairData[];
  tokens: TokenMarketData[];
}

export class DEXService {
  private connection: Connection;
  private baseUrl = 'https://api.dexscreener.com/latest';

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async searchTokens(query: string): Promise<SearchResult> {
    try {
      // Mock data for demo - in real app, call DEX Screener API
      const mockTokens: TokenMarketData[] = [
        {
          mint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          symbol: 'DEX2',
          name: 'Dex2.0 Token',
          price: 0.25,
          priceChange24h: 0.012,
          priceChangePercent24h: 5.2,
          volume24h: 125000,
          marketCap: 2500000,
          circulatingSupply: 10000000,
          totalSupply: 10000000,
          fdv: 2500000,
          liquidity: 500000,
          pairAddress: 'DEX2SOLPair123456789',
          dexId: 'raydium',
          chainId: 'solana',
          url: 'https://raydium.io/swap/?inputCurrency=sol&outputCurrency=DEX2',
          pairCreatedAt: Date.now() - 86400000 * 30, // 30 days ago
          liquidityUsd: 500000,
          txns: {
            h24: { buys: 150, sells: 120 },
            h6: { buys: 45, sells: 38 },
            h1: { buys: 8, sells: 6 },
          },
          volume: {
            h24: 125000,
            h6: 35000,
            h1: 5000,
          },
          priceChange: {
            h24: 5.2,
            h6: 2.1,
            h1: 0.5,
          },
        },
        {
          mint: new PublicKey('So11111111111111111111111111111111111111112'),
          symbol: 'SOL',
          name: 'Solana',
          price: 100.50,
          priceChange24h: -2.30,
          priceChangePercent24h: -2.2,
          volume24h: 2500000,
          marketCap: 45000000000,
          circulatingSupply: 447000000,
          totalSupply: 533000000,
          fdv: 53600000000,
          liquidity: 15000000,
          pairAddress: 'SOLUSDCPair123456789',
          dexId: 'raydium',
          chainId: 'solana',
          url: 'https://raydium.io/swap/?inputCurrency=sol&outputCurrency=usdc',
          pairCreatedAt: Date.now() - 86400000 * 365, // 1 year ago
          liquidityUsd: 15000000,
          txns: {
            h24: { buys: 2500, sells: 2300 },
            h6: { buys: 750, sells: 680 },
            h1: { buys: 120, sells: 110 },
          },
          volume: {
            h24: 2500000,
            h6: 700000,
            h1: 100000,
          },
          priceChange: {
            h24: -2.2,
            h6: -1.1,
            h1: -0.3,
          },
        },
      ];

      const mockPairs: PairData[] = mockTokens.map(token => ({
        chainId: token.chainId,
        dexId: token.dexId,
        url: token.url,
        pairAddress: token.pairAddress,
        baseToken: {
          address: token.mint.toString(),
          name: token.name,
          symbol: token.symbol,
        },
        quoteToken: {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          name: 'USD Coin',
          symbol: 'USDC',
        },
        priceNative: (token.price / 100).toString(),
        priceUsd: token.price.toString(),
        txns: token.txns,
        volume: token.volume,
        priceChange: token.priceChange,
        liquidity: {
          usd: token.liquidityUsd,
          base: token.liquidity / token.price,
          quote: token.liquidity,
        },
        fdv: token.fdv,
        pairCreatedAt: token.pairCreatedAt,
      }));

      return {
        pairs: mockPairs.filter(pair => 
          pair.baseToken.symbol.toLowerCase().includes(query.toLowerCase()) ||
          pair.baseToken.name.toLowerCase().includes(query.toLowerCase())
        ),
        tokens: mockTokens.filter(token => 
          token.symbol.toLowerCase().includes(query.toLowerCase()) ||
          token.name.toLowerCase().includes(query.toLowerCase())
        ),
      };
    } catch (error) {
      console.error('Error searching tokens:', error);
      return { pairs: [], tokens: [] };
    }
  }

  async getTrendingTokens(): Promise<TokenMarketData[]> {
    try {
      // Mock trending tokens
      return [
        {
          mint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
          symbol: 'DEX2',
          name: 'Dex2.0 Token',
          price: 0.25,
          priceChange24h: 0.012,
          priceChangePercent24h: 5.2,
          volume24h: 125000,
          marketCap: 2500000,
          circulatingSupply: 10000000,
          totalSupply: 10000000,
          fdv: 2500000,
          liquidity: 500000,
          pairAddress: 'DEX2SOLPair123456789',
          dexId: 'raydium',
          chainId: 'solana',
          url: 'https://raydium.io/swap/?inputCurrency=sol&outputCurrency=DEX2',
          pairCreatedAt: Date.now() - 86400000 * 30,
          liquidityUsd: 500000,
          txns: {
            h24: { buys: 150, sells: 120 },
            h6: { buys: 45, sells: 38 },
            h1: { buys: 8, sells: 6 },
          },
          volume: {
            h24: 125000,
            h6: 35000,
            h1: 5000,
          },
          priceChange: {
            h24: 5.2,
            h6: 2.1,
            h1: 0.5,
          },
        },
        {
          mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          symbol: 'USDC',
          name: 'USD Coin',
          price: 1.00,
          priceChange24h: 0.0001,
          priceChangePercent24h: 0.01,
          volume24h: 5000000,
          marketCap: 45000000000,
          circulatingSupply: 45000000000,
          totalSupply: 45000000000,
          fdv: 45000000000,
          liquidity: 20000000,
          pairAddress: 'USDCSOLPair123456789',
          dexId: 'raydium',
          chainId: 'solana',
          url: 'https://raydium.io/swap/?inputCurrency=usdc&outputCurrency=sol',
          pairCreatedAt: Date.now() - 86400000 * 365,
          liquidityUsd: 20000000,
          txns: {
            h24: { buys: 5000, sells: 4800 },
            h6: { buys: 1500, sells: 1400 },
            h1: { buys: 250, sells: 240 },
          },
          volume: {
            h24: 5000000,
            h6: 1400000,
            h1: 200000,
          },
          priceChange: {
            h24: 0.01,
            h6: 0.005,
            h1: 0.001,
          },
        },
      ];
    } catch (error) {
      console.error('Error getting trending tokens:', error);
      return [];
    }
  }

  async getTokenPrice(mintAddress: string): Promise<number | null> {
    try {
      // Mock price data - in real app, fetch from API
      const mockPrices: { [key: string]: number } = {
        'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb': 0.25,
        'So11111111111111111111111111111111111111112': 100.50,
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.00,
      };

      return mockPrices[mintAddress] || null;
    } catch (error) {
      console.error('Error getting token price:', error);
      return null;
    }
  }

  async getTokenChartData(mintAddress: string, timeframe: string = '24h'): Promise<any[]> {
    try {
      // Mock chart data - in real app, fetch from API
      const now = Date.now();
      const data = [];
      
      for (let i = 0; i < 100; i++) {
        const time = now - (100 - i) * (24 * 60 * 60 * 1000) / 100;
        const price = 0.25 + Math.sin(i / 10) * 0.05 + Math.random() * 0.02;
        data.push({
          time,
          price,
          volume: Math.random() * 1000 + 500,
        });
      }

      return data;
    } catch (error) {
      console.error('Error getting chart data:', error);
      return [];
    }
  }

  async getDEXList(): Promise<string[]> {
    return ['raydium', 'orca', 'meteora', 'jupiter', 'serum'];
  }

  async getPairsByDEX(dexId: string): Promise<PairData[]> {
    try {
      // Mock pairs for specific DEX
      const mockPairs: PairData[] = [
        {
          chainId: 'solana',
          dexId,
          url: `https://${dexId}.io/swap`,
          pairAddress: `${dexId}Pair123456789`,
          baseToken: {
            address: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            name: 'Dex2.0 Token',
            symbol: 'DEX2',
          },
          quoteToken: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            name: 'USD Coin',
            symbol: 'USDC',
          },
          priceNative: '0.0025',
          priceUsd: '0.25',
          txns: {
            h24: { buys: 150, sells: 120 },
            h6: { buys: 45, sells: 38 },
            h1: { buys: 8, sells: 6 },
          },
          volume: {
            h24: 125000,
            h6: 35000,
            h1: 5000,
          },
          priceChange: {
            h24: 5.2,
            h6: 2.1,
            h1: 0.5,
          },
          liquidity: {
            usd: 500000,
            base: 2000000,
            quote: 500000,
          },
          fdv: 2500000,
          pairCreatedAt: Date.now() - 86400000 * 30,
        },
      ];

      return mockPairs;
    } catch (error) {
      console.error('Error getting pairs by DEX:', error);
      return [];
    }
  }
} 