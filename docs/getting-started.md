# Getting Started

Welcome to the DEX Screener project! This guide will help you set up and run the application locally.

## 🎯 What is DEX Screener?

DEX Screener is a modern mobile application built with React Native and Expo that provides real-time analytics and trading capabilities for Token-2022 tokens on the Solana blockchain. It features:

- **Token-2022 Integration**: Advanced token features including transfer hooks and confidential transfers
- **Real-time Analytics**: Live market data and trading insights
- **Dark Theme UI**: Modern black-themed interface with Space Grotesk fonts
- **Wallet Integration**: Seamless wallet connection and management
- **Portfolio Management**: Track and manage Token-2022 assets

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (v18 or higher)
- **Yarn** or **npm**
- **Git**
- **Expo CLI** (`npm install -g @expo/cli`)

### For Smart Contract Development
- **Rust** (latest stable version)
- **Cargo** (comes with Rust)
- **Solana CLI** tools
- **Anchor Framework** (for Solana development)

### For Mobile Development
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Expo Go** app on your mobile device

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dex2_0.git
cd dex2_0
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
yarn install

# Install Rust dependencies (for smart contracts)
cd programs/token-2022
cargo build
cd ../..
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com

# App Configuration
EXPO_PUBLIC_APP_NAME=DEX Screener
EXPO_PUBLIC_APP_VERSION=1.0.0

# API Keys (if needed)
EXPO_PUBLIC_COINGECKO_API_KEY=your_api_key_here
```

### 4. Start the Development Server

```bash
# Start Expo development server
yarn start

# Or use npm
npm start
```

### 5. Run on Device

1. **Install Expo Go** on your mobile device
2. **Scan the QR code** displayed in the terminal
3. **The app will load** on your device

## 📱 App Features Overview

### Home Screen
- Market overview and trending tokens
- Quick access to key features
- Real-time price updates

### Trading Screen
- Token swapping with Transfer Hook integration
- Liquidity pool management
- Real-time quotes and analytics

### Portfolio Screen
- Token-2022 asset tracking
- Transaction history
- Performance analytics

### Search Screen
- Token discovery and analysis
- Advanced filtering options
- Market data visualization

## 🔧 Development Workflow

### 1. Code Structure

```
dex2_0/
├── app/                    # Expo Router screens
├── components/            # Reusable UI components
├── src/
│   ├── context/          # React Context providers
│   ├── services/         # Business logic services
│   └── screens/          # Screen components
├── programs/             # Solana smart contracts
└── assets/              # Static assets
```

### 2. Development Commands

```bash
# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android

# Run tests
yarn test

# Build for production
yarn build

# Lint code
yarn lint

# Type check
yarn type-check
```

### 3. Smart Contract Development

```bash
# Navigate to smart contract directory
cd programs/token-2022

# Build the program
cargo build

# Run tests
cargo test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 🧪 Testing the App

### 1. Wallet Connection
1. Open the app
2. Tap "Connect Demo Wallet" for testing
3. Or import a private key for production use

### 2. Request SOL Airdrop
1. Go to Settings screen
2. Tap "Request SOL Airdrop"
3. Wait for confirmation

### 3. Test Token-2022 Features
1. Create a new Token-2022 mint
2. Test transfer hooks
3. Enable confidential transfers
4. Manage metadata pointers

## 🔍 Troubleshooting

### Common Issues

**Expo CLI not found**
```bash
npm install -g @expo/cli
```

**Metro bundler issues**
```bash
yarn start --clear
```

**Android build issues**
```bash
cd android && ./gradlew clean && cd ..
```

**iOS build issues**
```bash
cd ios && pod install && cd ..
```

### Getting Help

- Check the [Troubleshooting Guide](./troubleshooting/common-issues.md)
- Review [Error Codes](./troubleshooting/error-codes.md)
- Create an issue on GitHub
- Join our Discord community

## 📚 Next Steps

Now that you have the app running, explore these resources:

1. **[Architecture Guide](./architecture.md)** - Understand the system design
2. **[Development Guide](./development.md)** - Learn development best practices
3. **[Smart Contract Documentation](./smart-contracts/README.md)** - Explore the Token-2022 program
4. **[API Reference](./api/README.md)** - Review service layer documentation

## 🎉 Congratulations!

You've successfully set up the DEX Screener project! You can now:

- Explore the codebase
- Test the mobile app features
- Develop new features
- Contribute to the project

Happy coding! 🚀 