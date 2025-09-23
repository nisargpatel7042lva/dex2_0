

export const NetworkConfig = {
  // RPC Connection Timeouts
  RPC_CONNECTION_TIMEOUT: 120000, // 2 minutes for transaction confirmation
  RPC_NETWORK_TIMEOUT: 30000, // 30 seconds for network operations
  RPC_RETRY_DELAY_BASE: 2000, // Base delay between retries (2 seconds)
  
  // Wallet Authentication
  AUTH_TOKEN_REFRESH_THRESHOLD: 600000, // 10 minutes before refreshing auth token (increased from 5 minutes)
  CONNECTION_CHECK_INTERVAL: 120000, // 2 minutes between connection health checks (reduced frequency)
  WALLET_RECONNECT_WAIT: 5000, // 5 seconds wait after wallet reconnection
  
  // Jupiter API Timeouts
  JUPITER_QUOTE_TIMEOUT: 120000, // 2 minutes for quote requests
  JUPITER_SWAP_TIMEOUT: 120000, // 2 minutes for swap transaction requests

  // UI Debounce and Intervals
  QUOTE_DEBOUNCE_DELAY: 500, // 500ms debounce for quote fetching
  BALANCE_RELOAD_DELAY: 2000, // 2 seconds delay before reloading balances after swap
  
  // Error Handling
  MAX_RETRY_ATTEMPTS: 3, // Maximum number of retry attempts
  RECONNECTION_RETRY_THRESHOLD: 3, // Number of failed checks before suggesting reconnection
} as const;

export type NetworkConfigType = typeof NetworkConfig;
