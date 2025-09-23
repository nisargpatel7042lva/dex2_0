import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { solanaRPCRateLimiter } from '../utils/rate-limiter';

export interface TokenLaunchData {
  mint: string;
  name?: string;
  symbol?: string;
  decimals: number;
  totalSupply: number;
  creator: string;
  timestamp: number;
  signature: string;
  programId: string;
  isToken2022: boolean;
}

class TokenLaunchDataService {
  private connection: Connection;
  private cache: Map<string, TokenLaunchData[]> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 10000; // 10 seconds between requests

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getRecentTokenLaunches(limit: number = 10): Promise<TokenLaunchData[]> {
    // Global rate limiting
    if (!solanaRPCRateLimiter.canMakeRequest('token_launches')) {
      console.log('Rate limited, skipping token launch fetch');
      return [];
    }

    try {
      console.log('🔍 Fetching recent token launches...');
      
      // Get recent signatures for token program
      const tokenProgramSignatures = await this.connection.getSignaturesForAddress(
        TOKEN_PROGRAM_ID,
        { limit: 50 } // Get more to filter for mint creation
      );

      const token2022Signatures = await this.connection.getSignaturesForAddress(
        TOKEN_2022_PROGRAM_ID,
        { limit: 50 }
      );

      // Combine and sort by timestamp
      const allSignatures = [...tokenProgramSignatures, ...token2022Signatures]
        .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
        .slice(0, limit * 3); // Get more to filter for actual mints

      console.log('🔍 Found signatures:', allSignatures.length);

      // Fetch transaction details in parallel
      const transactionPromises = allSignatures.map(sig => 
        this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
      );

      const transactions = await Promise.all(transactionPromises);
      
      // Filter and parse mint creation transactions
      const tokenLaunches = transactions
        .filter((tx): tx is ParsedTransactionWithMeta => tx !== null)
        .map((tx, index) => this.parseTokenLaunch(tx, allSignatures[index]))
        .filter((launch): launch is TokenLaunchData => launch !== null)
        .slice(0, limit);

      console.log('🔍 Found token launches:', tokenLaunches.length);
      
      return tokenLaunches;
    } catch (error) {
      console.error('Error fetching recent token launches:', error);
      return [];
    }
  }

  async getTokenLaunchesByCreator(creatorAddress: string, limit: number = 10): Promise<TokenLaunchData[]> {
    try {
      console.log('🔍 Fetching token launches by creator:', creatorAddress);
      
      // Get recent signatures for the creator
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(creatorAddress),
        { limit: 100 }
      );

      console.log('🔍 Found creator signatures:', signatures.length);

      // Fetch transaction details in parallel
      const transactionPromises = signatures.map(sig => 
        this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
      );

      const transactions = await Promise.all(transactionPromises);
      
      // Filter and parse mint creation transactions
      const tokenLaunches = transactions
        .filter((tx): tx is ParsedTransactionWithMeta => tx !== null)
        .map((tx, index) => this.parseTokenLaunch(tx, signatures[index]))
        .filter((launch): launch is TokenLaunchData => launch !== null)
        .slice(0, limit);

      console.log('🔍 Found creator token launches:', tokenLaunches.length);
      
      return tokenLaunches;
    } catch (error) {
      console.error('Error fetching token launches by creator:', error);
      return [];
    }
  }

  private parseTokenLaunch(
    tx: ParsedTransactionWithMeta,
    signatureInfo: { signature: string; blockTime?: number }
  ): TokenLaunchData | null {
    try {
      if (!tx.meta || !tx.transaction) {
        return null;
      }

      // Check if this transaction contains a mint creation instruction
      const mintCreation = this.findMintCreationInstruction(tx);
      if (!mintCreation) {
        return null;
      }

      const timestamp = signatureInfo.blockTime ? signatureInfo.blockTime * 1000 : Date.now();
      const isToken2022 = mintCreation.programId === TOKEN_2022_PROGRAM_ID.toString();

      return {
        mint: mintCreation.mint,
        name: mintCreation.name,
        symbol: mintCreation.symbol,
        decimals: mintCreation.decimals,
        totalSupply: mintCreation.totalSupply,
        creator: mintCreation.creator,
        timestamp,
        signature: signatureInfo.signature,
        programId: mintCreation.programId,
        isToken2022
      };

    } catch (error) {
      console.error('Error parsing token launch:', error);
      return null;
    }
  }

  private findMintCreationInstruction(tx: ParsedTransactionWithMeta): {
    mint: string;
    name?: string;
    symbol?: string;
    decimals: number;
    totalSupply: number;
    creator: string;
    programId: string;
  } | null {
    if (!tx.transaction.message.instructions) {
      return null;
    }

    for (const ix of tx.transaction.message.instructions) {
      if ('programId' in ix && ix.programId) {
        const programId = ix.programId.toString();
        
        // Check if this is a token program instruction
        if (programId === TOKEN_PROGRAM_ID.toString() || programId === TOKEN_2022_PROGRAM_ID.toString()) {
          // Look for InitializeMint instruction
          if ('parsed' in ix && ix.parsed && ix.parsed.type === 'initializeMint') {
            const parsed = ix.parsed as any;
            
            return {
              mint: parsed.info.mint,
              decimals: parsed.info.decimals,
              totalSupply: 0, // Will be set by mintTo instruction
              creator: parsed.info.mintAuthority || '',
              programId
            };
          }
        }
      }
    }

    // If we found a mint creation, also look for the mintTo instruction to get total supply
    const mintToInfo = this.findMintToInstruction(tx);
    if (mintToInfo) {
      return {
        mint: mintToInfo.mint,
        decimals: mintToInfo.decimals || 9,
        totalSupply: mintToInfo.amount,
        creator: mintToInfo.authority || '',
        programId: mintToInfo.programId
      };
    }

    return null;
  }

  private findMintToInstruction(tx: ParsedTransactionWithMeta): {
    mint: string;
    amount: number;
    decimals?: number;
    authority?: string;
    programId: string;
  } | null {
    if (!tx.transaction.message.instructions) {
      return null;
    }

    for (const ix of tx.transaction.message.instructions) {
      if ('programId' in ix && ix.programId) {
        const programId = ix.programId.toString();
        
        if (programId === TOKEN_PROGRAM_ID.toString() || programId === TOKEN_2022_PROGRAM_ID.toString()) {
          if ('parsed' in ix && ix.parsed && ix.parsed.type === 'mintTo') {
            const parsed = ix.parsed as any;
            
            return {
              mint: parsed.info.mint,
              amount: parseFloat(parsed.info.tokenAmount.uiAmount || '0'),
              authority: parsed.info.authority || '',
              programId
            };
          }
        }
      }
    }

    return null;
  }

  // Get token metadata if available (this would require additional API calls)
  async getTokenMetadata(mint: string): Promise<{ name?: string; symbol?: string }> {
    try {
      // This would typically involve calling a metadata program or API
      // For now, return empty object
      return {};
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {};
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export default TokenLaunchDataService;
