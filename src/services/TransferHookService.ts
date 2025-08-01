import {
    TOKEN_2022_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createInitializeMint2Instruction,
    createInitializeTransferHookInstruction,
    createTransferHookInstruction,
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

export interface TransferHookConfig {
  hookProgramId: PublicKey;
  authority: PublicKey;
  feeAccount?: PublicKey;
}

export interface TransferHookToken {
  mint: PublicKey;
  transferHookProgram: PublicKey;
  decimals: number;
  supply: number;
}

export class TransferHookService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create a Token-2022 mint with Transfer Hook enabled
   */
  async createTransferHookToken(
    payer: Keypair,
    decimals: number,
    supply: number,
    hookProgramId: PublicKey,
    hookAuthority: PublicKey
  ): Promise<PublicKey> {
    try {
      console.log('Creating Token-2022 with Transfer Hook:', {
        decimals,
        supply,
        hookProgramId: hookProgramId.toString(),
        hookAuthority: hookAuthority.toString()
      });
      
      // Generate mint keypair
      const mint = Keypair.generate();
      
      // Get minimum rent for mint account with transfer hook extension
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
      
      // Create mint account instruction
      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 278, // Size of mint account with transfer hook extension
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      });
      
      // Initialize mint with transfer hook instruction
      const initializeMintInstruction = createInitializeMint2Instruction(
        mint.publicKey,
        decimals,
        payer.publicKey,
        payer.publicKey, // freeze authority
        TOKEN_2022_PROGRAM_ID
      );
      
      // Initialize transfer hook instruction
      const initializeTransferHookInstruction = createInitializeTransferHookInstruction(
        mint.publicKey,
        payer.publicKey,
        hookProgramId,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(createMintAccountInstruction);
      transaction.add(initializeMintInstruction);
      transaction.add(initializeTransferHookInstruction);
      
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
      
      console.log('Transfer Hook Token created successfully:', {
        mint: mint.publicKey.toString(),
        signature: signature,
        hookProgramId: hookProgramId.toString()
      });
      
      return mint.publicKey;
    } catch (error) {
      console.error('Error creating Transfer Hook Token:', error);
      throw new Error(`Failed to create Transfer Hook Token: ${error}`);
    }
  }

  /**
   * Transfer tokens with hook execution
   */
  async transferWithHook(
    payer: Keypair,
    source: PublicKey,
    destination: PublicKey,
    mint: PublicKey,
    amount: number,
    hookData?: Buffer
  ): Promise<string> {
    try {
      // Get or create destination token account
      const destTokenAccount = await getAssociatedTokenAddress(
        mint,
        destination,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      const destAccountInfo = await this.connection.getAccountInfo(destTokenAccount);
      
      const transaction = new Transaction();
      
      // Create destination account if it doesn't exist
      if (!destAccountInfo) {
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          payer.publicKey,
          destTokenAccount,
          destination,
          mint,
          TOKEN_2022_PROGRAM_ID
        );
        transaction.add(createAccountInstruction);
      }
      
      // Transfer with hook instruction
      const transferInstruction = createTransferHookInstruction(
        source,
        destTokenAccount,
        payer.publicKey,
        amount,
        hookData || Buffer.alloc(0),
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(transferInstruction);
      
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
      
      console.log('Transfer with hook executed successfully:', {
        source: source.toString(),
        destination: destTokenAccount.toString(),
        amount: amount,
        signature: signature
      });
      
      return signature;
    } catch (error) {
      console.error('Error transferring with hook:', error);
      throw new Error(`Failed to transfer with hook: ${error}`);
    }
  }

  /**
   * Get transfer hook info for a mint
   */
  async getTransferHookInfo(mint: PublicKey): Promise<TransferHookConfig | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(mint);
      if (!accountInfo) return null;
      
      // Parse transfer hook data (simplified)
      const data = accountInfo.data;
      
      // Transfer hook data starts at offset 82 (after basic mint data)
      if (data.length < 82 + 32) return null;
      
      const hookProgramId = new PublicKey(data.slice(82, 114));
      
      return {
        hookProgramId,
        authority: new PublicKey(data.slice(114, 146)),
      };
    } catch (error) {
      console.error('Error getting transfer hook info:', error);
      return null;
    }
  }

  /**
   * Check if a mint has transfer hook enabled
   */
  async hasTransferHook(mint: PublicKey): Promise<boolean> {
    try {
      const hookInfo = await this.getTransferHookInfo(mint);
      return hookInfo !== null;
    } catch (error) {
      return false;
    }
  }
} 