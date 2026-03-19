export interface TelemetryPayload {
  type: "telemetry";
  data: {
    timestamp: string;
    device_id: string;
    heart_rate: number;
    steps: number;
  };
}

export interface AuthPayload {
  type: "auth";
  token: string;
}

export type ClientMessage = TelemetryPayload | AuthPayload;

export interface AckResponse {
  type: "ack";
  status: "success";
  timestamp: string;
}

export interface ErrorResponse {
  type: "error";
  error: string;
  code?: string;
}

export interface RateLimitResponse {
  type: "rate_limited";
  error: string;
}

export type ServerMessage = AckResponse | ErrorResponse | RateLimitResponse;

export interface EncryptedRecord {
  user_id: string;
  timestamp: string;
  device_id: string;
  enc_payload: string; // base64 encoded ciphertext
  key_id: string;
}

export interface DEKCacheEntry {
  decryptedKey: Buffer;
  keyId: string;
  expiresAt: number;
}

export interface JWTPayload {
  sub: string; // user_id
  iat: number;
  exp: number;
}
