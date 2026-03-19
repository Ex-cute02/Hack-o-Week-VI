import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "./config";
import { logger } from "./logger";
import { metrics } from "./metrics";
import { getDEK, encryptPayload } from "./crypto-module";
import { messageQueue } from "./message-queue";
import { RateLimiter } from "./rate-limiter";
import {
  ClientMessage,
  TelemetryPayload,
  EncryptedRecord,
  ServerMessage,
} from "./types";

interface ClientState {
  userId: string | null;
  authenticated: boolean;
  rateLimiter: RateLimiter;
  authTimer: ReturnType<typeof setTimeout> | null;
  alive: boolean;
  traceId: string;
}

const clientStates = new Map<WebSocket, ClientState>();

/**
 * Validate the timestamp against clock drift limits.
 */
function validateTimestamp(timestamp: string): string | null {
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) {
    return "Invalid timestamp format";
  }

  const now = Date.now();
  const drift = ts - now;

  if (drift < -config.MAX_PAST_DRIFT_MS) {
    return "Timestamp too far in the past (>24h)";
  }
  if (drift > config.MAX_FUTURE_DRIFT_MS) {
    return "Timestamp too far in the future (>5min)";
  }

  return null;
}

/**
 * Validate telemetry payload structure.
 */
function validateTelemetry(msg: TelemetryPayload): string | null {
  if (!msg.data) return "Missing data field";
  if (!msg.data.timestamp) return "Missing timestamp";
  if (
    typeof msg.data.heart_rate !== "number" ||
    msg.data.heart_rate < 0 ||
    msg.data.heart_rate > 300
  ) {
    return "Invalid heart_rate (expected 0-300)";
  }
  if (typeof msg.data.steps !== "number" || msg.data.steps < 0) {
    return "Invalid steps (expected non-negative number)";
  }
  if (!msg.data.device_id) return "Missing device_id";

  const tsError = validateTimestamp(msg.data.timestamp);
  if (tsError) return tsError;

  return null;
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

/**
 * Handle an authenticated telemetry message.
 */
async function handleTelemetry(
  ws: WebSocket,
  state: ClientState,
  msg: TelemetryPayload,
): Promise<void> {
  const traceId = crypto.randomUUID();

  // Rate limiting
  if (!state.rateLimiter.tryConsume()) {
    metrics.wsMessagesReceived.inc({ status: "rate_limited" });
    send(ws, { type: "rate_limited", error: "rate_limit_exceeded" });
    logger.warn("Rate limited", { userId: state.userId, traceId });
    return;
  }

  // Validate payload
  const validationError = validateTelemetry(msg);
  if (validationError) {
    metrics.wsMessagesReceived.inc({ status: "error" });
    send(ws, {
      type: "error",
      error: validationError,
      code: "INVALID_PAYLOAD",
    });
    logger.warn("Invalid telemetry payload", {
      error: validationError,
      userId: state.userId,
      traceId,
    });
    return;
  }

  try {
    // Fetch DEK from KMS (with caching)
    const { key, keyId } = await getDEK(state.userId!);

    // Encrypt the sensitive health data (heart_rate & steps)
    const sensitiveData = JSON.stringify({
      heart_rate: msg.data.heart_rate,
      steps: msg.data.steps,
    });
    const encPayload = encryptPayload(sensitiveData, key);

    // Build encrypted record
    const record: EncryptedRecord = {
      user_id: state.userId!,
      timestamp: msg.data.timestamp,
      device_id: msg.data.device_id,
      enc_payload: encPayload,
      key_id: keyId,
    };

    // Produce to message queue
    const queued = messageQueue.produce(record);

    if (!queued) {
      // Queue is full -> backpressure
      send(ws, {
        type: "error",
        error: "Server overloaded, try again later",
        code: "BACKPRESSURE",
      });
      logger.error("Message dropped due to queue overflow", {
        userId: state.userId,
        traceId,
      });
      return;
    }

    // Send ACK
    metrics.wsMessagesReceived.inc({ status: "success" });
    send(ws, {
      type: "ack",
      status: "success",
      timestamp: new Date().toISOString(),
    });

    logger.debug("Telemetry processed", {
      userId: state.userId,
      deviceId: msg.data.device_id,
      traceId,
    });
  } catch (err) {
    metrics.wsMessagesReceived.inc({ status: "error" });
    const errMsg = (err as Error).message;

    // KMS circuit breaker open -> close connection
    if (errMsg.includes("circuit breaker")) {
      send(ws, {
        type: "error",
        error: "Encryption service unavailable",
        code: "KMS_FAILURE",
      });
      ws.close(1011, "Server Error - Encryption service unavailable");
      logger.error("Connection closed due to KMS circuit breaker", {
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
    logger.error("Telemetry processing error", {
      error: errMsg,
      userId: state.userId,
      traceId,
    });
  }
}

/**
 * Handle incoming message from a client.
 */
function handleMessage(
  ws: WebSocket,
  state: ClientState,
  raw: WebSocket.RawData,
): void {
  let parsed: ClientMessage;

  // Parse JSON
  try {
    parsed = JSON.parse(raw.toString());
  } catch {
    metrics.wsMessagesReceived.inc({ status: "error" });
    send(ws, { type: "error", error: "Malformed JSON", code: "PARSE_ERROR" });
    logger.warn("Malformed JSON received", {
      userId: state.userId || "unauthenticated",
    });
    return;
  }

  // Handle auth message
  if (parsed.type === "auth" && "token" in parsed) {
    try {
      const payload = jwt.verify(
        parsed.token,
        config.JWT_SECRET,
      ) as jwt.JwtPayload;
      state.userId = payload.sub || null;
      state.authenticated = true;

      if (state.authTimer) {
        clearTimeout(state.authTimer);
        state.authTimer = null;
      }

      metrics.authAttempts.inc({ status: "success" });
      send(ws, {
        type: "ack",
        status: "success",
        timestamp: new Date().toISOString(),
      });
      logger.info("Client authenticated", {
        userId: state.userId,
        traceId: state.traceId,
      });
    } catch {
      metrics.authAttempts.inc({ status: "failure" });
      send(ws, {
        type: "error",
        error: "Invalid or expired token",
        code: "AUTH_FAILED",
      });
      ws.close(4003, "Not Authorized");
      logger.warn("Auth failed - invalid JWT", { traceId: state.traceId });
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
    handleTelemetry(ws, state, parsed as TelemetryPayload);
    return;
  }

  // Unknown message type
  send(ws, {
    type: "error",
    error: `Unknown message type: ${(parsed as { type?: string }).type}`,
    code: "UNKNOWN_TYPE",
  });
}

/**
 * Create and configure the WebSocket server.
 */
export function createWSServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  // Heartbeat: ping all clients periodically to cull dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const state = clientStates.get(ws);
      if (!state || !state.alive) {
        logger.info("Terminating dead connection", { userId: state?.userId });
        ws.terminate();
        return;
      }
      state.alive = false;
      ws.ping();
    });
  }, config.HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  wss.on("connection", (ws: WebSocket) => {
    const traceId = crypto.randomUUID();

    // Initialize client state
    const state: ClientState = {
      userId: null,
      authenticated: false,
      rateLimiter: new RateLimiter(),
      authTimer: null,
      alive: true,
      traceId,
    };
    clientStates.set(ws, state);
    metrics.wsActiveConnections.inc();

    logger.info("New WebSocket connection", { traceId });

    // Auth timeout: disconnect if no valid auth within 3 seconds
    state.authTimer = setTimeout(() => {
      if (!state.authenticated) {
        send(ws, {
          type: "error",
          error: "Auth timeout - no JWT received within 3 seconds",
          code: "AUTH_TIMEOUT",
        });
        ws.close(4003, "Not Authorized");
        logger.warn("Auth timeout, disconnecting", { traceId });
      }
    }, config.AUTH_TIMEOUT_MS);

    // Handle pong (heartbeat response)
    ws.on("pong", () => {
      state.alive = true;
    });

    // Handle messages
    ws.on("message", (data: WebSocket.RawData) => {
      handleMessage(ws, state, data);
    });

    // Handle close
    ws.on("close", (code: number, reason: Buffer) => {
      if (state.authTimer) {
        clearTimeout(state.authTimer);
      }
      clientStates.delete(ws);
      metrics.wsActiveConnections.dec();
      logger.info("WebSocket connection closed", {
        userId: state.userId,
        code,
        reason: reason.toString(),
        traceId,
      });
    });

    // Handle errors
    ws.on("error", (err: Error) => {
      logger.error("WebSocket error", {
        error: err.message,
        userId: state.userId,
        traceId,
      });
    });
  });

  // Backpressure notification to all authenticated clients
  messageQueue.on("backpressure", (active: boolean) => {
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
