export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  tags?: string[];
}

export class TokenImageService {
  private tokenList: TokenMetadata[] = [];
  private tokenMap: Map<string, TokenMetadata> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize immediately, wait for first use
  }

  /**
   * Initialize token list from Jupiter (lazy loading)
   */
  private async initializeTokenList() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeTokenList();
    return this.initializationPromise;
  }

  private async _initializeTokenList() {
    try {
      console.log('Loading token list from Jupiter...');
      
      // Fetch token list from Jupiter
      const response = await fetch('https://token.jup.ag/all');
      if (response.ok) {
        const data = await response.json();
        this.tokenList = data.tokens || [];
        
        // Create a map for quick lookup
        this.tokenMap.clear();
        this.tokenList.forEach(token => {
          this.tokenMap.set(token.address.toLowerCase(), token);
        });
        
        console.log(`Loaded ${this.tokenList.length} tokens from Jupiter`);
      } else {
        console.log('Failed to load Jupiter token list, using fallback');
        this.loadFallbackTokenList();
      }
    } catch (error) {
      console.error('Error loading token list:', error);
      this.loadFallbackTokenList();
    }
    
    this.initialized = true;
  }

  /**
   * Load fallback token list for common tokens
   */
  private loadFallbackTokenList() {
    const fallbackTokens: TokenMetadata[] = [
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        decimals: 9,
        tags: ['native'],
      },
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        decimals: 6,
        tags: ['stablecoin'],
      },
      {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        decimals: 6,
        tags: ['stablecoin'],
      },
      {
        address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        symbol: 'JUP',
        name: 'Jupiter',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN/logo.png',
        decimals: 6,
        tags: ['defi'],
      },
      {
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        symbol: 'RAY',
        name: 'Raydium',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
        decimals: 6,
        tags: ['defi'],
      },
      {
        address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
        symbol: 'SRM',
        name: 'Serum',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt/logo.png',
        decimals: 6,
        tags: ['defi'],
      },
      {
        address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
        symbol: 'stSOL',
        name: 'Lido Staked SOL',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj/logo.png',
        decimals: 9,
        tags: ['defi'],
      },
      {
        address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        symbol: 'mSOL',
        name: 'Marinade Staked SOL',
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
        decimals: 9,
        tags: ['defi'],
      },
    ];

    this.tokenList = fallbackTokens;
    this.tokenMap.clear();
    fallbackTokens.forEach(token => {
      this.tokenMap.set(token.address.toLowerCase(), token);
    });
  }

  /**
   * Get token metadata by address
   */
  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    // Initialize if not already done
    if (!this.initialized) {
      await this.initializeTokenList();
    }

    const normalizedAddress = address.toLowerCase();
    return this.tokenMap.get(normalizedAddress) || null;
  }

  /**
   * Get token image URL
   */
  async getTokenImageUrl(address: string): Promise<string | null> {
    const metadata = await this.getTokenMetadata(address);
    return metadata?.logoURI || null;
  }

  /**
   * Get fallback icon for unknown tokens
   */
  getFallbackIcon(symbol: string): string {
    // Return appropriate Ionicons based on symbol
    const iconMap: { [key: string]: string } = {
      'SOL': 'logo-bitcoin',
      'USDC': 'card',
      'USDT': 'card',
      'JUP': 'planet',
      'RAY': 'flash',
      'SRM': 'medical',
      'stSOL': 'shield',
      'mSOL': 'shield',
    };

    return iconMap[symbol] || 'ellipse';
  }

  /**
   * Get token color for fallback icons
   */
  getTokenColor(symbol: string): string {
    const colorMap: { [key: string]: string } = {
      'SOL': '#9945FF',
      'USDC': '#2775CA',
      'USDT': '#26A17B',
      'JUP': '#FF6B35',
      'RAY': '#FF6B35',
      'SRM': '#00C896',
      'stSOL': '#9945FF',
      'mSOL': '#9945FF',
    };

    return colorMap[symbol] || '#6366f1';
  }

  /**
   * Get all known tokens
   */
  async getAllTokens(): Promise<TokenMetadata[]> {
    if (!this.initialized) {
      await this.initializeTokenList();
    }
    return this.tokenList;
  }

  /**
   * Search tokens by symbol or name
   */
  async searchTokens(query: string): Promise<TokenMetadata[]> {
    if (!this.initialized) {
      await this.initializeTokenList();
    }

    const lowerQuery = query.toLowerCase();
    return this.tokenList.filter(token => 
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery)
    );
  }
} 