/**
 * Token Bucket rate limiter.
 * Allows max 1 message per second per connection (configurable).
 */
export declare class RateLimiter {
    private tokens;
    private lastRefill;
    private maxTokens;
    private refillRateMs;
    constructor(maxTokens?: number, refillRateMs?: number);
    /**
     * Try to consume a token. Returns true if allowed, false if rate limited.
     */
    tryConsume(): boolean;
    private refill;
}
