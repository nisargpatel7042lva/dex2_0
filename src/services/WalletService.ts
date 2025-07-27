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
  private connection: Connection;
  private wallet: any = null;

  constructor() {
    // Use a more reliable RPC endpoint with better error handling
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
        httpHeaders: {
          'Content-Type': 'application/json',
        },
      }
    );
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
        chain: 'solana:devnet',
      });
      
      console.log('Auth result received, processing...');
      console.log('Auth result accounts:', authResult.accounts);
      
      // Get the first account from the authorization result
      const authorizedAccount = authResult.accounts[0];
      console.log('Authorized account:', authorizedAccount);
      
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
      // Add timeout and retry logic for network requests
      const balance = await Promise.race([
        this.connection.getBalance(publicKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 10000)
        )
      ]);
      return (balance as number) / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
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

      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      await this.connection.confirmTransaction(signature);
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
      
      // For mobile wallet, transactions are signed during send
      return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  async getTokenBalances(publicKey: PublicKey): Promise<any[]> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
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
    return this.connection;
  }
} 