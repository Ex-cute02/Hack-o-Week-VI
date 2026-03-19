import { EventEmitter } from "events";
import { config } from "./config";
import { logger } from "./logger";
import { metrics } from "./metrics";
import { EncryptedRecord } from "./types";

/**
 * In-memory message queue simulating Apache Kafka / AWS Kinesis.
 * Provides:
 * - Async produce/consume decoupling
 * - Backpressure signaling when queue is full
 * - Batch consumption for efficient DB writes
 */
export class MessageQueue extends EventEmitter {
  private queue: EncryptedRecord[] = [];
  private backpressure = false;

  get size(): number {
    return this.queue.length;
  }

  get isBackpressured(): boolean {
    return this.backpressure;
  }

  /**
   * Produce a message to the queue.
   * Returns false if backpressure is active (queue near capacity).
   */
  produce(record: EncryptedRecord): boolean {
    if (this.queue.length >= config.QUEUE_MAX_SIZE) {
      metrics.queueDropped.inc();
      logger.warn("Queue at max capacity, message dropped", {
        queueSize: this.queue.length,
        userId: record.user_id,
      });
      return false;
    }

    this.queue.push(record);
    metrics.queueSize.set(this.queue.length);

    // Check backpressure threshold
    if (
      !this.backpressure &&
      this.queue.length >= config.QUEUE_BACKPRESSURE_THRESHOLD
    ) {
      this.backpressure = true;
      this.emit("backpressure", true);
      logger.warn("Backpressure activated", { queueSize: this.queue.length });
    }

    this.emit("message");
    return true;
  }

  /**
   * Consume a batch of messages from the queue.
   */
  consumeBatch(batchSize: number): EncryptedRecord[] {
    const batch = this.queue.splice(0, batchSize);
    metrics.queueSize.set(this.queue.length);

    // Release backpressure if queue has drained sufficiently
    if (
      this.backpressure &&
      this.queue.length < config.QUEUE_BACKPRESSURE_THRESHOLD * 0.5
    ) {
      this.backpressure = false;
      this.emit("backpressure", false);
      logger.info("Backpressure released", { queueSize: this.queue.length });
    }

    return batch;
  }

  /**
   * Get current queue depth for monitoring.
   */
  depth(): number {
    return this.queue.length;
  }
}

export const messageQueue = new MessageQueue();
