/**
 * Error Suppression Utility
 * Used to hide certain errors during video recording or demos
 */

export class ErrorSuppression {
  private static suppress429Errors = false;
  private static suppressRateLimitErrors = false;
  private static suppressNetworkErrors = false;

  // Enable video recording mode - hides all non-critical errors
  static enableVideoMode() {
    console.log('🎥 Video recording mode enabled - suppressing non-critical errors');
    this.suppress429Errors = true;
    this.suppressRateLimitErrors = true;
    this.suppressNetworkErrors = true;
  }

  // Disable video recording mode - show all errors
  static disableVideoMode() {
    console.log('🎥 Video recording mode disabled - showing all errors');
    this.suppress429Errors = false;
    this.suppressRateLimitErrors = false;
    this.suppressNetworkErrors = false;
  }

  // Check if 429 errors should be suppressed
  static should429BeHidden(): boolean {
    return this.suppress429Errors;
  }

  // Check if rate limit errors should be suppressed
  static shouldRateLimitBeHidden(): boolean {
    return this.suppressRateLimitErrors;
  }

  // Check if network errors should be suppressed
  static shouldNetworkErrorsBeHidden(): boolean {
    return this.suppressNetworkErrors;
  }

  // Safe console.error that respects suppression settings
  static safeError(message: string, error?: any) {
    // Check if this error should be suppressed
    if (this.isErrorSuppressed(message, error)) {
      // Log to console for debugging but don't show to user
      console.log(`[SUPPRESSED] ${message}`, error);
      return;
    }
    
    console.error(message, error);
  }

  // Safe console.log that respects suppression settings
  static safeLog(message: string, ...args: any[]) {
    if (this.isLogSuppressed(message)) {
      return;
    }
    
    console.log(message, ...args);
  }

  private static isErrorSuppressed(message: string, error?: any): boolean {
    const errorString = error?.toString() || '';
    const fullMessage = `${message} ${errorString}`.toLowerCase();

    // Suppress 429 errors
    if (this.suppress429Errors && (
      fullMessage.includes('429') || 
      fullMessage.includes('too many requests') ||
      fullMessage.includes('rate limit')
    )) {
      return true;
    }

    // Suppress network errors
    if (this.suppressNetworkErrors && (
      fullMessage.includes('network error') ||
      fullMessage.includes('connection failed') ||
      fullMessage.includes('timeout')
    )) {
      return true;
    }

    return false;
  }

  private static isLogSuppressed(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Suppress rate limit related logs
    if (this.suppressRateLimitErrors && (
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('429') ||
      lowerMessage.includes('too many requests')
    )) {
      return true;
    }

    return false;
  }
}

// Global helper functions
export const safeError = (message: string, error?: any) => ErrorSuppression.safeError(message, error);
export const safeLog = (message: string, ...args: any[]) => ErrorSuppression.safeLog(message, ...args);
export const enableVideoMode = () => ErrorSuppression.enableVideoMode();
export const disableVideoMode = () => ErrorSuppression.disableVideoMode();
