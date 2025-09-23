# Deployment Guide

This guide provides comprehensive instructions for deploying the DEX Screener application, including both the mobile app and smart contracts to various environments.

## 🎯 Deployment Overview

The DEX Screener project consists of two main components that need to be deployed:

1. **Mobile Application** - React Native/Expo app
2. **Smart Contracts** - Token-2022 program on Solana

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Development   │    │     Staging     │                │
│  │                 │    │                 │                │
│  │ • Local Testing │    │ • Devnet Deploy │                │
│  │ • Unit Tests    │    │ • Integration   │                │
│  │ • Code Review   │    │ • User Testing  │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Production    │    │   Monitoring    │                │
│  │                 │    │                 │                │
│  │ • Mainnet Deploy│    │ • Performance   │                │
│  │ • App Store     │    │ • Error Tracking│                │
│  │ • Play Store    │    │ • Analytics     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Mobile App Deployment

### 1. Development Environment

#### Local Development Setup
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

#### Environment Configuration
```bash
# Create environment file
cp .env.example .env

# Configure environment variables
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=https://dev-api.dexscreener.com
EXPO_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 2. Staging Environment

#### Expo EAS Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for staging
eas build --platform all --profile staging
```

#### EAS Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.13.3"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_APP_ENV": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging-api.dexscreener.com",
        "EXPO_PUBLIC_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.dexscreener.com",
        "EXPO_PUBLIC_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3. Production Deployment

#### App Store (iOS)
```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

#### Play Store (Android)
```bash
# Build for production
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

#### App Store Configuration
```json
// app.json
{
  "expo": {
    "name": "DEX Screener",
    "slug": "dex-screener",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dexscreener.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.dexscreener.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### 4. OTA Updates

#### Configure Updates
```bash
# Configure EAS Update
eas update:configure

# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

#### Update Configuration
```json
// app.json
{
  "expo": {
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

## 🔧 Smart Contract Deployment

### 1. Development Environment

#### Local Development
```bash
# Navigate to smart contract directory
cd programs/token-2022

# Build the program
cargo build

# Run tests
cargo test

# Start local validator
solana-test-validator
```

#### Anchor Configuration
```toml
# Anchor.toml
[features]
seeds = false
skip-lint = false

[programs.localnet]
token_2022 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 2. Devnet Deployment

#### Deploy to Devnet
```bash
# Set cluster to devnet
solana config set --url devnet

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

#### Devnet Configuration
```toml
# Anchor.toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet]
token_2022 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
```

### 3. Mainnet Deployment

#### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Security audit completed
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Backup strategies in place

#### Deploy to Mainnet
```bash
# Set cluster to mainnet
solana config set --url mainnet-beta

# Build the program
anchor build

# Deploy to mainnet
anchor deploy --provider.cluster mainnet-beta

# Verify deployment
solana program show TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

#### Mainnet Configuration
```toml
# Anchor.toml
[provider]
cluster = "mainnet-beta"
wallet = "~/.config/solana/id.json"

[programs.mainnet-beta]
token_2022 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions

#### Workflow Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test
      - run: yarn lint
      - run: yarn type-check

  build-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn build
      - uses: actions/upload-artifact@v3
        with:
          name: mobile-build
          path: dist/

  deploy-smart-contract:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-rust@v3
      - run: rustc --version
      - run: cargo build
      - run: cargo test
      - run: anchor build
      - run: anchor deploy --provider.cluster devnet
```

### 2. Automated Testing

#### Test Pipeline
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test:integration

  smart-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-rust@v3
      - run: cargo test
      - run: anchor test
```

## 🔒 Security Deployment

### 1. Security Audits

#### Pre-deployment Security
```bash
# Run security scans
yarn audit
cargo audit

# Run linting
yarn lint
cargo clippy

# Run type checking
yarn type-check
```

#### Security Configuration
```json
// .eslintrc.js
module.exports = {
  extends: [
    '@react-native-community',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error'
  }
};
```

### 2. Environment Security

#### Environment Variables
```bash
# Production environment
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://api.dexscreener.com
EXPO_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_APP_VERSION=1.0.0

# Secure storage
EXPO_PUBLIC_ENCRYPTION_KEY=your-encryption-key
EXPO_PUBLIC_API_KEY=your-api-key
```

#### Secure Storage
```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
const storeSecureData = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

// Retrieve sensitive data
const getSecureData = async (key: string): Promise<string | null> => {
  return await SecureStore.getItemAsync(key);
};
```

## 📊 Monitoring and Analytics

### 1. Performance Monitoring

#### Mobile App Monitoring
```typescript
// Performance monitoring
import { Performance } from '@expo/performance';

const monitorPerformance = () => {
  Performance.mark('app-start');
  
  // Monitor key metrics
  Performance.measure('app-load-time', 'app-start', 'app-ready');
};
```

#### Smart Contract Monitoring
```rust
// Program metrics
#[account]
pub struct ProgramMetrics {
    pub total_transactions: u64,
    pub total_volume: u64,
    pub error_count: u64,
    pub last_updated: i64,
}

impl ProgramMetrics {
    pub fn update_metrics(&mut self, volume: u64, success: bool) {
        self.total_transactions += 1;
        self.total_volume += volume;
        if !success {
            self.error_count += 1;
        }
        self.last_updated = Clock::get().unwrap().unix_timestamp;
    }
}
```

### 2. Error Tracking

#### Error Reporting
```typescript
// Error tracking setup
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.EXPO_PUBLIC_APP_ENV,
  release: process.env.EXPO_PUBLIC_APP_VERSION,
});

// Error boundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  );
};
```

## 🚀 Rollback Strategy

### 1. Mobile App Rollback

#### Version Management
```json
// app.json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

#### Rollback Process
```bash
# Revert to previous version
git revert HEAD

# Rebuild and redeploy
eas build --platform all --profile production
eas submit --platform all --profile production
```

### 2. Smart Contract Rollback

#### Program Upgrade
```bash
# Deploy new version
anchor deploy --provider.cluster mainnet-beta

# Verify new deployment
solana program show TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

#### Emergency Rollback
```rust
// Emergency pause functionality
#[program]
pub mod emergency {
    use super::*;
    
    pub fn pause_program(ctx: Context<PauseProgram>) -> Result<()> {
        // Pause all operations
        let program_state = &mut ctx.accounts.program_state;
        program_state.paused = true;
        program_state.pause_authority = ctx.accounts.authority.key();
        program_state.pause_timestamp = Clock::get()?.unix_timestamp;
        
        emit!(ProgramPausedEvent {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}
```

## 📈 Post-Deployment

### 1. Health Checks

#### Application Health
```typescript
// Health check endpoint
const healthCheck = async () => {
  try {
    const response = await fetch('/health');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('Application is healthy');
    } else {
      console.error('Application health check failed');
    }
  } catch (error) {
    console.error('Health check error:', error);
  }
};
```

#### Smart Contract Health
```rust
// Program health check
pub fn health_check(ctx: Context<HealthCheck>) -> Result<()> {
    let program_state = &ctx.accounts.program_state;
    
    require!(!program_state.paused, TokenError::ProgramPaused);
    require!(program_state.last_updated > 0, TokenError::InvalidState);
    
    emit!(HealthCheckEvent {
        timestamp: Clock::get()?.unix_timestamp,
        status: "healthy".to_string(),
    });
    
    Ok(())
}
```

### 2. Performance Monitoring

#### Key Metrics
- **App Load Time**: < 3 seconds
- **Transaction Success Rate**: > 99%
- **API Response Time**: < 500ms
- **Error Rate**: < 1%

#### Monitoring Dashboard
```typescript
// Performance dashboard
const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    successRate: 0,
    responseTime: 0,
    errorRate: 0,
  });

  useEffect(() => {
    // Fetch performance metrics
    fetchMetrics().then(setMetrics);
  }, []);

  return (
    <View>
      <Text>Load Time: {metrics.loadTime}ms</Text>
      <Text>Success Rate: {metrics.successRate}%</Text>
      <Text>Response Time: {metrics.responseTime}ms</Text>
      <Text>Error Rate: {metrics.errorRate}%</Text>
    </View>
  );
};
```

---

This deployment guide provides comprehensive instructions for deploying the DEX Screener application across all environments, ensuring security, reliability, and performance. 