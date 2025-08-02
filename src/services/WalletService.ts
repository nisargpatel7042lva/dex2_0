import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { toUint8Array } from 'js-base64';

export interface WalletInfo {
  publicKey: PublicKey;
  balance: number;
  isConnected: boolean;
}

export class WalletService {
  private connections: Connection[];
  private currentConnectionIndex: number = 0;
  private wallet: any = null;

  constructor() {
    // Multiple RPC endpoints for fallback - using testnet
    this.connections = [
      new Connection('https://api.testnet.solana.com', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
      }),
      new Connection('https://solana-testnet.g.alchemy.com/v2/demo', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
      }),
      new Connection('https://testnet.helius.xyz/?api-key=1aec0e5a-8f0f-4c0f-9f0f-1aec0e5a8f0f', {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
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
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        console.log(`Attempting operation with RPC endpoint ${this.currentConnectionIndex + 1} (attempt ${attempt + 1})`);
        
        const result = await Promise.race([
          operation(connection),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 15000)
          )
        ]);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          await this.switchToNextConnection();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('All RPC endpoints failed');
  }

  async connectWallet(): Promise<WalletInfo> {
    console.log('Connecting to mobile wallet...');
    
    // Use mobile wallet adapter to connect to real user wallet
    const account = await transact(async (wallet) => {
      const authResult = await wallet.authorize({
        identity: {
          name: 'DEX Screener',
          uri: 'https://dex-screener.com',
        },
        chain: 'solana:testnet',
      });
      
      console.log('Auth result received, processing...');
      console.log('Auth result accounts:', authResult.accounts);
      
      // Get the first account from the authorization result
      const authorizedAccount = authResult.accounts[0];
      console.log('Authorized account:', authorizedAccount);
      
      if (!authorizedAccount || !authorizedAccount.address) {
        throw new Error('No valid account received from wallet');
      }
      
      // Convert the Base64 address to PublicKey using the same method as use-authorization.tsx
      const publicKeyByteArray = toUint8Array(authorizedAccount.address);
      const publicKey = new PublicKey(publicKeyByteArray);
      
      console.log('Converted address to PublicKey:', publicKey.toString());
      
      return {
        publicKey,
        address: authorizedAccount.address,
        label: authorizedAccount.label,
        authToken: authResult.auth_token,
      };
    });

    this.wallet = account;
    const balance = await this.getSOLBalance(account.publicKey);
    
    console.log('Successfully connected to user wallet');
    
    return {
      publicKey: account.publicKey,
      balance,
      isConnected: true,
    };
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (this.wallet && this.wallet.authToken) {
        await transact(async (wallet) => {
          await wallet.deauthorize({ auth_token: this.wallet.authToken });
        });
      }
      this.wallet = null;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    this.wallet = null;
    }
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    try {
      if (this.wallet) {
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

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
    if (!this.wallet) {
        throw new Error('No wallet connected');
    }

      return await transact(async (wallet) => {
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
          minContextSlot: 0,
        });
        return signatures[0];
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
    if (!this.wallet) {
        throw new Error('No wallet connected');
    }

    return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  async getTokenBalances(publicKey: PublicKey): Promise<any[]> {
    try {
      const tokenAccounts = await this.retryWithFallback(async (connection) => {
        return await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
      });

      return tokenAccounts.value;
    } catch (error) {
      console.error('Error getting token balances:', error);
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
} 