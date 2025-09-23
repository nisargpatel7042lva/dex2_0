export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QRCodeService {
  private defaultOptions: QRCodeOptions = {
    width: 256,
    height: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  };

  /**
   * Generate a simple QR code pattern as data URL
   */
  async generateQRCode(
    data: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      // For now, return a simple placeholder QR code
      // In production, you would integrate with a real QR code library
      return this.generatePlaceholderQRCode(data, mergedOptions);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return this.generatePlaceholderQRCode(data, mergedOptions);
    }
  }

  /**
   * Generate QR code as base64 string
   */
  async generateQRCodeBase64(
    data: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    return this.generateQRCode(data, options);
  }

  /**
   * Generate QR code for Solana address
   */
  async generateAddressQRCode(
    address: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    // Format: solana:<address>
    const solanaURI = `solana:${address}`;
    return this.generateQRCode(solanaURI, options);
  }

  /**
   * Generate QR code for Solana transaction
   */
  async generateTransactionQRCode(
    signature: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    // Format: solana:<signature>
    const transactionURI = `solana:${signature}`;
    return this.generateQRCode(transactionURI, options);
  }

  /**
   * Generate QR code for Solana Explorer URL
   */
  async generateExplorerQRCode(
    signature: string,
    network: 'mainnet' | 'devnet' | 'testnet' = 'mainnet',
    options: QRCodeOptions = {}
  ): Promise<string> {
    const explorerURL = `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
    return this.generateQRCode(explorerURL, options);
  }

  /**
   * Generate QR code for wallet connection
   */
  async generateWalletConnectionQRCode(
    walletAddress: string,
    amount?: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    let uri = `solana:${walletAddress}`;
    if (amount) {
      uri += `?amount=${amount}`;
    }
    return this.generateQRCode(uri, options);
  }

  /**
   * Generate a placeholder QR code that actually displays
   */
  private generatePlaceholderQRCode(data: string, options: QRCodeOptions): string {
    const { width = 256, height = 256, color } = options;
    const darkColor = color?.dark || '#000000';
    const lightColor = color?.light || '#FFFFFF';
    
    // Create a simple checkerboard pattern that will display
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${lightColor}"/>
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="${darkColor}"/>
      <rect x="40" y="40" width="${width - 80}" height="${height - 80}" fill="${lightColor}"/>
      <rect x="60" y="60" width="${width - 120}" height="${height - 120}" fill="${darkColor}"/>
      <rect x="80" y="80" width="${width - 160}" height="${height - 160}" fill="${lightColor}"/>
      <text x="${width / 2}" y="${height / 2 - 10}" text-anchor="middle" font-family="Arial" font-size="12" fill="${darkColor}">QR Code</text>
      <text x="${width / 2}" y="${height / 2 + 10}" text-anchor="middle" font-family="Arial" font-size="10" fill="${darkColor}">${data.slice(0, 20)}...</text>
    </svg>`;
    
    // Use a simple data URL that works in React Native
    return `data:image/svg+xml;base64,${this.btoa(svg)}`;
  }

  /**
   * Simple base64 encoding function
   */
  private btoa(str: string): string {
    try {
      // Try to use Buffer if available (Node.js environment)
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
      }
      // Fallback to browser btoa
      return btoa(str);
    } catch (error) {
      // If both fail, use a simple encoding
      return this.simpleBase64Encode(str);
    }
  }

  /**
   * Simple base64 encoding fallback
   */
  private simpleBase64Encode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    const bytes = new Uint8Array(str.length);
    
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    
    let byteNum;
    let chunk;
    
    for (let i = 0; i < bytes.length; i += 3) {
      byteNum = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      chunk = [
        chars[(byteNum >> 18) & 0x3F],
        chars[(byteNum >> 12) & 0x3F],
        chars[(byteNum >> 6) & 0x3F],
        chars[byteNum & 0x3F]
      ];
      output += chunk.join('');
    }
    
    return output;
  }

  /**
   * Validate if a string is a valid QR code data
   */
  static isValidQRData(data: string): boolean {
    return Boolean(data && data.length > 0 && data.length <= 2953);
  }

  /**
   * Get QR code size for different data lengths
   */
  static getRecommendedSize(dataLength: number): { width: number; height: number } {
    if (dataLength <= 25) return { width: 128, height: 128 };
    if (dataLength <= 47) return { width: 192, height: 192 };
    if (dataLength <= 84) return { width: 256, height: 256 };
    return { width: 320, height: 320 };
  }
} 