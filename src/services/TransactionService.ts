import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ConfirmedSignatureInfo, Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { solanaRPCRateLimiter } from '../utils/rate-limiter';

export interface TransactionData {
  signature: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'mint' | 'airdrop' | 'unknown';
  amount?: number;
  tokenSymbol?: string;
  fromAddress?: string;
  toAddress?: string;
  fee: number;
  status: 'success' | 'failed';
  description: string;
}

export interface TokenTransfer {
  mint: string;
  amount: number;
  from: string;
  to: string;
  tokenSymbol?: string;
}

class TransactionService {
  private connection: Connection;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getRecentTransactions(
    walletAddress: PublicKey,
    limit: number = 20
  ): Promise<TransactionData[]> {
    // Global rate limiting
    if (!solanaRPCRateLimiter.canMakeRequest('transactions')) {
      console.log('Rate limited, skipping transaction fetch');
      return [];
    }

    try {
      console.log('🔍 Fetching recent transactions for:', walletAddress.toString());
      
      // Get recent signatures
      const signatures = await this.connection.getSignaturesForAddress(
        walletAddress,
        { limit }
      );

      console.log('🔍 Found signatures:', signatures.length);

      // Fetch transaction details in parallel
      const transactionPromises = signatures.map(sig => 
        this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
      );

      const transactions = await Promise.all(transactionPromises);
      
      // Filter out null transactions and parse them
      const validTransactions = transactions
        .filter((tx): tx is ParsedTransactionWithMeta => tx !== null)
        .map((tx, index) => this.parseTransaction(tx, walletAddress, signatures[index]))
        .filter((tx): tx is TransactionData => tx !== null);

      console.log('🔍 Parsed transactions:', validTransactions.length);
      
      return validTransactions;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  private parseTransaction(
    tx: ParsedTransactionWithMeta,
    walletAddress: PublicKey,
    signatureInfo: ConfirmedSignatureInfo
  ): TransactionData | null {
    try {
      if (!tx.meta || !tx.transaction) {
        return null;
      }

      const timestamp = signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : Date.now();
      const fee = tx.meta.fee || 0;
      const status = tx.meta.err ? 'failed' : 'success';

      // Check if this is an airdrop (System Program transfer)
      if (this.isAirdrop(tx)) {
        return {
          signature: signatureInfo.signature,
          timestamp,
          type: 'airdrop',
          amount: this.getAirdropAmount(tx),
          fee,
          status,
          description: 'Airdrop received'
        };
      }

      // Check for token transfers
      const tokenTransfers = this.getTokenTransfers(tx, walletAddress);
      if (tokenTransfers.length > 0) {
        return this.createTokenTransferTransaction(tokenTransfers[0], signatureInfo, timestamp, fee, status);
      }

      // Check for SOL transfers
      const solTransfer = this.getSOLTransfer(tx, walletAddress);
      if (solTransfer) {
        return this.createSOLTransferTransaction(solTransfer, signatureInfo, timestamp, fee, status);
      }

      // Check for token minting
      if (this.isTokenMint(tx, walletAddress)) {
        return {
          signature: signatureInfo.signature,
          timestamp,
          type: 'mint',
          amount: this.getMintAmount(tx),
          tokenSymbol: this.getMintSymbol(tx),
          fee,
          status,
          description: 'Token minted'
        };
      }

      // Default case
      return {
        signature: signatureInfo.signature,
        timestamp,
        type: 'unknown',
        fee,
        status,
        description: 'Transaction processed'
      };

    } catch (error) {
      console.error('Error parsing transaction:', error);
      return null;
    }
  }

  private isAirdrop(tx: ParsedTransactionWithMeta): boolean {
    if (!tx.transaction.message.instructions) return false;
    
    return tx.transaction.message.instructions.some(ix => {
      if ('programId' in ix && ix.programId) {
        return ix.programId.toString() === '11111111111111111111111111111111'; // System Program
      }
      return false;
    });
  }

  private getAirdropAmount(tx: ParsedTransactionWithMeta): number {
    if (!tx.meta || !tx.meta.postBalances || !tx.meta.preBalances) return 0;
    
    // Calculate the difference in SOL balance
    const preBalance = tx.meta.preBalances[0] || 0;
    const postBalance = tx.meta.postBalances[0] || 0;
    return (postBalance - preBalance) / 1e9; // Convert lamports to SOL
  }

  private getTokenTransfers(tx: ParsedTransactionWithMeta, walletAddress: PublicKey): TokenTransfer[] {
    const transfers: TokenTransfer[] = [];
    
    if (!tx.meta || !tx.meta.postTokenBalances || !tx.meta.preTokenBalances) {
      return transfers;
    }

    const preBalances = new Map<string, number>();
    const postBalances = new Map<string, number>();

    // Build pre-balance map
    tx.meta.preTokenBalances.forEach(balance => {
      if (balance.owner && balance.mint && balance.uiTokenAmount) {
        const key = `${balance.owner}-${balance.mint}`;
        preBalances.set(key, parseFloat(balance.uiTokenAmount.uiAmount?.toString() || '0'));
      }
    });

    // Build post-balance map and calculate differences
    tx.meta.postTokenBalances.forEach(balance => {
      if (balance.owner && balance.mint && balance.uiTokenAmount) {
        const key = `${balance.owner}-${balance.mint}`;
        const postAmount = parseFloat(balance.uiTokenAmount.uiAmount?.toString() || '0');
        const preAmount = preBalances.get(key) || 0;
        const difference = postAmount - preAmount;

        if (Math.abs(difference) > 0.000001) { // Significant change
          transfers.push({
            mint: balance.mint,
            amount: Math.abs(difference),
            from: difference < 0 ? balance.owner : '',
            to: difference > 0 ? balance.owner : '',
            tokenSymbol: balance.mint || undefined
          });
        }
      }
    });

    return transfers;
  }

  private getSOLTransfer(tx: ParsedTransactionWithMeta, walletAddress: PublicKey): { amount: number; from: string; to: string } | null {
    if (!tx.meta || !tx.meta.postBalances || !tx.meta.preBalances) return null;

    const accountKeys = tx.transaction.message.accountKeys;
    const preBalances = tx.meta.preBalances;
    const postBalances = tx.meta.postBalances;

    // Find the wallet's account index
    const walletIndex = accountKeys.findIndex(key => 
      'pubkey' in key && key.pubkey.toString() === walletAddress.toString()
    );

    if (walletIndex === -1) return null;

    const preBalance = preBalances[walletIndex] || 0;
    const postBalance = postBalances[walletIndex] || 0;
    const difference = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

    if (Math.abs(difference) < 0.000001) return null; // No significant change

    return {
      amount: Math.abs(difference),
      from: difference < 0 ? walletAddress.toString() : '',
      to: difference > 0 ? walletAddress.toString() : ''
    };
  }

  private isTokenMint(tx: ParsedTransactionWithMeta, walletAddress: PublicKey): boolean {
    if (!tx.transaction.message.instructions) return false;
    
    return tx.transaction.message.instructions.some(ix => {
      if ('programId' in ix && ix.programId) {
        const programId = ix.programId.toString();
        return programId === TOKEN_PROGRAM_ID.toString() || 
               programId === TOKEN_2022_PROGRAM_ID.toString();
      }
      return false;
    });
  }

  private getMintAmount(tx: ParsedTransactionWithMeta): number {
    // This would need more complex parsing based on the specific mint instruction
    // For now, return a default value
    return 1;
  }

  private getMintSymbol(tx: ParsedTransactionWithMeta): string {
    // This would need to be extracted from the mint data
    // For now, return a default value
    return 'TOKEN';
  }

  private createTokenTransferTransaction(
    transfer: TokenTransfer,
    signatureInfo: ConfirmedSignatureInfo,
    timestamp: number,
    fee: number,
    status: 'success' | 'failed'
  ): TransactionData {
    const isReceive = transfer.to && transfer.to.length > 0;
    const type = isReceive ? 'receive' : 'send';
    
    return {
      signature: signatureInfo.signature,
      timestamp,
      type,
      amount: transfer.amount,
      tokenSymbol: transfer.tokenSymbol,
      fromAddress: transfer.from,
      toAddress: transfer.to,
      fee,
      status,
      description: `${isReceive ? 'Received' : 'Sent'} ${transfer.amount} ${transfer.tokenSymbol || 'tokens'}`
    };
  }

  private createSOLTransferTransaction(
    transfer: { amount: number; from: string; to: string },
    signatureInfo: ConfirmedSignatureInfo,
    timestamp: number,
    fee: number,
    status: 'success' | 'failed'
  ): TransactionData {
    const isReceive = transfer.to && transfer.to.length > 0;
    const type = isReceive ? 'receive' : 'send';
    
    return {
      signature: signatureInfo.signature,
      timestamp,
      type,
      amount: transfer.amount,
      tokenSymbol: 'SOL',
      fromAddress: transfer.from,
      toAddress: transfer.to,
      fee,
      status,
      description: `${isReceive ? 'Received' : 'Sent'} ${transfer.amount.toFixed(4)} SOL`
    };
  }
}

export default TransactionService;
