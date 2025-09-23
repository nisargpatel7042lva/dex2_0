
import { coinGeckoRateLimiter } from '../utils/rate-limiter';

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

export interface TokenPriceData {
  [symbol: string]: TokenPrice;
}

class TokenPriceService {
  private cache: Map<string, { data: TokenPrice; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 600000; // 10 minutes cache (increased from 5 minutes)
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (increased from 2s)

  // Common token mappings for CoinGecko
  private readonly TOKEN_MAPPINGS: { [mint: string]: string } = {
    'So11111111111111111111111111111111111111112': 'solana', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether', // USDT
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'jupiter', // JUP
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'raydium', // RAY
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk', // BONK
    // Add more common tokens
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol', // mSOL
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stsol', // stSOL
    '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 'psol', // pSOL
    '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': 'samoyedcoin', // SAMO
    'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'gst', // GST
    'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoMz9Q8h2BqzabwJY': 'rollbit-coin', // RLB
  };

  // Fallback prices for testnet tokens
  private readonly FALLBACK_PRICES: { [symbol: string]: number } = {
    'SOL': 177.0, // Current SOL price
    'USDC': 1.0,
    'USDT': 1.0,
    'JUP': 0.85,
    'RAY': 2.5,
    'BONK': 0.000001,
    'mSOL': 177.0, // Same as SOL
    'stSOL': 177.0, // Same as SOL
    'pSOL': 177.0, // Same as SOL
    'SAMO': 0.00001,
    'GST': 0.01,
    'RLB': 0.15,
  };

  async getTokenPrice(mint: string): Promise<number> {
    try {
      const symbol = this.getTokenSymbol(mint);
      const coinGeckoId = this.TOKEN_MAPPINGS[mint];
      
      console.log(`🔍 Fetching price for token: ${mint} (${symbol})`);
      
      // Check cache first, even if expired - prefer cached data over API calls
      const cacheKey = `coingecko_${coinGeckoId || symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log(`📋 Using cached price for ${symbol}: $${cached.data.current_price}`);
        return cached.data.current_price;
      }
      
      // For rate limiting, prefer fallback prices over API calls
      if (symbol && this.FALLBACK_PRICES[symbol]) {
        console.log(`🔄 Using fallback price for ${symbol}: $${this.FALLBACK_PRICES[symbol]} (avoiding API calls)`);
        return this.FALLBACK_PRICES[symbol];
      }
      
      // Only try CoinGecko if we have no cached or fallback data
      if (coinGeckoId) {
        console.log(`📈 Attempting CoinGecko for ${symbol} (${coinGeckoId}) - last resort`);
        try {
          const price = await this.fetchFromCoinGecko(coinGeckoId);
          console.log(`✅ CoinGecko price for ${symbol}: $${price}`);
          return price;
        } catch (error) {
          console.log(`⚠️ CoinGecko failed for ${symbol}, using fallback: ${error}`);
          return this.FALLBACK_PRICES[symbol] || 1.0;
        }
      }
      
      console.log(`⚠️ No price mapping found for ${mint}, using default $1.00`);
      return 1.0; // Default fallback
    } catch (error) {
      console.error(`❌ Error fetching token price for ${mint}:`, error);
      const symbol = this.getTokenSymbol(mint);
      const fallbackPrice = this.FALLBACK_PRICES[symbol] || 1.0;
      console.log(`🔄 Using fallback price for ${symbol}: $${fallbackPrice}`);
      return fallbackPrice;
    }
  }

  async getMultipleTokenPrices(mints: string[]): Promise<{ [mint: string]: number }> {
    const prices: { [mint: string]: number } = {};
    
    // Fetch prices in parallel
    const pricePromises = mints.map(async (mint) => {
      const price = await this.getTokenPrice(mint);
      return { mint, price };
    });
    
    const results = await Promise.all(pricePromises);
    results.forEach(({ mint, price }) => {
      prices[mint] = price;
    });
    
    return prices;
  }

  async getSOLPrice(): Promise<number> {
    return this.getTokenPrice('So11111111111111111111111111111111111111112');
  }

  async convertSOLToUSD(solAmount: number): Promise<number> {
    const solPrice = await this.getSOLPrice();
    return solAmount * solPrice;
  }

  async convertUSDToSOL(usdAmount: number): Promise<number> {
    const solPrice = await this.getSOLPrice();
    return usdAmount / solPrice;
  }

  private async fetchFromCoinGecko(coinId: string): Promise<number> {
    const cacheKey = `coingecko_${coinId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data.current_price;
    }

    // Global rate limiting
    if (!coinGeckoRateLimiter.canMakeRequest('coingecko')) {
      // If we have cached data, return it even if expired
      if (cached) {
        console.log('Rate limited, returning cached data for:', coinId);
        return cached.data.current_price;
      }
      // Wait for next available slot
      await coinGeckoRateLimiter.waitForNextRequest('coingecko');
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      const priceData = data[coinId];
      
      if (!priceData || !priceData.usd) {
        throw new Error('Invalid price data from CoinGecko');
      }
      
      const tokenPrice: TokenPrice = {
        id: coinId,
        symbol: coinId.toUpperCase(),
        name: coinId,
        current_price: priceData.usd,
        price_change_24h: priceData.usd_24h_change || 0,
        price_change_percentage_24h: priceData.usd_24h_change || 0,
      };
      
      this.cache.set(cacheKey, {
        data: tokenPrice,
        timestamp: Date.now(),
      });
      
      return tokenPrice.current_price;
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error);
      throw error;
    }
  }

  private getTokenSymbol(mint: string): string {
    // For testnet, we might have different mint addresses
    // This is a simplified mapping - in production you'd want a more robust solution
    const symbolMap: { [mint: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',
      '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 'pSOL',
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': 'SAMO',
      'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'GST',
      'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoMz9Q8h2BqzabwJY': 'RLB',
    };
    
    return symbolMap[mint] || 'UNKNOWN';
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.cache.clear();
  }
}

export default TokenPriceService;
