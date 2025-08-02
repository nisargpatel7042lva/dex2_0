import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Token2022Service } from './Token2022Service';

export interface TokenLaunchConfig {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  totalSupply: number;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface TokenLaunchResult {
  mint: PublicKey;
  signature: string;
  tokenAccount: PublicKey;
}

export class TokenLaunchService {
  private connection: Connection;
  private token2022Service: Token2022Service;

  constructor(connection: Connection) {
    this.connection = connection;
    this.token2022Service = new Token2022Service(connection);
  }

  /**
   * Create a new Token-2022 token
   */
  async createToken(
    payer: Keypair,
    config: TokenLaunchConfig
  ): Promise<TokenLaunchResult> {
    try {
      console.log('Creating Token-2022 with config:', config);
      
      // Create the mint using Token2022Service
      const mint = await this.token2022Service.initializeMint(
        payer,
        config.decimals,
        config.totalSupply
      );
      
      // Mint initial supply to the payer
      const signature = await this.token2022Service.mintTo(
        payer,
        mint,
        payer.publicKey,
        config.totalSupply
      );
      
      // Get associated token account
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        payer.publicKey,
        false,
        await import('@solana/spl-token').then(m => m.TOKEN_2022_PROGRAM_ID)
      );
      
      console.log('Token created successfully:', {
        mint: mint.toString(),
        signature: signature,
        tokenAccount: tokenAccount.toString()
      });
      
      return { 
        mint: mint, 
        signature: signature, 
        tokenAccount: tokenAccount 
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw new Error(`Failed to create token: ${error}`);
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(mint: PublicKey): Promise<any> {
    try {
      const mintInfo = await this.token2022Service.getMintInfo(mint);
      return mintInfo;
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(mint: PublicKey, owner: PublicKey): Promise<number> {
    try {
      const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        owner,
        false,
        await import('@solana/spl-token').then(m => m.TOKEN_2022_PROGRAM_ID)
      );
      
      const accountInfo = await getAccount(this.connection, tokenAccount);
      return Number(accountInfo.amount);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }
} 