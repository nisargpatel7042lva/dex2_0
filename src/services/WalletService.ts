import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';

export interface WalletInfo {
  publicKey: PublicKey;
  balance: number;
  isConnected: boolean;
}

export interface TokenBalance {
  mint: PublicKey;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price?: number;
  value?: number;
}

export class WalletService {
  private connection: Connection;
  private wallet: Keypair | null = null;
  private walletInfo: WalletInfo | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async connectWallet(privateKeyString?: string): Promise<WalletInfo> {
    try {
      let keypair: Keypair;

      if (privateKeyString) {
        // Import existing wallet
        const privateKeyBytes = bs58.decode(privateKeyString);
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else {
        // Generate new wallet for demo
        keypair = Keypair.generate();
        console.log('Generated new wallet for demo:', keypair.publicKey.toString());
      }

      this.wallet = keypair;
      const balance = await this.connection.getBalance(keypair.publicKey);
      
      this.walletInfo = {
        publicKey: keypair.publicKey,
        balance: balance / LAMPORTS_PER_SOL,
        isConnected: true,
      };

      return this.walletInfo;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.wallet = null;
    this.walletInfo = null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.wallet || !this.walletInfo) {
      return null;
    }

    // Update balance
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    this.walletInfo.balance = balance / LAMPORTS_PER_SOL;

    return this.walletInfo;
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet]
      );
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    transaction.feePayer = this.wallet.publicKey;
    transaction.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;

    transaction.sign(this.wallet);
    return transaction;
  }

  async requestAirdrop(amount: number = 1): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.connection.requestAirdrop(
        this.wallet.publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature);
      
      // Update wallet info
      if (this.walletInfo) {
        this.walletInfo.balance += amount;
      }

      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
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

  async getTokenBalances(): Promise<TokenBalance[]> {
    if (!this.wallet) {
      return [];
    }

    try {
      // Mock token balances for demo - in real app, fetch from API
      const mockTokens: TokenBalance[] = [
        {
          mint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
          symbol: 'SOL',
          name: 'Solana',
          balance: this.walletInfo?.balance || 0,
          decimals: 9,
          price: 100,
          value: (this.walletInfo?.balance || 0) * 100,
        },
        {
          mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 1000,
          decimals: 6,
          price: 1,
          value: 1000,
        },
        {
          mint: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'), // Token-2022
          symbol: 'DEX2',
          name: 'Dex2.0 Token',
          balance: 5000,
          decimals: 9,
          price: 0.25,
          value: 1250,
        },
      ];

      return mockTokens;
    } catch (error) {
      console.error('Error getting token balances:', error);
      return [];
    }
  }

  async getSOLBalance(): Promise<number> {
    if (!this.wallet) {
      return 0;
    }

    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      return 0;
    }
  }

  async transferSOL(to: PublicKey, amount: number): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: to,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet]
      );

      // Update wallet info
      if (this.walletInfo) {
        this.walletInfo.balance -= amount;
      }

      return signature;
    } catch (error) {
      console.error('Error transferring SOL:', error);
      throw error;
    }
  }

  getWalletKeypair(): Keypair | null {
    return this.wallet;
  }
} 