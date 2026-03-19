import Database from "better-sqlite3";
import { config } from "./config";
import { logger } from "./logger";
import { metrics } from "./metrics";
import { messageQueue } from "./message-queue";
import { EncryptedRecord } from "./types";

/**
 * Database consumer that pulls from the message queue and batch-inserts
 * into SQLite (simulating TimescaleDB/PostgreSQL hypertable).
 */

let db: Database.Database;

export function initDatabase(): void {
  db = new Database(config.DB_PATH);

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

  logger.info("Database initialized", { path: config.DB_PATH });
}

// Prepared statement for batch inserts
let insertStmt: Database.Statement | null = null;

function getInsertStmt(): Database.Statement {
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
function batchInsert(records: EncryptedRecord[]): void {
  if (records.length === 0) return;

  const timer = metrics.dbBatchInsertDuration.startTimer();
  try {
    const stmt = getInsertStmt();
    const insertMany = db.transaction((recs: EncryptedRecord[]) => {
      for (const rec of recs) {
        stmt.run(
          rec.timestamp,
          rec.user_id,
          rec.device_id,
          rec.enc_payload,
          rec.key_id,
        );
      }
    });

    insertMany(records);
    metrics.dbRecordsInserted.inc(records.length);
    timer({ status: "success" });

    logger.debug("Batch insert completed", { count: records.length });
  } catch (err) {
    timer({ status: "error" });
    logger.error("Batch insert failed", {
      error: (err as Error).message,
      count: records.length,
    });
  }
}

/**
 * Consumer loop: pulls batches from the queue at regular intervals.
 */
let consumerInterval: ReturnType<typeof setInterval> | null = null;

export function startConsumer(): void {
  // Flush on interval
  consumerInterval = setInterval(() => {
    const batch = messageQueue.consumeBatch(config.DB_BATCH_SIZE);
    if (batch.length > 0) {
      batchInsert(batch);
    }
  }, config.DB_FLUSH_INTERVAL_MS);

  // Also consume when messages arrive (if batch size is reached)
  messageQueue.on("message", () => {
    if (messageQueue.depth() >= config.DB_BATCH_SIZE) {
      const batch = messageQueue.consumeBatch(config.DB_BATCH_SIZE);
      batchInsert(batch);
    }
  });

  logger.info("DB consumer started", {
    batchSize: config.DB_BATCH_SIZE,
    flushIntervalMs: config.DB_FLUSH_INTERVAL_MS,
  });
}

export function stopConsumer(): void {
  if (consumerInterval) {
    clearInterval(consumerInterval);
    consumerInterval = null;
  }

  // Flush remaining records
  const remaining = messageQueue.consumeBatch(config.QUEUE_MAX_SIZE);
  if (remaining.length > 0) {
    batchInsert(remaining);
    logger.info("Flushed remaining records on shutdown", {
      count: remaining.length,
    });
  }

  if (db) {
    db.close();
  }
  logger.info("DB consumer stopped");
}

/**
 * Query helper for data verification (used in testing/debugging).
 */
export function queryRecords(userId: string, limit = 10): unknown[] {
  return db
    .prepare(
      "SELECT * FROM health_telemetry WHERE user_id = ? ORDER BY time DESC LIMIT ?",
    )
    .all(userId, limit);
}
