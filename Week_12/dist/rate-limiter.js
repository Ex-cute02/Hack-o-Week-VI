"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const config_1 = require("./config");
/**
 * Token Bucket rate limiter.
 * Allows max 1 message per second per connection (configurable).
 */
class RateLimiter {
    tokens;
    lastRefill;
    maxTokens;
    refillRateMs;
    constructor(maxTokens = config_1.config.RATE_LIMIT_MAX_TOKENS, refillRateMs = config_1.config.RATE_LIMIT_REFILL_RATE_MS) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRateMs = refillRateMs;
        this.lastRefill = Date.now();
    }
    /**
     * Try to consume a token. Returns true if allowed, false if rate limited.
     */
    tryConsume() {
        this.refill();
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        return false;
    }
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = elapsed / this.refillRateMs;
        if (tokensToAdd >= 1) {
            this.tokens = Math.min(this.maxTokens, this.tokens + Math.floor(tokensToAdd));
            this.lastRefill = now;
        }
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map