"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.metrics = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a Registry
const register = new prom_client_1.default.Registry();
exports.register = register;
register.setDefaultLabels({ app: "health-telemetry-pipeline" });
prom_client_1.default.collectDefaultMetrics({ register });
exports.metrics = {
    // WebSocket metrics
    wsActiveConnections: new prom_client_1.default.Gauge({
        name: "ws_active_connections",
        help: "Number of active WebSocket connections",
        registers: [register],
    }),
    wsMessagesReceived: new prom_client_1.default.Counter({
        name: "ws_messages_received_total",
        help: "Total WebSocket messages received",
        labelNames: ["status"],
        registers: [register],
    }),
    // Crypto metrics
    cryptoEncryptionDuration: new prom_client_1.default.Histogram({
        name: "crypto_encryption_duration_ms",
        help: "Duration of encryption operations in milliseconds",
        labelNames: ["status"],
        buckets: [0.5, 1, 2, 5, 10, 25, 50],
        registers: [register],
    }),
    // Database metrics
    dbBatchInsertDuration: new prom_client_1.default.Histogram({
        name: "db_batch_insert_duration_ms",
        help: "Duration of database batch insert operations in milliseconds",
        labelNames: ["status"],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
        registers: [register],
    }),
    dbRecordsInserted: new prom_client_1.default.Counter({
        name: "db_records_inserted_total",
        help: "Total records inserted into the database",
        registers: [register],
    }),
    // Queue metrics
    queueSize: new prom_client_1.default.Gauge({
        name: "kafka_consumer_lag",
        help: "Current message queue size (simulated Kafka consumer lag)",
        registers: [register],
    }),
    queueDropped: new prom_client_1.default.Counter({
        name: "queue_messages_dropped_total",
        help: "Total messages dropped due to backpressure",
        registers: [register],
    }),
    // Auth metrics
    authAttempts: new prom_client_1.default.Counter({
        name: "auth_attempts_total",
        help: "Total authentication attempts",
        labelNames: ["status"],
        registers: [register],
    }),
};
//# sourceMappingURL=metrics.js.map