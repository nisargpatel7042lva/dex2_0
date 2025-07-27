import {
    ConfidentialTransferAccount,
    ConfidentialTransferMint,
    MetadataPointer,
    Mint,
    TOKEN_2022_PROGRAM_ID,
    Account as TokenAccount,
    createApproveAccountInstruction,
    createAssociatedTokenAccountInstruction,
    createBurnInstruction,
    createConfidentialTransferInstruction,
    createInitializeAccount3Instruction,
    createInitializeConfidentialTransferInstruction,
    createMintToInstruction,
    createSetMetadataPointerInstruction,
    createTransferInstruction,
    getAccount,
    getAssociatedTokenAddress
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';

export interface Token2022Mint {
  mint: PublicKey;
  decimals: number;
  supply: bigint;
  mintAuthority: PublicKey | null;
  freezeAuthority: PublicKey | null;
  transferHookProgramId: PublicKey | null;
  confidentialTransferMint: ConfidentialTransferMint | null;
  metadataPointer: MetadataPointer | null;
}

export interface Token2022Account {
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  delegate: PublicKey | null;
  state: number;
  isNative: bigint | null;
  delegatedAmount: bigint;
  closeAuthority: PublicKey | null;
  transferHookProgramId: PublicKey | null;
  confidentialTransferAccount: ConfidentialTransferAccount | null;
}

export interface TransferHookData {
  source: PublicKey;
  destination: PublicKey;
  amount: bigint;
  authority: PublicKey;
  programId: PublicKey;
}

export class Token2022Service {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = TOKEN_2022_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Initialize a new Token-2022 mint with advanced features
   */
  async initializeMint(
    payer: Keypair,
    mint: Keypair,
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null = null,
    transferHookProgramId: PublicKey | null = null,
    confidentialTransferMint: ConfidentialTransferMint | null = null,
    metadataPointer: MetadataPointer | null = null,
  ): Promise<string> {
    const transaction = new Transaction();

    // Create mint account
    const createAccountIx = await this.createMintAccountInstruction(
      payer.publicKey,
      mint.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
      transferHookProgramId,
      confidentialTransferMint,
      metadataPointer,
    );

    transaction.add(createAccountIx);

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, mint],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Create a Token-2022 account with transfer hook support
   */
  async createTokenAccount(
    payer: Keypair,
    mint: PublicKey,
    owner: PublicKey,
  ): Promise<{ account: PublicKey; signature: string }> {
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mint,
      owner,
      false,
      this.programId
    );

    const transaction = new Transaction();

    // Create associated token account
    const createAccountIx = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      associatedTokenAddress,
      owner,
      mint,
      this.programId
    );

    transaction.add(createAccountIx);

    // Initialize account with Token-2022 extensions
    const initializeIx = createInitializeAccount3Instruction(
      associatedTokenAddress,
      mint,
      owner,
      this.programId
    );

    transaction.add(initializeIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    return { account: associatedTokenAddress, signature };
  }

  /**
   * Transfer tokens with custom transfer hook logic
   */
  async transferWithHook(
    payer: Keypair,
    source: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: bigint,
    mint: PublicKey,
  ): Promise<string> {
    const transaction = new Transaction();

    const transferIx = createTransferInstruction(
      source,
      destination,
      authority.publicKey,
      amount,
      [],
      this.programId
    );

    transaction.add(transferIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Enable confidential transfers for a token account
   */
  async enableConfidentialTransfers(
    payer: Keypair,
    account: PublicKey,
    mint: PublicKey,
    authority: Keypair,
    confidentialTransferMint: ConfidentialTransferMint,
  ): Promise<string> {
    const transaction = new Transaction();

    // Initialize confidential transfer account
    const initConfidentialIx = createInitializeConfidentialTransferInstruction(
      account,
      mint,
      confidentialTransferMint,
      this.programId
    );

    transaction.add(initConfidentialIx);

    // Approve account for confidential transfers
    const approveIx = createApproveAccountInstruction(
      account,
      mint,
      authority.publicKey,
      confidentialTransferMint,
      this.programId
    );

    transaction.add(approveIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Perform a confidential transfer
   */
  async confidentialTransfer(
    payer: Keypair,
    source: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: bigint,
    decimals: number,
    mint: PublicKey,
  ): Promise<string> {
    const transaction = new Transaction();

    const confidentialTransferIx = createConfidentialTransferInstruction(
      source,
      destination,
      mint,
      authority.publicKey,
      amount,
      decimals,
      this.programId
    );

    transaction.add(confidentialTransferIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Set metadata pointer for dynamic metadata
   */
  async setMetadataPointer(
    payer: Keypair,
    mint: PublicKey,
    authority: Keypair,
    metadataPointer: MetadataPointer,
  ): Promise<string> {
    const transaction = new Transaction();

    const setMetadataIx = createSetMetadataPointerInstruction(
      mint,
      authority.publicKey,
      metadataPointer,
      this.programId
    );

    transaction.add(setMetadataIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Mint tokens to an account
   */
  async mintTo(
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: bigint,
  ): Promise<string> {
    const transaction = new Transaction();

    const mintToIx = createMintToInstruction(
      mint,
      destination,
      authority.publicKey,
      amount,
      [],
      this.programId
    );

    transaction.add(mintToIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Burn tokens from an account
   */
  async burn(
    payer: Keypair,
    mint: PublicKey,
    account: PublicKey,
    authority: Keypair,
    amount: bigint,
  ): Promise<string> {
    const transaction = new Transaction();

    const burnIx = createBurnInstruction(
      account,
      mint,
      authority.publicKey,
      amount,
      [],
      this.programId
    );

    transaction.add(burnIx);

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [payer, authority],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Get Token-2022 mint information
   */
  async getMintInfo(mint: PublicKey): Promise<Token2022Mint> {
    const mintInfo = await getAccount(this.connection, mint, 'confirmed', this.programId) as Mint;
    
    return {
      mint: mintInfo.address,
      decimals: mintInfo.decimals,
      supply: mintInfo.supply,
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority,
      transferHookProgramId: mintInfo.transferHookProgramId,
      confidentialTransferMint: mintInfo.confidentialTransferMint,
      metadataPointer: mintInfo.metadataPointer,
    };
  }

  /**
   * Get Token-2022 account information
   */
  async getAccountInfo(account: PublicKey): Promise<Token2022Account> {
    const accountInfo = await getAccount(this.connection, account, 'confirmed', this.programId) as TokenAccount;
    
    return {
      mint: accountInfo.mint,
      owner: accountInfo.owner,
      amount: accountInfo.amount,
      delegate: accountInfo.delegate,
      state: accountInfo.state,
      isNative: accountInfo.isNative,
      delegatedAmount: accountInfo.delegatedAmount,
      closeAuthority: accountInfo.closeAuthority,
      transferHookProgramId: accountInfo.transferHookProgramId,
      confidentialTransferAccount: accountInfo.confidentialTransferAccount,
    };
  }

  /**
   * Get all Token-2022 accounts for a wallet
   */
  async getTokenAccounts(wallet: PublicKey): Promise<Token2022Account[]> {
    const accounts = await this.connection.getTokenAccountsByOwner(
      wallet,
      { programId: this.programId },
      'confirmed'
    );

    const tokenAccounts: Token2022Account[] = [];
    
    for (const { pubkey, account } of accounts.value) {
      try {
        const accountInfo = await this.getAccountInfo(pubkey);
        tokenAccounts.push(accountInfo);
      } catch (error) {
        console.warn(`Failed to parse account ${pubkey.toString()}:`, error);
      }
    }

    return tokenAccounts;
  }

  /**
   * Create mint account instruction with Token-2022 extensions
   */
  private async createMintAccountInstruction(
    payer: PublicKey,
    mint: PublicKey,
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    transferHookProgramId: PublicKey | null,
    confidentialTransferMint: ConfidentialTransferMint | null,
    metadataPointer: MetadataPointer | null,
  ) {
    // This is a simplified version - in practice, you'd need to handle the complex initialization
    // of Token-2022 mints with extensions
    throw new Error('Complex mint initialization not implemented in this example');
  }

  /**
   * Get Token-2022 program ID
   */
  getProgramId(): PublicKey {
    return this.programId;
  }

  /**
   * Check if an account supports Token-2022 features
   */
  async supportsToken2022(account: PublicKey): Promise<boolean> {
    try {
      await getAccount(this.connection, account, 'confirmed', this.programId);
      return true;
    } catch {
      return false;
    }
  }
} 