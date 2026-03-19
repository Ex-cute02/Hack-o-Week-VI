export declare function initDatabase(): void;
export declare function startConsumer(): void;
export declare function stopConsumer(): void;
/**
 * Query helper for data verification (used in testing/debugging).
 */
export declare function queryRecords(userId: string, limit?: number): unknown[];
