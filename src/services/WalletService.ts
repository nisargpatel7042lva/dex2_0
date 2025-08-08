import { NetworkConfig } from '@/constants/network-config';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { toUint8Array } from 'js-base64';
import { WalletConnectionDebugger, safeFirst } from '../utils/wallet-debug';

export interface WalletInfo {
  publicKey: PublicKey;
  balance: number;
  isConnected: boolean;
}

export interface AuthorizedAccount {
  publicKey: PublicKey;
  address: string;
  label?: string;
  authToken: string;
  authTokenTimestamp: number; // When the auth token was created
}

export class WalletService {
  private connections: Connection[];
  private currentConnectionIndex: number = 0;
  private wallet: AuthorizedAccount | null = null;
  private lastConnectionCheck: number = 0;
  private readonly CONNECTION_CHECK_INTERVAL = NetworkConfig.CONNECTION_CHECK_INTERVAL;

  constructor() {
    // Multiple RPC endpoints for fallback - using mainnet for Jupiter compatibility
    // Increased timeouts for better Jupiter swap reliability
    this.connections = [
      new Connection('https://api.mainnet-beta.solana.com', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: NetworkConfig.RPC_CONNECTION_TIMEOUT,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
        // Add WebSocket endpoint for better performance
        wsEndpoint: 'wss://api.mainnet-beta.solana.com/',
      }),
      new Connection('https://solana-mainnet.g.alchemy.com/v2/demo', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: NetworkConfig.RPC_CONNECTION_TIMEOUT,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
      }),
      new Connection('https://mainnet.helius-rpc.com/?api-key=demo', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: NetworkConfig.RPC_CONNECTION_TIMEOUT,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
      }),
    ];
  }

  private getCurrentConnection(): Connection {
    return this.connections[this.currentConnectionIndex];
  }

  private async switchToNextConnection(): Promise<void> {
    this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.connections.length;
    console.log(`Switched to RPC endpoint ${this.currentConnectionIndex + 1}`);
  }

  private async retryWithFallback<T>(
    operation: (connection: Connection) => Promise<T>,
    maxRetries: number = NetworkConfig.MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        console.log(`Attempting operation with RPC endpoint ${this.currentConnectionIndex + 1} (attempt ${attempt + 1})`);
        
        const result = await Promise.race([
          operation(connection),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), NetworkConfig.RPC_NETWORK_TIMEOUT)
          )
        ]);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          await this.switchToNextConnection();
          // Increase wait time between retries for complex operations
          await new Promise(resolve => setTimeout(resolve, NetworkConfig.RPC_RETRY_DELAY_BASE * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }

  async connectWallet(): Promise<WalletInfo> {
    console.log('Connecting to mobile wallet...');
    WalletConnectionDebugger.setConnectionStep('starting_wallet_connection');
    
    try {
      // Use mobile wallet adapter to connect to real user wallet
      const account = await transact(async (wallet) => {
        const authResult = await wallet.authorize({
          identity: {
            name: 'Dex2.0',
            uri: 'https://dex2.app',
          },
          chain: 'solana:mainnet',
        });
        
        console.log('Auth result received, processing...');
        console.log('Auth result accounts:', authResult.accounts);
        
        // Debug logging
        WalletConnectionDebugger.setConnectionStep('wallet_authorization_complete');
        WalletConnectionDebugger.setAccountsInfo(authResult.accounts);
        
        // Validate that we have accounts available
        if (!authResult.accounts || authResult.accounts.length === 0) {
          const error = 'No accounts available from wallet. Please ensure your wallet is unlocked and has accounts.';
          WalletConnectionDebugger.setError(error);
          throw new Error(error);
        }
        
        // Get the first account from the authorization result with safe bounds checking
        const authorizedAccount = safeFirst(authResult.accounts, 'No valid account received from wallet');
        console.log('Authorized account:', authorizedAccount);
        
        if (!authorizedAccount || !authorizedAccount.address) {
          const error = 'No valid account received from wallet';
          WalletConnectionDebugger.setError(error);
          throw new Error(error);
        }
        
        // Convert the Base64 address to PublicKey using the same method as use-authorization.tsx
        const publicKeyByteArray = toUint8Array(authorizedAccount.address);
        const publicKey = new PublicKey(publicKeyByteArray);
        
        console.log('Converted address to PublicKey:', publicKey.toString());
        WalletConnectionDebugger.setConnectionStep('address_conversion_complete');
        
        return {
          publicKey,
          address: authorizedAccount.address,
          label: authorizedAccount.label,
          authToken: authResult.auth_token,
          authTokenTimestamp: Date.now(),
        };
      });

      this.wallet = account;
      this.lastConnectionCheck = Date.now();
      const balance = await this.getSOLBalance(account.publicKey);
      
      console.log('Successfully connected to user wallet');
      WalletConnectionDebugger.setConnectionStep('wallet_connection_successful');
      
      return {
        publicKey: account.publicKey,
        balance,
        isConnected: true,
      };
    } catch (error) {
      const errorMessage = `Error connecting wallet: ${error}`;
      console.error(errorMessage);
      WalletConnectionDebugger.setError(errorMessage);
      this.wallet = null;
      throw error;
    }
  }

  async reconnectWallet(): Promise<WalletInfo> {
    console.log('Attempting to reconnect wallet...');
    
    try {
      // Clear the current wallet state
      const previousPublicKey = this.wallet?.publicKey;
      this.wallet = null;
      this.lastConnectionCheck = 0;
      
      console.log('Previous wallet state cleared, initiating fresh connection...');
      
      // Wait a moment before reconnecting to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect with fresh auth
      const walletInfo = await this.connectWallet();
      
      // Verify we got the same wallet back (for user experience)
      if (previousPublicKey && !walletInfo.publicKey.equals(previousPublicKey)) {
        console.warn('Reconnected to different wallet than before');
      }
      
      console.log('Wallet reconnected successfully');
      return walletInfo;
    } catch (error) {
      console.error('Error reconnecting wallet:', error);
      this.wallet = null;
      throw new Error('Failed to reconnect wallet. Please try connecting again manually.');
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (this.wallet && this.wallet.authToken) {
        await transact(async (wallet) => {
          await wallet.deauthorize({ auth_token: this.wallet!.authToken });
        });
      }
      this.wallet = null;
      this.lastConnectionCheck = 0;
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      this.wallet = null;
    }
  }

  async validateConnection(): Promise<boolean> {
    if (!this.wallet) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      return true; // Skip check if we checked recently
    }

    try {
      // Test the connection by attempting to get balance
      await this.retryWithFallback(async (connection) => {
        return await connection.getBalance(this.wallet!.publicKey);
      });
      
      // Don't validate auth token during regular connection checks to avoid issues
      // Auth token validation should only happen when we actually need to sign something
      // const isAuthValid = await this.validateAuthToken();
      // if (!isAuthValid) {
      //   console.log('Auth token validation failed during connection check');
      //   return false;
      // }
      
      this.lastConnectionCheck = now;
      return true;
    } catch (error) {
      console.error('Connection validation failed:', error);
      return false;
    }
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    try {
      if (this.wallet) {
        const isValid = await this.validateConnection();
        if (!isValid) {
          return null;
        }
        
        const balance = await this.getSOLBalance(this.wallet.publicKey);
        return {
          publicKey: this.wallet.publicKey,
          balance,
          isConnected: true,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  async getSOLBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.retryWithFallback(async (connection) => {
        return await connection.getBalance(publicKey);
      });
      
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance after all retries:', error);
      // Return 0 balance instead of throwing error to prevent app crashes
      return 0;
    }
  }

  async requestAirdrop(amount: number): Promise<void> {
    try {
      const publicKey = this.wallet?.publicKey;
      if (!publicKey) {
        throw new Error('No wallet connected');
      }

      const signature = await this.retryWithFallback(async (connection) => {
        return await connection.requestAirdrop(
          publicKey,
          amount * LAMPORTS_PER_SOL
        );
      });
      
      await this.retryWithFallback(async (connection) => {
        return await connection.confirmTransaction(signature);
      });
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  async sendTransaction(transaction: Transaction | VersionedTransaction): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    try {
      console.log('Sending transaction with auth token...');
      
      // Check auth token age before proceeding
      const tokenAge = this.getAuthTokenAge();
      console.log(`Auth token age: ${tokenAge}ms`);
      
      // Only preemptively reconnect if token is very old
      if (tokenAge > NetworkConfig.AUTH_TOKEN_REFRESH_THRESHOLD * 1.2) { // 20% buffer
        console.log('Auth token is very old, reconnecting before transaction...');
        await this.reconnectWallet();
      }
      
      return await transact(async (wallet) => {
        // For VersionedTransaction, we need to handle it differently
        if (transaction instanceof VersionedTransaction) {
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
            minContextSlot: 0,
          });
          if (!signatures || signatures.length === 0) {
            throw new Error('No signatures returned from wallet for VersionedTransaction');
          }
          return safeFirst(signatures, 'No valid signature returned from wallet for VersionedTransaction');
        } else {
          // For regular Transaction
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
            minContextSlot: 0,
          });
          if (!signatures || signatures.length === 0) {
            throw new Error('No signatures returned from wallet for Transaction');
          }
          return safeFirst(signatures, 'No valid signature returned from wallet for Transaction');
        }
      });
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      
      // Check if it's an auth token error and throw a specific error
      if (error.message?.includes('auth_token not valid') || 
          error.message?.includes('not valid for signing') ||
          error.message?.includes('auth_token') ||
          error.name?.includes('SolanaMobileWalletAdapterProtocolError')) {
        
        console.log('Auth token error detected, marking wallet for reconnection...');
        
        // Clear the current wallet state so next validation will fail
        this.lastConnectionCheck = 0;
        
        // Throw a specific error that the UI can handle
        throw new Error('WALLET_AUTH_EXPIRED');
      }
      
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet connected');
      }

      // For mobile wallet, transactions are signed during send
      return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  async getTokenBalances(publicKey: PublicKey): Promise<any[]> {
    try {
      console.log('🔍 Fetching token balances for:', publicKey.toString());
      
      // Fetch both regular SPL tokens and Token-2022 tokens
      const [splTokenAccounts, token2022Accounts] = await Promise.all([
        this.retryWithFallback(async (connection) => {
          return await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
          );
        }),
        this.retryWithFallback(async (connection) => {
          return await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_2022_PROGRAM_ID }
          );
        })
      ]);

      // Combine and format all token balances
      const allAccounts = [
        ...splTokenAccounts.value,
        ...token2022Accounts.value
      ];

      console.log(`📊 Found ${splTokenAccounts.value.length} SPL tokens and ${token2022Accounts.value.length} Token-2022 tokens`);

      const formattedBalances = allAccounts.map((account) => {
        const parsedInfo = account.account.data.parsed.info;
        const balance = parseFloat(parsedInfo.tokenAmount.uiAmount || '0');
        return {
          mint: parsedInfo.mint,
          balance: balance,
          decimals: parsedInfo.tokenAmount.decimals,
          address: account.pubkey.toString(),
          programId: account.account.owner.toString(),
        };
      }).filter(token => token.balance > 0); // Only include tokens with positive balance

      console.log('💰 Formatted token balances:', formattedBalances);
      return formattedBalances;
    } catch (error) {
      console.error('❌ Error getting token balances:', error);
      return [];
    }
  }

  getPublicKey(): PublicKey | null {
    return this.wallet?.publicKey || null;
  }

  isWalletConnected(): boolean {
    return this.wallet !== null;
  }

  getConnection(): Connection {
    return this.getCurrentConnection();
  }

  // Get the current auth token (useful for debugging)
  getAuthToken(): string | null {
    return this.wallet?.authToken || null;
  }

  // Get auth token age in milliseconds
  getAuthTokenAge(): number {
    if (!this.wallet || !this.wallet.authTokenTimestamp) return 0;
    return Date.now() - this.wallet.authTokenTimestamp;
  }

  // Check if auth token is getting old (more than 10 minutes)
  isAuthTokenOld(): boolean {
    return this.getAuthTokenAge() > 600000; // 10 minutes
  }

  // Method to check if we need to reconnect
  shouldReconnect(): boolean {
    if (!this.wallet) return true;
    
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastConnectionCheck;
    
    // If it's been more than 5 minutes since last successful check, suggest reconnect
    return timeSinceLastCheck > 300000;
  }

  // Check if auth token is still valid without consuming it
  async validateAuthToken(): Promise<boolean> {
    if (!this.wallet?.authToken) {
      return false;
    }

    // Instead of calling transact (which consumes auth token usage),
    // just check if the token is too old or if we've had recent failures
    const tokenAge = this.getAuthTokenAge();
    
    // If token is very fresh (less than 30 seconds), assume it's valid
    if (tokenAge < 30000) {
      console.log('Auth token is fresh, assuming valid');
      return true;
    }
    
    // If token is getting old but not past threshold, it's probably still valid
    if (tokenAge < NetworkConfig.AUTH_TOKEN_REFRESH_THRESHOLD) {
      console.log('Auth token within acceptable age range');
      return true;
    }
    
    // Token is old, needs refresh
    console.log('Auth token is old and needs refresh');
    return false;
  }

  // Enhanced method to ensure wallet is ready for transactions
  async ensureWalletReady(): Promise<WalletInfo> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    // Get the age of the current auth token
    const tokenAge = this.getAuthTokenAge();
    
    console.log(`Auth token age: ${tokenAge}ms`);
    
    // Only reconnect if token is significantly old
    if (tokenAge > NetworkConfig.AUTH_TOKEN_REFRESH_THRESHOLD) {
      console.log('Auth token is old, refreshing connection...');
      return await this.reconnectWallet();
    }
    
    // Don't validate auth token here - let the actual transaction fail if needed
    // This prevents premature token consumption
    console.log('Auth token age is acceptable, proceeding with transaction');

    // Return current wallet info if everything is valid
    const balance = await this.getSOLBalance(this.wallet.publicKey);
    return {
      publicKey: this.wallet.publicKey,
      balance,
      isConnected: true,
    };
  }

  // Validate wallet is ready for signing transactions (more thorough than connection check)
  async validateForTransaction(): Promise<boolean> {
    if (!this.wallet) {
      return false;
    }

    try {
      // Test both network connection and auth token
      await this.retryWithFallback(async (connection) => {
        return await connection.getBalance(this.wallet!.publicKey);
      });
      
      // Validate auth token for transaction signing
      const isAuthValid = await this.validateAuthToken();
      if (!isAuthValid) {
        console.log('Auth token validation failed for transaction');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Transaction validation failed:', error);
      return false;
    }
  }
}