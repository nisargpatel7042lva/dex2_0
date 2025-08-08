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

// Global rate limiters for different API endpoints
export const coinGeckoRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
export const solanaRPCRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
export const jupiterRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

export default RateLimiter;
