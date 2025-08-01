import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createInitializeTransferHookInstruction,
  createMintToInstruction,
  createUpdateTransferHookInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

export interface Token2022Mint {
  mint: PublicKey;
  decimals: number;
  supply: number;
  authority: PublicKey;
  freezeAuthority: PublicKey | null;
  transferHook?: PublicKey;
}

export interface TransferHookConfig {
  programId: PublicKey;
  authority: PublicKey;
  data?: Buffer;
}

export class Token2022Service {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Initialize a new Token-2022 mint with Transfer Hook support
   */
  async initializeMintWithTransferHook(
    payer: Keypair,
    decimals: number,
    supply: number,
    transferHookConfig?: TransferHookConfig
  ): Promise<PublicKey> {
    try {
      console.log('Creating Token-2022 mint with Transfer Hook:', { decimals, supply, transferHookConfig });
      
      // Generate mint keypair
      const mint = Keypair.generate();
      
      // Get minimum rent for mint account (increased for Transfer Hook)
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
      const mintSpace = transferHookConfig ? 278 : 82; // 278 bytes for Transfer Hook, 82 for basic
      
      // Create mint account instruction
      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintSpace,
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      });
      
      // Initialize mint instruction
      const initializeMintInstruction = createInitializeMint2Instruction(
        mint.publicKey,
        decimals,
        payer.publicKey,
        payer.publicKey, // freeze authority (same as mint authority)
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(createMintAccountInstruction);
      transaction.add(initializeMintInstruction);
      
      // Add Transfer Hook if configured
      if (transferHookConfig) {
        const transferHookInstruction = createInitializeTransferHookInstruction(
          mint.publicKey,
          payer.publicKey,
          transferHookConfig.programId,
          transferHookConfig.authority,
          transferHookConfig.data || Buffer.alloc(0),
          TOKEN_2022_PROGRAM_ID
        );
        transaction.add(transferHookInstruction);
      }
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer.publicKey;
      
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payer, mint]
      );
      
      console.log('Token-2022 mint with Transfer Hook created successfully:', {
        mint: mint.publicKey.toString(),
        signature: signature,
        decimals: decimals,
        hasTransferHook: !!transferHookConfig
      });
      
      return mint.publicKey;
    } catch (error) {
      console.error('Error creating Token-2022 mint with Transfer Hook:', error);
      throw new Error(`Failed to create Token-2022 mint with Transfer Hook: ${error}`);
    }
  }

  /**
   * Update Transfer Hook for existing mint
   */
  async updateTransferHook(
    payer: Keypair,
    mint: PublicKey,
    transferHookConfig: TransferHookConfig
  ): Promise<string> {
    try {
      const transaction = new Transaction();
      
      const updateHookInstruction = createUpdateTransferHookInstruction(
        mint,
        payer.publicKey,
        transferHookConfig.programId,
        transferHookConfig.authority,
        transferHookConfig.data || Buffer.alloc(0),
        TOKEN_2022_PROGRAM_ID
      );
      
      transaction.add(updateHookInstruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer.publicKey;
      
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payer]
      );
      
      console.log('Transfer Hook updated successfully:', {
        mint: mint.toString(),
        signature: signature,
        hookProgram: transferHookConfig.programId.toString()
      });
      
      return signature;
    } catch (error) {
      console.error('Error updating Transfer Hook:', error);
      throw new Error(`Failed to update Transfer Hook: ${error}`);
    }
  }

  /**
   * Initialize a new Token-2022 mint (basic version - for backward compatibility)
   */
  async initializeMint(
    payer: Keypair,
    decimals: number,
    supply: number
  ): Promise<PublicKey> {
    return this.initializeMintWithTransferHook(payer, decimals, supply);
  }

  /**
   * Mint tokens to a specific address
   */
  async mintTo(
    payer: Keypair,
    mint: PublicKey,
    recipient: PublicKey,
    amount: number
  ): Promise<string> {
    try {
      // Get or create associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        recipient,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Check if token account exists
      const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccount);
      
      const transaction = new Transaction();
      
      // Create token account if it doesn't exist
      if (!tokenAccountInfo) {
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          payer.publicKey,
          tokenAccount,
          recipient,
          mint,
          TOKEN_2022_PROGRAM_ID
        );
        transaction.add(createAccountInstruction);
      }
      
      // Mint tokens
      const mintToInstruction = createMintToInstruction(
        mint,
        tokenAccount,
        payer.publicKey,
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(mintToInstruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer.publicKey;
      
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [payer]
      );
      
      console.log('Tokens minted successfully:', {
        mint: mint.toString(),
        recipient: recipient.toString(),
        amount: amount,
        signature: signature
      });
      
      return signature;
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw new Error(`Failed to mint tokens: ${error}`);
    }
  }

  /**
   * Get mint information
   */
  async getMintInfo(mint: PublicKey): Promise<Token2022Mint | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(mint);
      if (!accountInfo) return null;
      
      // Parse mint data (simplified)
      const data = accountInfo.data;
      
      return {
        mint: mint,
        decimals: data[44],
        supply: Number(data.readBigUInt64LE(36)),
        authority: new PublicKey(data.slice(0, 32)),
        freezeAuthority: data[45] === 1 ? new PublicKey(data.slice(32, 64)) : null,
      };
    } catch (error) {
      console.error('Error getting mint info:', error);
      return null;
    }
  }
} 