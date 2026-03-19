import { EventEmitter } from "events";
import { EncryptedRecord } from "./types";
/**
 * In-memory message queue simulating Apache Kafka / AWS Kinesis.
 * Provides:
 * - Async produce/consume decoupling
 * - Backpressure signaling when queue is full
 * - Batch consumption for efficient DB writes
 */
export declare class MessageQueue extends EventEmitter {
    private queue;
    private backpressure;
    get size(): number;
    get isBackpressured(): boolean;
    /**
     * Produce a message to the queue.
     * Returns false if backpressure is active (queue near capacity).
     */
    produce(record: EncryptedRecord): boolean;
    /**
     * Consume a batch of messages from the queue.
     */
    consumeBatch(batchSize: number): EncryptedRecord[];
    /**
     * Get current queue depth for monitoring.
     */
    depth(): number;
}
export declare const messageQueue: MessageQueue;
