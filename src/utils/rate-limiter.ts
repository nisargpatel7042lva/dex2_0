import { safeLog } from './error-suppression';

class RateLimiter {
  private requestTimestamps: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 10, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // 1 minute default
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(key) || [];
    
    // Remove timestamps outside the time window
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.timeWindow);
    
    if (validTimestamps.length >= this.maxRequests) {
      safeLog(`🚫 Rate limit reached for ${key}. Max ${this.maxRequests} requests per ${this.timeWindow}ms`);
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.requestTimestamps.set(key, validTimestamps);
    
    return true;
  }

  waitForNextRequest(key: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.canMakeRequest(key)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000); // Check every second
    });
  }

  clear(key?: string): void {
    if (key) {
      this.requestTimestamps.delete(key);
    } else {
      this.requestTimestamps.clear();
    }
  }
}

// Ultra conservative rate limiters to prevent 429 errors

// Global rate limiters for different services
export const coinGeckoRateLimiter = new RateLimiter(1, 120000); // 1 request per 2 minutes (ultra conservative)
export const jupiterRateLimiter = new RateLimiter(1, 90000);    // 1 request per 1.5 minutes
export const solanaRPCRateLimiter = new RateLimiter(1, 60000);  // 1 request per 60 seconds (even more conservative)

export default RateLimiter;
