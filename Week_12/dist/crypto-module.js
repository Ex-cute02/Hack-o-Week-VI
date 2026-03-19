"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDEK = getDEK;
exports.encryptPayload = encryptPayload;
exports.decryptPayload = decryptPayload;
exports.resetCircuitBreaker = resetCircuitBreaker;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const metrics_1 = require("./metrics");
/**
 * Simulated Key Management Service with envelope encryption.
 * In production, this would call AWS KMS or HashiCorp Vault.
 *
 * Envelope encryption pattern:
 * 1. A Customer Master Key (CMK) is stored in KMS (simulated here).
 * 2. For each user, a Data Encryption Key (DEK) is generated.
 * 3. The DEK is encrypted with the CMK and stored alongside data.
 * 4. The plaintext DEK is used for AES-256-GCM encryption of payloads.
 */
// Simulated CMK (in production, this never leaves KMS)
const SIMULATED_CMK = crypto_1.default.randomBytes(32);
const CMK_KEY_ID = "cmk-sim-" + crypto_1.default.randomBytes(4).toString("hex");
// DEK cache: userId -> cached entry
const dekCache = new Map();
// Circuit breaker state
let consecutiveFailures = 0;
let circuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_RESET_MS = 30_000;
function checkCircuit() {
    if (circuitOpen) {
        if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
            circuitOpen = false;
            consecutiveFailures = 0;
            logger_1.logger.info("KMS circuit breaker reset (half-open)");
        }
        else {
            throw new Error("KMS circuit breaker is OPEN - failing fast");
        }
    }
}
function recordSuccess() {
    consecutiveFailures = 0;
}
function recordFailure() {
    consecutiveFailures++;
    if (consecutiveFailures >= config_1.config.KMS_MAX_FAILURES) {
        circuitOpen = true;
        circuitOpenedAt = Date.now();
        logger_1.logger.error("KMS circuit breaker OPENED after consecutive failures", {
            failures: consecutiveFailures,
        });
    }
}
/**
 * Generate a new DEK, encrypt it with the CMK, and return both forms.
 */
function generateDEK() {
    const dek = crypto_1.default.randomBytes(32);
    const keyId = "dek-" + crypto_1.default.randomBytes(8).toString("hex");
    // Encrypt DEK with CMK (envelope encryption)
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv("aes-256-gcm", SIMULATED_CMK, iv);
    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const encryptedKey = Buffer.concat([iv, authTag, encrypted]).toString("base64");
    return { decryptedKey: dek, encryptedKey, keyId };
}
/**
 * Fetch or generate a DEK for a user, with caching.
 */
async function getDEK(userId) {
    checkCircuit();
    // Check cache
    const cached = dekCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
        return { key: cached.decryptedKey, keyId: cached.keyId };
    }
    try {
        // Simulate KMS network latency
        await new Promise((resolve) => setTimeout(resolve, 1 + Math.random() * 5));
        const { decryptedKey, keyId } = generateDEK();
        // Cache the DEK
        dekCache.set(userId, {
            decryptedKey,
            keyId,
            expiresAt: Date.now() + config_1.config.DEK_CACHE_TTL_MS,
        });
        recordSuccess();
        logger_1.logger.debug("DEK generated/cached for user", { userId, keyId });
        return { key: decryptedKey, keyId };
    }
    catch (err) {
        recordFailure();
        throw err;
    }
}
/**
 * Encrypt sensitive health data using AES-256-GCM.
 * Returns base64-encoded ciphertext (IV + AuthTag + Ciphertext).
 */
function encryptPayload(plaintext, key) {
    const timer = metrics_1.metrics.cryptoEncryptionDuration.startTimer();
    try {
        const iv = crypto_1.default.randomBytes(12);
        const cipher = crypto_1.default.createCipheriv("aes-256-gcm", key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        // Format: iv(12) + authTag(16) + ciphertext(N)
        const result = Buffer.concat([iv, authTag, encrypted]).toString("base64");
        timer({ status: "success" });
        return result;
    }
    catch (err) {
        timer({ status: "error" });
        throw err;
    }
}
/**
 * Decrypt an AES-256-GCM encrypted payload. Used for verification/debugging.
 */
function decryptPayload(cipherBase64, key) {
    const data = Buffer.from(cipherBase64, "base64");
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);
    const decipher = crypto_1.default.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
/**
 * Reset circuit breaker (for testing).
 */
function resetCircuitBreaker() {
    consecutiveFailures = 0;
    circuitOpen = false;
}
//# sourceMappingURL=crypto-module.js.map