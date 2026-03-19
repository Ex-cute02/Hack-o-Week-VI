"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWSServer = createWSServer;
const ws_1 = __importStar(require("ws"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const metrics_1 = require("./metrics");
const crypto_module_1 = require("./crypto-module");
const message_queue_1 = require("./message-queue");
const rate_limiter_1 = require("./rate-limiter");
const clientStates = new Map();
/**
 * Validate the timestamp against clock drift limits.
 */
function validateTimestamp(timestamp) {
    const ts = new Date(timestamp).getTime();
    if (isNaN(ts)) {
        return "Invalid timestamp format";
    }
    const now = Date.now();
    const drift = ts - now;
    if (drift < -config_1.config.MAX_PAST_DRIFT_MS) {
        return "Timestamp too far in the past (>24h)";
    }
    if (drift > config_1.config.MAX_FUTURE_DRIFT_MS) {
        return "Timestamp too far in the future (>5min)";
    }
    return null;
}
/**
 * Validate telemetry payload structure.
 */
function validateTelemetry(msg) {
    if (!msg.data)
        return "Missing data field";
    if (!msg.data.timestamp)
        return "Missing timestamp";
    if (typeof msg.data.heart_rate !== "number" ||
        msg.data.heart_rate < 0 ||
        msg.data.heart_rate > 300) {
        return "Invalid heart_rate (expected 0-300)";
    }
    if (typeof msg.data.steps !== "number" || msg.data.steps < 0) {
        return "Invalid steps (expected non-negative number)";
    }
    if (!msg.data.device_id)
        return "Missing device_id";
    const tsError = validateTimestamp(msg.data.timestamp);
    if (tsError)
        return tsError;
    return null;
}
function send(ws, msg) {
    if (ws.readyState === ws_1.default.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}
/**
 * Handle an authenticated telemetry message.
 */
async function handleTelemetry(ws, state, msg) {
    const traceId = crypto_1.default.randomUUID();
    // Rate limiting
    if (!state.rateLimiter.tryConsume()) {
        metrics_1.metrics.wsMessagesReceived.inc({ status: "rate_limited" });
        send(ws, { type: "rate_limited", error: "rate_limit_exceeded" });
        logger_1.logger.warn("Rate limited", { userId: state.userId, traceId });
        return;
    }
    // Validate payload
    const validationError = validateTelemetry(msg);
    if (validationError) {
        metrics_1.metrics.wsMessagesReceived.inc({ status: "error" });
        send(ws, {
            type: "error",
            error: validationError,
            code: "INVALID_PAYLOAD",
        });
        logger_1.logger.warn("Invalid telemetry payload", {
            error: validationError,
            userId: state.userId,
            traceId,
        });
        return;
    }
    try {
        // Fetch DEK from KMS (with caching)
        const { key, keyId } = await (0, crypto_module_1.getDEK)(state.userId);
        // Encrypt the sensitive health data (heart_rate & steps)
        const sensitiveData = JSON.stringify({
            heart_rate: msg.data.heart_rate,
            steps: msg.data.steps,
        });
        const encPayload = (0, crypto_module_1.encryptPayload)(sensitiveData, key);
        // Build encrypted record
        const record = {
            user_id: state.userId,
            timestamp: msg.data.timestamp,
            device_id: msg.data.device_id,
            enc_payload: encPayload,
            key_id: keyId,
        };
        // Produce to message queue
        const queued = message_queue_1.messageQueue.produce(record);
        if (!queued) {
            // Queue is full -> backpressure
            send(ws, {
                type: "error",
                error: "Server overloaded, try again later",
                code: "BACKPRESSURE",
            });
            logger_1.logger.error("Message dropped due to queue overflow", {
                userId: state.userId,
                traceId,
            });
            return;
        }
        // Send ACK
        metrics_1.metrics.wsMessagesReceived.inc({ status: "success" });
        send(ws, {
            type: "ack",
            status: "success",
            timestamp: new Date().toISOString(),
        });
        logger_1.logger.debug("Telemetry processed", {
            userId: state.userId,
            deviceId: msg.data.device_id,
            traceId,
        });
    }
    catch (err) {
        metrics_1.metrics.wsMessagesReceived.inc({ status: "error" });
        const errMsg = err.message;
        // KMS circuit breaker open -> close connection
        if (errMsg.includes("circuit breaker")) {
            send(ws, {
                type: "error",
                error: "Encryption service unavailable",
                code: "KMS_FAILURE",
            });
            ws.close(1011, "Server Error - Encryption service unavailable");
            logger_1.logger.error("Connection closed due to KMS circuit breaker", {
                userId: state.userId,
                traceId,
            });
            return;
        }
        send(ws, {
            type: "error",
            error: "Internal server error",
            code: "INTERNAL",
        });
        logger_1.logger.error("Telemetry processing error", {
            error: errMsg,
            userId: state.userId,
            traceId,
        });
    }
}
/**
 * Handle incoming message from a client.
 */
function handleMessage(ws, state, raw) {
    let parsed;
    // Parse JSON
    try {
        parsed = JSON.parse(raw.toString());
    }
    catch {
        metrics_1.metrics.wsMessagesReceived.inc({ status: "error" });
        send(ws, { type: "error", error: "Malformed JSON", code: "PARSE_ERROR" });
        logger_1.logger.warn("Malformed JSON received", {
            userId: state.userId || "unauthenticated",
        });
        return;
    }
    // Handle auth message
    if (parsed.type === "auth" && "token" in parsed) {
        try {
            const payload = jsonwebtoken_1.default.verify(parsed.token, config_1.config.JWT_SECRET);
            state.userId = payload.sub || null;
            state.authenticated = true;
            if (state.authTimer) {
                clearTimeout(state.authTimer);
                state.authTimer = null;
            }
            metrics_1.metrics.authAttempts.inc({ status: "success" });
            send(ws, {
                type: "ack",
                status: "success",
                timestamp: new Date().toISOString(),
            });
            logger_1.logger.info("Client authenticated", {
                userId: state.userId,
                traceId: state.traceId,
            });
        }
        catch {
            metrics_1.metrics.authAttempts.inc({ status: "failure" });
            send(ws, {
                type: "error",
                error: "Invalid or expired token",
                code: "AUTH_FAILED",
            });
            ws.close(4003, "Not Authorized");
            logger_1.logger.warn("Auth failed - invalid JWT", { traceId: state.traceId });
        }
        return;
    }
    // Require authentication for all other messages
    if (!state.authenticated) {
        send(ws, {
            type: "error",
            error: "Not authenticated. Send auth frame first.",
            code: "NOT_AUTH",
        });
        return;
    }
    // Handle telemetry
    if (parsed.type === "telemetry") {
        handleTelemetry(ws, state, parsed);
        return;
    }
    // Unknown message type
    send(ws, {
        type: "error",
        error: `Unknown message type: ${parsed.type}`,
        code: "UNKNOWN_TYPE",
    });
}
/**
 * Create and configure the WebSocket server.
 */
function createWSServer(server) {
    const wss = new ws_1.WebSocketServer({ server });
    // Heartbeat: ping all clients periodically to cull dead connections
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const state = clientStates.get(ws);
            if (!state || !state.alive) {
                logger_1.logger.info("Terminating dead connection", { userId: state?.userId });
                ws.terminate();
                return;
            }
            state.alive = false;
            ws.ping();
        });
    }, config_1.config.HEARTBEAT_INTERVAL_MS);
    wss.on("close", () => {
        clearInterval(heartbeatInterval);
    });
    wss.on("connection", (ws) => {
        const traceId = crypto_1.default.randomUUID();
        // Initialize client state
        const state = {
            userId: null,
            authenticated: false,
            rateLimiter: new rate_limiter_1.RateLimiter(),
            authTimer: null,
            alive: true,
            traceId,
        };
        clientStates.set(ws, state);
        metrics_1.metrics.wsActiveConnections.inc();
        logger_1.logger.info("New WebSocket connection", { traceId });
        // Auth timeout: disconnect if no valid auth within 3 seconds
        state.authTimer = setTimeout(() => {
            if (!state.authenticated) {
                send(ws, {
                    type: "error",
                    error: "Auth timeout - no JWT received within 3 seconds",
                    code: "AUTH_TIMEOUT",
                });
                ws.close(4003, "Not Authorized");
                logger_1.logger.warn("Auth timeout, disconnecting", { traceId });
            }
        }, config_1.config.AUTH_TIMEOUT_MS);
        // Handle pong (heartbeat response)
        ws.on("pong", () => {
            state.alive = true;
        });
        // Handle messages
        ws.on("message", (data) => {
            handleMessage(ws, state, data);
        });
        // Handle close
        ws.on("close", (code, reason) => {
            if (state.authTimer) {
                clearTimeout(state.authTimer);
            }
            clientStates.delete(ws);
            metrics_1.metrics.wsActiveConnections.dec();
            logger_1.logger.info("WebSocket connection closed", {
                userId: state.userId,
                code,
                reason: reason.toString(),
                traceId,
            });
        });
        // Handle errors
        ws.on("error", (err) => {
            logger_1.logger.error("WebSocket error", {
                error: err.message,
                userId: state.userId,
                traceId,
            });
        });
    });
    // Backpressure notification to all authenticated clients
    message_queue_1.messageQueue.on("backpressure", (active) => {
        if (active) {
            wss.clients.forEach((ws) => {
                const state = clientStates.get(ws);
                if (state?.authenticated) {
                    send(ws, {
                        type: "rate_limited",
                        error: "Server under heavy load, please slow down",
                    });
                }
            });
        }
    });
    return wss;
}
//# sourceMappingURL=ws-server.js.map