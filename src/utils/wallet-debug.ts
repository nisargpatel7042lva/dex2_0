/**
 * Wallet connection debugging utilities
 * This file helps debug wallet connection issues, especially when only one wallet is available
 */

export interface WalletDebugInfo {
  totalWallets: number;
  availableWallets: string[];
  hasPhantom: boolean;
  hasSolflare: boolean;
  accountsReceived: number;
  connectionStep: string;
  error?: string;
}

export class WalletConnectionDebugger {
  private static debugInfo: WalletDebugInfo = {
    totalWallets: 0,
    availableWallets: [],
    hasPhantom: false,
    hasSolflare: false,
    accountsReceived: 0,
    connectionStep: 'initial'
  };

  static setConnectionStep(step: string) {
    this.debugInfo.connectionStep = step;
    console.log(`[WalletDebug] Step: ${step}`);
  }

  static setAccountsInfo(accounts: any[]) {
    this.debugInfo.accountsReceived = accounts?.length || 0;
    console.log(`[WalletDebug] Accounts received: ${this.debugInfo.accountsReceived}`);
    
    if (accounts && accounts.length > 0) {
      accounts.forEach((account, index) => {
        console.log(`[WalletDebug] Account ${index}:`, {
          address: account.address ? 'present' : 'missing',
          label: account.label || 'no label',
          hasIcon: !!account.icon
        });
      });
    }
  }

  static setWalletInfo(wallets: string[]) {
    this.debugInfo.availableWallets = wallets;
    this.debugInfo.totalWallets = wallets.length;
    this.debugInfo.hasPhantom = wallets.some(w => w.toLowerCase().includes('phantom'));
    this.debugInfo.hasSolflare = wallets.some(w => w.toLowerCase().includes('solflare'));
    
    console.log(`[WalletDebug] Wallet info:`, this.debugInfo);
  }

  static setError(error: string) {
    this.debugInfo.error = error;
    console.error(`[WalletDebug] Error: ${error}`);
  }

  static getDebugInfo(): WalletDebugInfo {
    return { ...this.debugInfo };
  }

  static logFullState() {
    console.log(`[WalletDebug] Full state:`, JSON.stringify(this.debugInfo, null, 2));
  }
}

/**
 * Safe array access utility to prevent IndexOutOfBoundsException
 */
export function safeArrayAccess<T>(array: T[], index: number, errorMessage?: string): T {
  if (!array || !Array.isArray(array)) {
    throw new Error(errorMessage || `Array is null or undefined`);
  }
  
  if (index < 0 || index >= array.length) {
    throw new Error(errorMessage || `Index ${index} is out of bounds for array of length ${array.length}`);
  }
  
  return array[index];
}

/**
 * Safe first element access
 */
export function safeFirst<T>(array: T[], errorMessage?: string): T {
  return safeArrayAccess(array, 0, errorMessage || 'Array is empty - cannot get first element');
}
