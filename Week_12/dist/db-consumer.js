"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.startConsumer = startConsumer;
exports.stopConsumer = stopConsumer;
exports.queryRecords = queryRecords;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const metrics_1 = require("./metrics");
const message_queue_1 = require("./message-queue");
/**
 * Database consumer that pulls from the message queue and batch-inserts
 * into SQLite (simulating TimescaleDB/PostgreSQL hypertable).
 */
let db;
function initDatabase() {
    db = new better_sqlite3_1.default(config_1.config.DB_PATH);
    // Enable WAL mode for better concurrent write performance
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    // Create the health_telemetry table (mirrors TimescaleDB hypertable schema)
    db.exec(`
    CREATE TABLE IF NOT EXISTS health_telemetry (
      time        TEXT    NOT NULL,
      user_id     TEXT    NOT NULL,
      device_id   TEXT,
      encrypted_data TEXT NOT NULL,
      key_id      TEXT    NOT NULL,
      PRIMARY KEY (time, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_user_time
      ON health_telemetry (user_id, time);
  `);
    logger_1.logger.info("Database initialized", { path: config_1.config.DB_PATH });
}
// Prepared statement for batch inserts
let insertStmt = null;
function getInsertStmt() {
    if (!insertStmt) {
        insertStmt = db.prepare(`
      INSERT OR REPLACE INTO health_telemetry (time, user_id, device_id, encrypted_data, key_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    }
    return insertStmt;
}
/**
 * Batch insert records into the database.
 */
function batchInsert(records) {
    if (records.length === 0)
        return;
    const timer = metrics_1.metrics.dbBatchInsertDuration.startTimer();
    try {
        const stmt = getInsertStmt();
        const insertMany = db.transaction((recs) => {
            for (const rec of recs) {
                stmt.run(rec.timestamp, rec.user_id, rec.device_id, rec.enc_payload, rec.key_id);
            }
        });
        insertMany(records);
        metrics_1.metrics.dbRecordsInserted.inc(records.length);
        timer({ status: "success" });
        logger_1.logger.debug("Batch insert completed", { count: records.length });
    }
    catch (err) {
        timer({ status: "error" });
        logger_1.logger.error("Batch insert failed", {
            error: err.message,
            count: records.length,
        });
    }
}
/**
 * Consumer loop: pulls batches from the queue at regular intervals.
 */
let consumerInterval = null;
function startConsumer() {
    // Flush on interval
    consumerInterval = setInterval(() => {
        const batch = message_queue_1.messageQueue.consumeBatch(config_1.config.DB_BATCH_SIZE);
        if (batch.length > 0) {
            batchInsert(batch);
        }
    }, config_1.config.DB_FLUSH_INTERVAL_MS);
    // Also consume when messages arrive (if batch size is reached)
    message_queue_1.messageQueue.on("message", () => {
        if (message_queue_1.messageQueue.depth() >= config_1.config.DB_BATCH_SIZE) {
            const batch = message_queue_1.messageQueue.consumeBatch(config_1.config.DB_BATCH_SIZE);
            batchInsert(batch);
        }
    });
    logger_1.logger.info("DB consumer started", {
        batchSize: config_1.config.DB_BATCH_SIZE,
        flushIntervalMs: config_1.config.DB_FLUSH_INTERVAL_MS,
    });
}
function stopConsumer() {
    if (consumerInterval) {
        clearInterval(consumerInterval);
        consumerInterval = null;
    }
    // Flush remaining records
    const remaining = message_queue_1.messageQueue.consumeBatch(config_1.config.QUEUE_MAX_SIZE);
    if (remaining.length > 0) {
        batchInsert(remaining);
        logger_1.logger.info("Flushed remaining records on shutdown", {
            count: remaining.length,
        });
    }
    if (db) {
        db.close();
    }
    logger_1.logger.info("DB consumer stopped");
}
/**
 * Query helper for data verification (used in testing/debugging).
 */
function queryRecords(userId, limit = 10) {
    return db
        .prepare("SELECT * FROM health_telemetry WHERE user_id = ? ORDER BY time DESC LIMIT ?")
        .all(userId, limit);
}
//# sourceMappingURL=db-consumer.js.map