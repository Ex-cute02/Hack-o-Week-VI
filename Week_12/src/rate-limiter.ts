import { config } from "./config";

/**
 * Token Bucket rate limiter.
 * Allows max 1 message per second per connection (configurable).
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRateMs: number;

  constructor(
    maxTokens = config.RATE_LIMIT_MAX_TOKENS,
    refillRateMs = config.RATE_LIMIT_REFILL_RATE_MS,
  ) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRateMs = refillRateMs;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token. Returns true if allowed, false if rate limited.
   */
  tryConsume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed / this.refillRateMs;

    if (tokensToAdd >= 1) {
      this.tokens = Math.min(
        this.maxTokens,
        this.tokens + Math.floor(tokensToAdd),
      );
      this.lastRefill = now;
    }
  }
}
