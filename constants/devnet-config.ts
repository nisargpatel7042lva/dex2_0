

import { PublicKey } from '@solana/web3.js';

export const DevnetConfig = {
  // Network Settings
  RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com',
  CHAIN_ID: 'solana:mainnet',
  EXPLORER_BASE_URL: 'https://explorer.solana.com',
  CLUSTER: 'mainnet' as const,

  // Official Program IDs (these are the same on all networks)
  PROGRAMS: {
    // Solana Native Programs
    SYSTEM_PROGRAM: new PublicKey('11111111111111111111111111111111'),
    TOKEN_PROGRAM: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    TOKEN_2022_PROGRAM: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
    ASSOCIATED_TOKEN_PROGRAM: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),

    // AMM Program IDs
    RAYDIUM: {
      AMM_V4: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
      CP_SWAP: new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'), // Supports Token-2022
      CLMM: new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUQpMkFr9WeaFAmKhAz'),
    },
    ORCA: {
      WHIRLPOOL: new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'),
    },
    METEORA: {
      DLMM: new PublicKey('METAewgxyPbgwsseH8T16a39CQ5VyVxZi9zXiDPY18m'),
    },

    // Jupiter Program (for swap aggregation)
    JUPITER: {
      V6: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
    },
  },

  // Common Mainnet Token Addresses
  TOKENS: {
    SOL: new PublicKey('So11111111111111111111111111111111111111112'),
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC Mainnet
    USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'), // USDT Mainnet
    // Add more mainnet tokens as needed
  },

  // Example Pool Addresses for Mainnet
  POOLS: {
    RAYDIUM: {
      CP_SWAP: {
        SOL_USDC: new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj'),
      },
      CLMM: {
        SOL_USDC: new PublicKey('7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm'),
      },
    },
    ORCA: {
      WHIRLPOOL: {
        SOL_USDC: new PublicKey('7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm'),
      },
    },
  },

  // Whitelisted Transfer Hook Programs for Mainnet
  TRANSFER_HOOKS: {
    FEE_COLLECTION: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    COMPLIANCE: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
    REWARDS: new PublicKey('DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1'),
    BURN_MECHANISM: new PublicKey('BurnAuTNeBdog6vkhzuCDDXs7teTA6mQ46qqvkZTjF4n'),
    STAKING: new PublicKey('StakeSSCS2CLwx4kEGUdURg8dZcZJ2ikFfvmN9Cj3vA'),
  },

  // API Endpoints
  APIS: {
    JUPITER: 'https://quote-api.jup.ag/v6',
    COINGECKO: 'https://api.coingecko.com/api/v3',
  },

  // Mainnet-specific Rate Limits (more conservative for production)
  RATE_LIMITS: {
    COINGECKO: {
      REQUESTS_PER_MINUTE: 3, // Conservative rate for production
      TIME_WINDOW: 60000,
    },
    SOLANA_RPC: {
      REQUESTS_PER_MINUTE: 10, // Conservative rate for production
      TIME_WINDOW: 60000,
    },
    JUPITER: {
      REQUESTS_PER_MINUTE: 8,
      TIME_WINDOW: 60000,
    },
  },

  // Production Configuration
  PRODUCTION: {
    DEFAULT_AIRDROP_AMOUNT: 0, // No airdrops on mainnet
    FAUCET_ENDPOINTS: [], // No faucets on mainnet
  },
} as const;

export type DevnetConfigType = typeof DevnetConfig;

// Helper functions
export const isMainnet = () => DevnetConfig.CLUSTER === 'mainnet';

export const getExplorerUrl = (signature: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/tx/${signature}?cluster=${DevnetConfig.CLUSTER}`;

export const getAccountExplorerUrl = (address: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/account/${address}?cluster=${DevnetConfig.CLUSTER}`;

export const getTokenExplorerUrl = (mint: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/token/${mint}?cluster=${DevnetConfig.CLUSTER}`;
