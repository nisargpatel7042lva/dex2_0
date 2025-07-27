import {
    TOKEN_2022_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createMint,
    getAccount,
    getAssociatedTokenAddress,
    getMinimumBalanceForRentExemptMint,
    getMint,
    mintTo,
    transfer
} from '@solana/spl-token';
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';

export interface Token2022Config {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  transferHook?: {
    programId: PublicKey;
    enabled: boolean;
  };
  metadata?: {
    description?: string;
    image?: string;
    website?: string;
  };
}

export interface CreateTokenResult {
  mint: PublicKey;
  tokenAccount: PublicKey;
  transaction: string;
}

export interface TokenInfo {
  mint: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  transferHook?: {
    programId: PublicKey;
    enabled: boolean;
  };
}

export class Token2022Service {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async createToken2022(
    payer: Keypair,
    config: Token2022Config
  ): Promise<CreateTokenResult> {
    try {
      const mint = Keypair.generate();
      const tokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        payer.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Get minimum rent for mint
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Create mint account
      const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82, // Mint account size
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      });

      // Initialize mint
      const initializeMintIx = createMint(
        payer.publicKey,
        mint.publicKey,
        config.decimals,
        payer.publicKey,
        payer.publicKey,
        [],
        TOKEN_2022_PROGRAM_ID
      );

      // Create associated token account
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        tokenAccount,
        payer.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID
      );

      // Mint initial supply
      const mintToIx = mintTo(
        tokenAccount,
        mint.publicKey,
        payer.publicKey,
        config.totalSupply * Math.pow(10, config.decimals),
        [],
        TOKEN_2022_PROGRAM_ID
      );

      transaction.add(createMintAccountIx, initializeMintIx, createAtaIx, mintToIx);

      // Add transfer hook if specified
      if (config.transferHook?.enabled && config.transferHook.programId) {
        const transferHookIx = this.createInitializeTransferHookInstruction(
          mint.publicKey,
          payer.publicKey,
          config.transferHook.programId
        );
        transaction.add(transferHookIx);
      }

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payer, mint]
      );

      return {
        mint: mint.publicKey,
        tokenAccount,
        transaction: signature,
      };
    } catch (error) {
      console.error('Error creating Token-2022:', error);
      throw error;
    }
  }

  async getTokenInfo(mintAddress: PublicKey): Promise<TokenInfo | null> {
    try {
      const mintInfo = await getMint(this.connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
      
      // Mock data for demo purposes - in real app, fetch from API
      const mockData = {
        name: 'Dex2.0 Token',
        symbol: 'DEX2',
        price: 0.25,
        marketCap: 2500000,
        volume24h: 125000,
        change24h: 5.2,
      };

      return {
        mint: mintAddress,
        name: mockData.name,
        symbol: mockData.symbol,
        decimals: mintInfo.decimals,
        totalSupply: Number(mintInfo.supply),
        circulatingSupply: Number(mintInfo.supply) * 0.8, // Mock circulating supply
        price: mockData.price,
        marketCap: mockData.marketCap,
        volume24h: mockData.volume24h,
        change24h: mockData.change24h,
        transferHook: mintInfo.transferHook ? {
          programId: mintInfo.transferHook,
          enabled: true,
        } : undefined,
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  async getTokenBalance(
    mintAddress: PublicKey,
    ownerAddress: PublicKey
  ): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        ownerAddress,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const accountInfo = await getAccount(this.connection, tokenAccount);
      return Number(accountInfo.amount);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  async transferTokens(
    from: Keypair,
    to: PublicKey,
    mint: PublicKey,
    amount: number
  ): Promise<string> {
    try {
      const fromTokenAccount = await getAssociatedTokenAddress(
        mint,
        from.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const toTokenAccount = await getAssociatedTokenAddress(
        mint,
        to,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Create destination token account if it doesn't exist
      try {
        await getAccount(this.connection, toTokenAccount);
      } catch {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          from.publicKey,
          toTokenAccount,
          to,
          mint,
          TOKEN_2022_PROGRAM_ID
        );
        transaction.add(createAtaIx);
      }

      // Transfer tokens
      const transferIx = transfer(
        fromTokenAccount,
        toTokenAccount,
        from.publicKey,
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      );

      transaction.add(transferIx);

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [from]
      );

      return signature;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }

  private createInitializeTransferHookInstruction(
    mint: PublicKey,
    authority: PublicKey,
    hookProgramId: PublicKey
  ): any {
    // This is a simplified demo implementation
    // In a real implementation, you would use the actual Token-2022 transfer hook instructions
    return {
      programId: TOKEN_2022_PROGRAM_ID,
      keys: [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: hookProgramId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from([/* transfer hook instruction data */]),
    };
  }

  async getTransferHookInfo(mintAddress: PublicKey): Promise<any> {
    try {
      const mintInfo = await getMint(this.connection, mintAddress, undefined, TOKEN_2022_PROGRAM_ID);
      return mintInfo.transferHook ? {
        programId: mintInfo.transferHook,
        enabled: true,
      } : null;
    } catch (error) {
      console.error('Error getting transfer hook info:', error);
      return null;
    }
  }
} 