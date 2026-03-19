import client from "prom-client";

// Create a Registry
const register = new client.Registry();
register.setDefaultLabels({ app: "health-telemetry-pipeline" });
client.collectDefaultMetrics({ register });

export const metrics = {
  // WebSocket metrics
  wsActiveConnections: new client.Gauge({
    name: "ws_active_connections",
    help: "Number of active WebSocket connections",
    registers: [register],
  }),

  wsMessagesReceived: new client.Counter({
    name: "ws_messages_received_total",
    help: "Total WebSocket messages received",
    labelNames: ["status"] as const,
    registers: [register],
  }),

  // Crypto metrics
  cryptoEncryptionDuration: new client.Histogram({
    name: "crypto_encryption_duration_ms",
    help: "Duration of encryption operations in milliseconds",
    labelNames: ["status"] as const,
    buckets: [0.5, 1, 2, 5, 10, 25, 50],
    registers: [register],
  }),

  // Database metrics
  dbBatchInsertDuration: new client.Histogram({
    name: "db_batch_insert_duration_ms",
    help: "Duration of database batch insert operations in milliseconds",
    labelNames: ["status"] as const,
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
    registers: [register],
  }),

  dbRecordsInserted: new client.Counter({
    name: "db_records_inserted_total",
    help: "Total records inserted into the database",
    registers: [register],
  }),

  // Queue metrics
  queueSize: new client.Gauge({
    name: "kafka_consumer_lag",
    help: "Current message queue size (simulated Kafka consumer lag)",
    registers: [register],
  }),

  queueDropped: new client.Counter({
    name: "queue_messages_dropped_total",
    help: "Total messages dropped due to backpressure",
    registers: [register],
  }),

  // Auth metrics
  authAttempts: new client.Counter({
    name: "auth_attempts_total",
    help: "Total authentication attempts",
    labelNames: ["status"] as const,
    registers: [register],
  }),
};

export { register };
