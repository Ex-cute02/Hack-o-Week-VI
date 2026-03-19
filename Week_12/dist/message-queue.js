"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQueue = exports.MessageQueue = void 0;
const events_1 = require("events");
const config_1 = require("./config");
const logger_1 = require("./logger");
const metrics_1 = require("./metrics");
/**
 * In-memory message queue simulating Apache Kafka / AWS Kinesis.
 * Provides:
 * - Async produce/consume decoupling
 * - Backpressure signaling when queue is full
 * - Batch consumption for efficient DB writes
 */
class MessageQueue extends events_1.EventEmitter {
    queue = [];
    backpressure = false;
    get size() {
        return this.queue.length;
    }
    get isBackpressured() {
        return this.backpressure;
    }
    /**
     * Produce a message to the queue.
     * Returns false if backpressure is active (queue near capacity).
     */
    produce(record) {
        if (this.queue.length >= config_1.config.QUEUE_MAX_SIZE) {
            metrics_1.metrics.queueDropped.inc();
            logger_1.logger.warn("Queue at max capacity, message dropped", {
                queueSize: this.queue.length,
                userId: record.user_id,
            });
            return false;
        }
        this.queue.push(record);
        metrics_1.metrics.queueSize.set(this.queue.length);
        // Check backpressure threshold
        if (!this.backpressure &&
            this.queue.length >= config_1.config.QUEUE_BACKPRESSURE_THRESHOLD) {
            this.backpressure = true;
            this.emit("backpressure", true);
            logger_1.logger.warn("Backpressure activated", { queueSize: this.queue.length });
        }
        this.emit("message");
        return true;
    }
    /**
     * Consume a batch of messages from the queue.
     */
    consumeBatch(batchSize) {
        const batch = this.queue.splice(0, batchSize);
        metrics_1.metrics.queueSize.set(this.queue.length);
        // Release backpressure if queue has drained sufficiently
        if (this.backpressure &&
            this.queue.length < config_1.config.QUEUE_BACKPRESSURE_THRESHOLD * 0.5) {
            this.backpressure = false;
            this.emit("backpressure", false);
            logger_1.logger.info("Backpressure released", { queueSize: this.queue.length });
        }
        return batch;
    }
    /**
     * Get current queue depth for monitoring.
     */
    depth() {
        return this.queue.length;
    }
}
exports.MessageQueue = MessageQueue;
exports.messageQueue = new MessageQueue();
//# sourceMappingURL=message-queue.js.map