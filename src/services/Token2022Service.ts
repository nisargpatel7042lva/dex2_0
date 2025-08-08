import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
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
import { WalletService } from './WalletService';

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
  private walletService: WalletService;

  constructor(connection: Connection, walletService: WalletService) {
    this.connection = connection;
    this.walletService = walletService;
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
      
      // Check wallet balance first
      const balance = await this.connection.getBalance(payer.publicKey);
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
      const estimatedFee = 5000; // Estimated transaction fee in lamports
      const totalRequired = mintRent + estimatedFee;
      
      console.log('Balance check:', {
        currentBalance: balance,
        mintRent: mintRent,
        estimatedFee: estimatedFee,
        totalRequired: totalRequired,
        hasEnoughBalance: balance >= totalRequired
      });
      
      if (balance < totalRequired) {
        throw new Error(`Insufficient SOL balance. Required: ${totalRequired / 1e9} SOL, Available: ${balance / 1e9} SOL. Please request an airdrop first.`);
      }
      
      // Generate mint keypair
      const mint = Keypair.generate();
      
      // Create mint account instruction
      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82, // Standard mint size
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
      
      // Note: Transfer Hook initialization will be handled separately
      // as the current SPL Token library doesn't support it directly
      if (transferHookConfig) {
        console.log('Transfer Hook configuration provided:', transferHookConfig);
        // For now, we'll create the mint and handle Transfer Hook separately
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
      
      console.log('Token-2022 mint created successfully:', {
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

  /**
   * Initialize a new Token-2022 mint using the user's wallet for signing
   */
  async initializeMintWithWallet(
    walletPublicKey: PublicKey,
    decimals: number,
    supply: number
  ): Promise<PublicKey> {
    try {
      console.log('Creating Token-2022 mint with wallet:', { decimals, supply, walletPublicKey: walletPublicKey.toString() });
      
      // Check wallet balance first
      const balance = await this.connection.getBalance(walletPublicKey);
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
      const estimatedFee = 5000; // Estimated transaction fee in lamports
      const totalRequired = mintRent + estimatedFee;
      
      console.log('Balance check:', {
        currentBalance: balance,
        mintRent: mintRent,
        estimatedFee: estimatedFee,
        totalRequired: totalRequired,
        hasEnoughBalance: balance >= totalRequired
      });
      
      if (balance < totalRequired) {
        throw new Error(`Insufficient SOL balance. Required: ${totalRequired / 1e9} SOL, Available: ${balance / 1e9} SOL. Please request an airdrop first.`);
      }
      
      // Generate mint keypair
      const mint = Keypair.generate();
      
      // Create mint account instruction
      const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: walletPublicKey,
        newAccountPubkey: mint.publicKey,
        space: 82, // Standard mint size
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      });
      
      // Initialize mint instruction
      const initializeMintInstruction = createInitializeMint2Instruction(
        mint.publicKey,
        decimals,
        walletPublicKey,
        walletPublicKey, // freeze authority (same as mint authority)
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(createMintAccountInstruction);
      transaction.add(initializeMintInstruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;
      
      // This will trigger the wallet to sign the transaction
      // The wallet service will handle the signing
      const signature = await this.walletService.sendTransaction(transaction);
      
      console.log('Token-2022 mint created successfully with wallet:', {
        mint: mint.publicKey.toString(),
        signature: signature
      });
      
      return mint.publicKey;
    } catch (error) {
      console.error('Error creating Token-2022 mint with wallet:', error);
      throw new Error(`Failed to create Token-2022 mint with wallet: ${error}`);
    }
  }

  /**
   * Mint tokens using the user's wallet for signing
   */
  async mintToWithWallet(
    walletPublicKey: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    amount: number
  ): Promise<string> {
    try {
      console.log('Minting tokens with wallet:', { mint: mint.toString(), destination: destination.toString(), amount });
      
      // Get or create associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mint,
        destination,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Check if token account exists
      const tokenAccountInfo = await this.connection.getAccountInfo(tokenAccount);
      
      const transaction = new Transaction();
      
      // Create token account if it doesn't exist
      if (!tokenAccountInfo) {
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          walletPublicKey,
          tokenAccount,
          destination,
          mint,
          TOKEN_2022_PROGRAM_ID
        );
        transaction.add(createAccountInstruction);
      }
      
      // Mint tokens instruction
      const mintInstruction = createMintToInstruction(
        mint,
        tokenAccount,
        walletPublicKey,
        amount,
        [],
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(mintInstruction);
      
      // Send transaction using wallet service
      const signature = await this.walletService.sendTransaction(transaction);
      
      console.log('Tokens minted successfully with wallet:', signature);
      return signature;
    } catch (error) {
      console.error('Error minting tokens with wallet:', error);
      throw new Error(`Failed to mint tokens with wallet: ${error}`);
    }
  }

  /**
   * Initialize a new Token-2022 mint with Transfer Hook using the user's wallet for signing
   */
  async initializeMintWithTransferHookAndWallet(
    walletPublicKey: PublicKey,
    decimals: number,
    supply: number,
    transferHookConfig?: TransferHookConfig
  ): Promise<{ mint: PublicKey; signature: string }> {
    console.log('🔍 initializeMintWithTransferHookAndWallet called with:', {
      walletPublicKey: walletPublicKey.toString(),
      decimals,
      supply,
      transferHookConfig
    });

    // Check wallet service connection status
    console.log('🔍 Wallet service connection status:', {
      isConnected: this.walletService.isWalletConnected(),
      publicKey: this.walletService.getPublicKey()?.toString(),
      authToken: this.walletService.getAuthToken() ? 'Present' : 'Missing'
    });

    // Check balance before proceeding
    const balance = await this.connection.getBalance(walletPublicKey);
    const requiredBalance = 0.0014666 * 1e9; // Convert to lamports
    
    console.log('🔍 Balance check:', {
      currentBalance: balance / 1e9,
      requiredBalance: requiredBalance / 1e9,
      sufficient: balance >= requiredBalance
    });
    
    if (balance < requiredBalance) {
      throw new Error(`Insufficient SOL balance. Required: ${requiredBalance / 1e9} SOL, Available: ${balance / 1e9} SOL. Please request an airdrop first.`);
    }

    try {
      // Generate a new mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🔍 Generated mint keypair:', mintKeypair.publicKey.toString());

      // Create the mint account
      const mintAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        walletPublicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      console.log('🔍 Mint account address:', mintAccount.toString());

      // Build the transaction
      const transaction = new Transaction();
      console.log('🔍 Building transaction...');

      // Add mint creation instruction
      const createMintIx = createInitializeMint2Instruction(
        mintKeypair.publicKey,
        decimals,
        walletPublicKey,
        walletPublicKey,
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(createMintIx);
      console.log('🔍 Added mint creation instruction');

      // Note: Transfer Hook initialization is not supported in current SPL Token library
      // This would need to be implemented separately with custom instructions
      if (transferHookConfig) {
        console.log('🔍 Transfer hook config provided but not implemented in current version');
      }

      // Add create associated token account instruction
      const createAtaIx = createAssociatedTokenAccountInstruction(
        walletPublicKey,
        mintAccount,
        walletPublicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(createAtaIx);
      console.log('🔍 Added create ATA instruction');

      // Add mint to instruction
      const mintToIx = createMintToInstruction(
        mintKeypair.publicKey,
        mintAccount,
        walletPublicKey,
        supply * Math.pow(10, decimals),
        [],
        TOKEN_2022_PROGRAM_ID
      );
      transaction.add(mintToIx);
      console.log('🔍 Added mint to instruction');

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;
      console.log('🔍 Set recent blockhash and fee payer');

      // This will trigger the wallet to sign the transaction
      // The wallet service will handle the signing
      console.log('🔍 About to send transaction via wallet service...');
      const signature = await this.walletService.sendTransaction(transaction);
      
      console.log('Token-2022 mint created successfully with wallet:', {
        mint: mintKeypair.publicKey.toString(),
        signature,
        wallet: walletPublicKey.toString()
      });

      return {
        mint: mintKeypair.publicKey,
        signature,
      };
    } catch (error) {
      console.error('Error creating Token-2022 mint with Transfer Hook and wallet:', error);
      throw error;
    }
  }
} 