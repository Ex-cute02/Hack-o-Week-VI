import client from "prom-client";
declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const metrics: {
    wsActiveConnections: client.Gauge<string>;
    wsMessagesReceived: client.Counter<"status">;
    cryptoEncryptionDuration: client.Histogram<"status">;
    dbBatchInsertDuration: client.Histogram<"status">;
    dbRecordsInserted: client.Counter<string>;
    queueSize: client.Gauge<string>;
    queueDropped: client.Counter<string>;
    authAttempts: client.Counter<"status">;
};
export { register };
