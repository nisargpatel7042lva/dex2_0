import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import * as Linking from 'expo-linking';

export interface WalletInfo {
  publicKey: PublicKey;
  balance: number;
  isConnected: boolean;
}

export class WalletService {
  private connection: Connection;
  private wallet: any = null;
  private keypair: Keypair | null = null;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  async connectWallet(): Promise<WalletInfo> {
    try {
      // For mobile apps, we need to use deep linking to connect to wallets
      // Let's create a simple demo wallet for now since mobile wallet integration is complex
      console.log('Mobile wallet connection - using demo wallet for testing');
      
      // Generate a demo wallet for testing
      const keypair = Keypair.generate();
      this.keypair = keypair;
      
      const balance = await this.getSOLBalance(keypair.publicKey);
      
      return {
        publicKey: keypair.publicKey,
        balance,
        isConnected: true,
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet. Please try again.');
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      this.wallet = null;
      this.keypair = null;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    try {
      if (!this.keypair) {
        return null;
      }

      const balance = await this.getSOLBalance(this.keypair.publicKey);

      return {
        publicKey: this.keypair.publicKey,
        balance,
        isConnected: true,
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  async getSOLBalance(publicKey?: PublicKey): Promise<number> {
    try {
      const targetPublicKey = publicKey || (this.keypair ? this.keypair.publicKey : null);
      
      if (!targetPublicKey) {
        throw new Error('No public key available');
      }

      const balance = await this.connection.getBalance(targetPublicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }

  async requestAirdrop(amount: number = 2): Promise<void> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      const signature = await this.connection.requestAirdrop(
        this.keypair.publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await this.connection.confirmTransaction(signature);
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  async getTokenBalances(publicKey?: PublicKey): Promise<any[]> {
    try {
      const targetPublicKey = publicKey || (this.keypair ? this.keypair.publicKey : null);
      
      if (!targetPublicKey) {
        return [];
      }

      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        targetPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      return tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        balance: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));
    } catch (error) {
      console.error('Error getting token balances:', error);
      return [];
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      // For demo purposes, we'll just return a mock signature
      // In a real app, you'd need to integrate with mobile wallet SDKs
      return 'mock_signature_' + Date.now();
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.keypair) {
        throw new Error('No wallet connected');
      }

      transaction.feePayer = this.keypair.publicKey;
      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;

      transaction.sign(this.keypair);
      return transaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  getPublicKey(): PublicKey | null {
    return this.keypair?.publicKey || null;
  }

  isWalletConnected(): boolean {
    return this.keypair !== null;
  }

  getConnection(): Connection {
    return this.connection;
  }

  getWalletKeypair(): Keypair | null {
    return this.keypair;
  }

  // Helper method to open wallet apps (for future implementation)
  private async openWalletApp(walletType: 'phantom' | 'solflare' | 'slope'): Promise<void> {
    const urls = {
      phantom: 'https://phantom.app/ul/browse/',
      solflare: 'https://solflare.com/',
      slope: 'https://slope.finance/',
    };

    const url = urls[walletType];
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  }
} 