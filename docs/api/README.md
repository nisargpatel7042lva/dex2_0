# API Documentation

Welcome to the DEX Screener API documentation. This section covers all the service layers, external integrations, and API endpoints used in the application.

## 📚 API Overview

The DEX Screener application uses a layered service architecture with multiple APIs and integrations:

### Core Services
- **[Wallet Service](./wallet-service.md)** - Wallet management and blockchain interactions
- **[DEX Service](./dex-service.md)** - Decentralized exchange operations
- **[Token-2022 Service](./token-2022-service.md)** - Token-2022 program interactions
- **[AMM Service](./amm-service.md)** - Automated Market Maker functionality

### External Integrations
- **[Solana RPC](./solana-rpc.md)** - Solana blockchain interactions
- **[CoinGecko API](./coingecko-api.md)** - Market data and price feeds
- **[Jupiter API](./jupiter-api.md)** - DEX aggregation and routing

## 🏗️ Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Service Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Wallet Service │    │   DEX Service   │                │
│  │                 │    │                 │                │
│  │ • Connect       │    │ • Get Pools     │                │
│  │ • Disconnect    │    │ • Get Quotes    │                │
│  │ • Sign Tx       │    │ • Execute Swap  │                │
│  │ • Get Balance   │    │ • Add Liquidity │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Token-2022      │    │   AMM Service   │                │
│  │ Service         │    │                 │                │
│  │                 │    │ • Pool Creation │                │
│  │ • Create Mint   │    │ • Price Oracle  │                │
│  │ • Transfer Hook │    │ • Liquidity Mgmt│                │
│  │ • Confidential  │    │ • Fee Calculation│               │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Service Layer Design

### 1. Service Interface Pattern

All services follow a consistent interface pattern:

```typescript
interface BaseService {
  // Service initialization
  initialize(): Promise<void>;
  
  // Error handling
  handleError(error: Error): void;
  
  // Service cleanup
  cleanup(): Promise<void>;
}

interface WalletService extends BaseService {
  // Wallet operations
  connect(): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<SignedTx>;
  getBalance(): Promise<number>;
}

interface DEXService extends BaseService {
  // DEX operations
  getPools(): Promise<Pool[]>;
  getSwapQuote(params: QuoteParams): Promise<SwapQuote>;
  executeSwap(params: SwapParams): Promise<string>;
  addLiquidity(params: LiquidityParams): Promise<string>;
}
```

### 2. Error Handling

Consistent error handling across all services:

```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Error codes
enum ErrorCodes {
  WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS'
}
```

### 3. Response Types

Standardized response types for all API calls:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

## 🌐 External API Integration

### 1. Solana RPC Integration

```typescript
// RPC endpoint configuration
const RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  testnet: 'https://api.mainnet-beta.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
  local: 'http://localhost:8899'
};

// Connection management
class SolanaConnection {
  private connection: Connection;
  
  constructor(endpoint: string) {
    this.connection = new Connection(endpoint, 'confirmed');
  }
  
  async getAccountInfo(publicKey: PublicKey): Promise<AccountInfo<Buffer> | null> {
    return await this.connection.getAccountInfo(publicKey);
  }
  
  async sendTransaction(transaction: Transaction): Promise<string> {
    return await this.connection.sendTransaction(transaction);
  }
}
```

### 2. CoinGecko API Integration

```typescript
// Market data service
class MarketDataService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  
  async getTokenPrice(tokenId: string, currency: string = 'usd'): Promise<number> {
    const response = await fetch(
      `${this.baseUrl}/simple/price?ids=${tokenId}&vs_currencies=${currency}`
    );
    const data = await response.json();
    return data[tokenId][currency];
  }
  
  async getTokenMarketData(tokenId: string): Promise<TokenMarketData> {
    const response = await fetch(
      `${this.baseUrl}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    return await response.json();
  }
}
```

## 🔒 Security Considerations

### 1. API Security

```typescript
// Request validation
const validateApiRequest = (request: any): boolean => {
  // Validate required fields
  if (!request || typeof request !== 'object') return false;
  
  // Validate data types
  if (request.amount && typeof request.amount !== 'number') return false;
  if (request.address && typeof request.address !== 'string') return false;
  
  return true;
};

// Response sanitization
const sanitizeApiResponse = (response: any): any => {
  // Remove sensitive data
  const { privateKey, seed, ...sanitized } = response;
  return sanitized;
};
```

### 2. Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;
  
  constructor(limit: number = 100, window: number = 60000) {
    this.limit = limit;
    this.window = window;
  }
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.window);
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}
```

## 📊 Data Models

### 1. Core Data Types

```typescript
// Wallet types
interface WalletInfo {
  publicKey: string;
  balance: number;
  connected: boolean;
  network: 'devnet' | 'testnet' | 'mainnet';
}

// Token types
interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  price?: number;
  change24h?: number;
}

// Pool types
interface Pool {
  address: string;
  tokenA: Token;
  tokenB: Token;
  reservesA: number;
  reservesB: number;
  feeRate: number;
  totalLiquidity: number;
  volume24h: number;
}

// Swap types
interface SwapQuote {
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fee: number;
  slippage: number;
  route: string[];
}

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: number;
  slippage: number;
  recipient?: string;
}
```

### 2. Event Types

```typescript
// Transaction events
interface TransactionEvent {
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  type: 'swap' | 'transfer' | 'liquidity';
  details: any;
}

// Market events
interface MarketEvent {
  type: 'price_update' | 'volume_update' | 'liquidity_update';
  token: string;
  data: any;
  timestamp: number;
}
```

## 🧪 Testing APIs

### 1. Service Testing

```typescript
// Mock service for testing
class MockWalletService implements WalletService {
  async connect(): Promise<WalletInfo> {
    return {
      publicKey: 'mock-public-key',
      balance: 1000,
      connected: true,
      network: 'devnet'
    };
  }
  
  async disconnect(): Promise<void> {
    // Mock implementation
  }
  
  async signTransaction(transaction: Transaction): Promise<SignedTx> {
    // Mock implementation
    return transaction as SignedTx;
  }
  
  async getBalance(): Promise<number> {
    return 1000;
  }
}
```

### 2. API Testing

```typescript
// API endpoint testing
describe('Wallet API', () => {
  it('should connect wallet successfully', async () => {
    const walletService = new WalletService();
    const result = await walletService.connect();
    
    expect(result.connected).toBe(true);
    expect(result.publicKey).toBeDefined();
  });
  
  it('should handle connection errors', async () => {
    const walletService = new WalletService();
    
    // Mock network error
    jest.spyOn(walletService, 'connect').mockRejectedValue(
      new Error('Network error')
    );
    
    await expect(walletService.connect()).rejects.toThrow('Network error');
  });
});
```

## 📈 Performance Optimization

### 1. Caching Strategy

```typescript
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;
  
  constructor(ttl: number = 300000) { // 5 minutes default
    this.ttl = ttl;
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### 2. Request Batching

```typescript
class BatchRequestManager {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = requestFn();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}
```

## 🔮 Future API Enhancements

### 1. WebSocket Integration
- Real-time price updates
- Live transaction monitoring
- Instant notifications

### 2. GraphQL API
- Efficient data fetching
- Type-safe queries
- Reduced over-fetching

### 3. API Versioning
- Backward compatibility
- Feature flags
- Gradual migration

---

This API documentation provides a comprehensive overview of all service layers and integrations in the DEX Screener application. Each service has detailed documentation in its respective file. 