export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, { count: number; timestamp: number }> = new Map();
  private readonly WINDOW_MS = 60000; // 1 minute
  private readonly MAX_REQUESTS = 100;

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public async checkLimit(key: string): Promise<boolean> {
    this.cleanup();
    
    const now = Date.now();
    const requestData = this.requests.get(key) || { count: 0, timestamp: now };
    
    if (now - requestData.timestamp > this.WINDOW_MS) {
      requestData.count = 1;
      requestData.timestamp = now;
    } else {
      requestData.count++;
    }
    
    this.requests.set(key, requestData);
    return requestData.count <= this.MAX_REQUESTS;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.timestamp > this.WINDOW_MS) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();