# Development Guide

This guide provides comprehensive information for developers working on the DEX Screener project, including coding standards, best practices, and development workflow.

## 🎯 Development Philosophy

### Core Principles
- **Type Safety**: Full TypeScript implementation
- **Component Reusability**: Modular, composable components
- **Performance First**: Optimized for mobile performance
- **Security**: Secure by design
- **Accessibility**: Inclusive user experience
- **Testing**: Comprehensive test coverage

## 📋 Development Setup

### 1. Environment Requirements

```bash
# Node.js version
node --version  # Should be 18.x or higher

# Yarn version
yarn --version  # Should be 1.22.x or higher

# Expo CLI
expo --version  # Should be latest stable

# Rust (for smart contracts)
rustc --version  # Should be latest stable
```

### 2. IDE Configuration

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "rust-lang.rust-analyzer"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true
}
```

## 🏗️ Project Structure

### 1. Directory Organization

```
dex2_0/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── components/                   # Reusable components
│   ├── ui/                      # Basic UI components
│   ├── forms/                   # Form components
│   └── layout/                  # Layout components
├── src/
│   ├── context/                 # React Context
│   ├── services/                # Business logic
│   ├── hooks/                   # Custom hooks
│   ├── utils/                   # Utility functions
│   ├── types/                   # TypeScript types
│   └── constants/               # App constants
├── assets/                      # Static assets
├── docs/                        # Documentation
├── programs/                    # Smart contracts
└── __tests__/                   # Test files
```

### 2. File Naming Conventions

#### Components
```typescript
// PascalCase for components
UserProfile.tsx
WalletConnect.tsx
TokenCard.tsx

// Index files for component directories
components/ui/index.ts
```

#### Services
```typescript
// camelCase for services
walletService.ts
dexService.ts
token2022Service.ts
```

#### Utilities
```typescript
// camelCase for utilities
formatCurrency.ts
validateAddress.ts
calculateFees.ts
```

## 💻 Coding Standards

### 1. TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface WalletInfo {
  publicKey: string;
  balance: number;
  connected: boolean;
}

// Use types for unions and complex types
type TransactionStatus = 'pending' | 'confirmed' | 'failed';

// Use enums for constants
enum TokenStandard {
  SPL = 'spl',
  TOKEN_2022 = 'token-2022'
}
```

#### Function Signatures
```typescript
// Async functions should return Promise
async function connectWallet(): Promise<WalletInfo> {
  // Implementation
}

// Use proper parameter types
function formatAmount(amount: number, decimals: number = 9): string {
  return (amount / Math.pow(10, decimals)).toFixed(6);
}
```

### 2. React Component Standards

#### Functional Components
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/components/app-theme';

interface TokenCardProps {
  symbol: string;
  price: number;
  change24h: number;
  onPress?: () => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  symbol,
  price,
  change24h,
  onPress
}) => {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.symbol, { color: theme.colors.text }]}>
        {symbol}
      </Text>
      <Text style={[styles.price, { color: theme.colors.text }]}>
        ${price.toFixed(2)}
      </Text>
      <Text style={[
        styles.change,
        { color: change24h >= 0 ? theme.colors.success : theme.colors.error }
      ]}>
        {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
      </Text>
    </View>
  );
};
```

#### Custom Hooks
```typescript
import { useState, useEffect } from 'react';
import { useApp } from '@/src/context/AppContext';

export const useWalletBalance = () => {
  const { walletInfo } = useApp();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (walletInfo?.publicKey) {
      fetchBalance();
    }
  }, [walletInfo?.publicKey]);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      // Implementation
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, refetch: fetchBalance };
};
```

### 3. Styling Standards

#### StyleSheet Usage
```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
    opacity: 0.7,
  },
});
```

#### Theme Integration
```typescript
// Always use theme colors
const { theme } = useAppTheme();

<View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
  <Text style={[styles.text, { color: theme.colors.text }]}>
    Content
  </Text>
</View>
```

## 🔧 Development Workflow

### 1. Git Workflow

#### Branch Naming
```bash
# Feature branches
feature/wallet-integration
feature/token-swap
feature/portfolio-tracking

# Bug fixes
fix/wallet-connection-issue
fix/swap-calculation-error

# Hotfixes
hotfix/critical-security-patch
```

#### Commit Messages
```bash
# Format: type(scope): description
feat(wallet): add biometric authentication
fix(trading): resolve swap calculation error
docs(readme): update installation instructions
test(services): add wallet service tests
refactor(components): extract reusable button component
```

### 2. Code Review Process

#### Pull Request Checklist
- [ ] Code follows project standards
- [ ] TypeScript types are properly defined
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

#### Review Guidelines
```typescript
// Good: Proper error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to perform operation');
}

// Good: Proper TypeScript usage
interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: number;
  slippage: number;
}

// Good: Component composition
const SwapForm: React.FC = () => {
  return (
    <Form>
      <TokenSelector />
      <AmountInput />
      <SlippageSelector />
      <SwapButton />
    </Form>
  );
};
```

### 3. Testing Strategy

#### Unit Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { TokenCard } from '@/components/TokenCard';

describe('TokenCard', () => {
  it('renders token information correctly', () => {
    const { getByText } = render(
      <TokenCard
        symbol="SOL"
        price={100.50}
        change24h={5.2}
      />
    );

    expect(getByText('SOL')).toBeTruthy();
    expect(getByText('$100.50')).toBeTruthy();
    expect(getByText('+5.20%')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TokenCard
        symbol="SOL"
        price={100.50}
        change24h={5.2}
        onPress={onPress}
      />
    );

    fireEvent.press(getByTestId('token-card'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

#### Integration Tests
```typescript
import { render, waitFor } from '@testing-library/react-native';
import { AppProvider } from '@/components/app-providers';
import { TradingScreen } from '@/app/(tabs)/trading';

describe('TradingScreen Integration', () => {
  it('loads pools and displays them', async () => {
    const { getByText } = render(
      <AppProvider>
        <TradingScreen />
      </AppProvider>
    );

    await waitFor(() => {
      expect(getByText('Available Pools')).toBeTruthy();
    });
  });
});
```

## 🚀 Performance Guidelines

### 1. React Native Optimization

#### Memoization
```typescript
import React, { useMemo, useCallback } from 'react';

const TokenList: React.FC<{ tokens: Token[] }> = React.memo(({ tokens }) => {
  const sortedTokens = useMemo(() => 
    tokens.sort((a, b) => b.price - a.price),
    [tokens]
  );

  const handleTokenPress = useCallback((token: Token) => {
    // Handle token press
  }, []);

  return (
    <FlatList
      data={sortedTokens}
      renderItem={({ item }) => (
        <TokenCard token={item} onPress={() => handleTokenPress(item)} />
      )}
      keyExtractor={(item) => item.id}
    />
  );
});
```

#### Lazy Loading
```typescript
// Lazy load heavy components
const HeavyChart = React.lazy(() => import('./HeavyChart'));

const TradingScreen: React.FC = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <View>
      {showChart && (
        <Suspense fallback={<ActivityIndicator />}>
          <HeavyChart />
        </Suspense>
      )}
    </View>
  );
};
```

### 2. Network Optimization

#### API Caching
```typescript
import { useQuery } from '@tanstack/react-query';

const usePools = () => {
  return useQuery({
    queryKey: ['pools'],
    queryFn: fetchPools,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });
};
```

#### Request Debouncing
```typescript
import { useDebouncedCallback } from 'use-debounce';

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      // Perform search
    },
    300 // 300ms delay
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };
};
```

## 🔒 Security Guidelines

### 1. Input Validation
```typescript
// Always validate user inputs
const validateAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  if (address.length !== 44) return false; // Base58 encoded
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
};

const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= Number.MAX_SAFE_INTEGER;
};
```

### 2. Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data securely
const storePrivateKey = async (key: string) => {
  await SecureStore.setItemAsync('private_key', key);
};

// Retrieve sensitive data
const getPrivateKey = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('private_key');
};
```

### 3. Network Security
```typescript
// Use HTTPS only
const API_BASE_URL = 'https://api.dexscreener.com';

// Validate API responses
const validateApiResponse = (response: any): boolean => {
  return response && 
         typeof response === 'object' && 
         'data' in response &&
         Array.isArray(response.data);
};
```

## 📚 Documentation Standards

### 1. Code Documentation
```typescript
/**
 * Executes a token swap on the Solana blockchain
 * @param params - Swap parameters including tokens and amounts
 * @returns Promise resolving to transaction signature
 * @throws {Error} When swap fails or parameters are invalid
 * @example
 * ```typescript
 * const signature = await executeSwap({
 *   tokenIn: 'SOL',
 *   tokenOut: 'USDC',
 *   amount: 1.5,
 *   slippage: 0.5
 * });
 * ```
 */
async function executeSwap(params: SwapParams): Promise<string> {
  // Implementation
}
```

### 2. Component Documentation
```typescript
/**
 * TokenCard component displays token information in a card format
 * 
 * @component
 * @example
 * ```tsx
 * <TokenCard
 *   symbol="SOL"
 *   price={100.50}
 *   change24h={5.2}
 *   onPress={() => console.log('Token pressed')}
 * />
 * ```
 */
export const TokenCard: React.FC<TokenCardProps> = ({ ... }) => {
  // Component implementation
};
```

## 🧪 Testing Guidelines

### 1. Test Structure
```typescript
// __tests__/components/TokenCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { TokenCard } from '@/components/TokenCard';

describe('TokenCard', () => {
  const defaultProps = {
    symbol: 'SOL',
    price: 100.50,
    change24h: 5.2,
  };

  it('renders correctly with default props', () => {
    const { getByText } = render(<TokenCard {...defaultProps} />);
    expect(getByText('SOL')).toBeTruthy();
  });

  it('handles positive price change', () => {
    const { getByText } = render(
      <TokenCard {...defaultProps} change24h={5.2} />
    );
    expect(getByText('+5.20%')).toBeTruthy();
  });

  it('handles negative price change', () => {
    const { getByText } = render(
      <TokenCard {...defaultProps} change24h={-3.1} />
    );
    expect(getByText('-3.10%')).toBeTruthy();
  });
});
```

### 2. Mocking Guidelines
```typescript
// Mock external dependencies
jest.mock('@/src/services/WalletService', () => ({
  WalletService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn(),
  },
}));

// Mock React Native components
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
```

## 🚀 Deployment Guidelines

### 1. Pre-deployment Checklist
- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] TypeScript compilation succeeds
- [ ] Performance benchmarks are met
- [ ] Security audit is completed
- [ ] Documentation is updated

### 2. Environment Configuration
```typescript
// Environment-specific configuration
const config = {
  development: {
    apiUrl: 'https://dev-api.dexscreener.com',
    rpcUrl: 'https://api.devnet.solana.com',
  },
  staging: {
    apiUrl: 'https://staging-api.dexscreener.com',
    rpcUrl: 'https://api.testnet.solana.com',
  },
  production: {
    apiUrl: 'https://api.dexscreener.com',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
};
```

---

This development guide ensures consistent code quality, maintainability, and team collaboration. Follow these standards to contribute effectively to the DEX Screener project. 