/**
 * Fetch or generate a DEK for a user, with caching.
 */
export declare function getDEK(userId: string): Promise<{
    key: Buffer;
    keyId: string;
}>;
/**
 * Encrypt sensitive health data using AES-256-GCM.
 * Returns base64-encoded ciphertext (IV + AuthTag + Ciphertext).
 */
export declare function encryptPayload(plaintext: string, key: Buffer): string;
/**
 * Decrypt an AES-256-GCM encrypted payload. Used for verification/debugging.
 */
export declare function decryptPayload(cipherBase64: string, key: Buffer): string;
/**
 * Reset circuit breaker (for testing).
 */
export declare function resetCircuitBreaker(): void;
