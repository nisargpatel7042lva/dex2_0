/**
 * Devnet Configuration for DEX 2.0
 * Contains all devnet-specific addresses, endpoints, and settings
 */

import { PublicKey } from '@solana/web3.js';

export const DevnetConfig = {
  // Network Settings
  RPC_ENDPOINT: 'https://api.devnet.solana.com',
  CHAIN_ID: 'solana:devnet',
  EXPLORER_BASE_URL: 'https://explorer.solana.com',
  CLUSTER: 'devnet' as const,

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

  // Common Devnet Token Addresses
  TOKENS: {
    SOL: new PublicKey('So11111111111111111111111111111111111111112'),
    USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'), // USDC Devnet
    USDT: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'), // USDT Devnet
    // Add more devnet tokens as needed
  },

  // Example Pool Addresses for Testing
  POOLS: {
    RAYDIUM: {
      CP_SWAP: {
        SOL_USDC: new PublicKey('6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg'),
      },
      CLMM: {
        SOL_USDC: new PublicKey('2QdhepnKRTLjjSqPL1PtKNwqrUkoLee5Gqs8bvZhRdMv'),
      },
    },
    ORCA: {
      WHIRLPOOL: {
        SOL_USDC: new PublicKey('HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ'),
      },
    },
  },

  // Whitelisted Transfer Hook Programs for Devnet Testing
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

  // Devnet-specific Rate Limits (more lenient for testing)
  RATE_LIMITS: {
    COINGECKO: {
      REQUESTS_PER_MINUTE: 5, // More requests for testing
      TIME_WINDOW: 60000,
    },
    SOLANA_RPC: {
      REQUESTS_PER_MINUTE: 15, // More requests for testing
      TIME_WINDOW: 60000,
    },
    JUPITER: {
      REQUESTS_PER_MINUTE: 10,
      TIME_WINDOW: 60000,
    },
  },

  // Testing Configuration
  TESTING: {
    DEFAULT_AIRDROP_AMOUNT: 2, // 2 SOL for testing
    FAUCET_ENDPOINTS: [
      'https://faucet.solana.com',
      'https://solfaucet.com',
    ],
  },
} as const;

export type DevnetConfigType = typeof DevnetConfig;

// Helper functions
export const isDevnet = () => DevnetConfig.CLUSTER === 'devnet';

export const getExplorerUrl = (signature: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/tx/${signature}?cluster=${DevnetConfig.CLUSTER}`;

export const getAccountExplorerUrl = (address: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/account/${address}?cluster=${DevnetConfig.CLUSTER}`;

export const getTokenExplorerUrl = (mint: string) => 
  `${DevnetConfig.EXPLORER_BASE_URL}/token/${mint}?cluster=${DevnetConfig.CLUSTER}`;
