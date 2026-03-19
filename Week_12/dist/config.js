"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    // Server
    WS_PORT: parseInt(process.env.WS_PORT || "8080", 10),
    METRICS_PORT: parseInt(process.env.METRICS_PORT || "9090", 10),
    // Auth
    JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
    AUTH_TIMEOUT_MS: 3000,
    // WebSocket
    HEARTBEAT_INTERVAL_MS: 30_000,
    HEARTBEAT_TIMEOUT_MS: 35_000,
    // Rate Limiting (Token Bucket)
    RATE_LIMIT_MAX_TOKENS: 1,
    RATE_LIMIT_REFILL_RATE_MS: 1000, // 1 token per second
    // Encryption
    DEK_CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
    KMS_TIMEOUT_MS: 2000,
    KMS_MAX_FAILURES: 3,
    // Message Queue
    QUEUE_MAX_SIZE: 10_000,
    QUEUE_BACKPRESSURE_THRESHOLD: 8_000,
    // DB Consumer
    DB_BATCH_SIZE: 500,
    DB_FLUSH_INTERVAL_MS: 1000,
    DB_PATH: process.env.DB_PATH || "./telemetry.db",
    // Clock Drift
    MAX_PAST_DRIFT_MS: 24 * 60 * 60 * 1000, // 24 hours
    MAX_FUTURE_DRIFT_MS: 5 * 60 * 1000, // 5 minutes
};
//# sourceMappingURL=config.js.map