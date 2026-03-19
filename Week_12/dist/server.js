"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const metrics_1 = require("./metrics");
const ws_server_1 = require("./ws-server");
const db_consumer_1 = require("./db-consumer");
function main() {
    logger_1.logger.info("Starting Health Telemetry Ingestion Pipeline", {
        wsPort: config_1.config.WS_PORT,
        metricsPort: config_1.config.METRICS_PORT,
    });
    // Initialize database
    (0, db_consumer_1.initDatabase)();
    // Start DB consumer (pulls from message queue)
    (0, db_consumer_1.startConsumer)();
    // Create HTTP server for WebSocket upgrade
    const server = http_1.default.createServer((_req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Health Telemetry Pipeline - WebSocket endpoint at ws://localhost:" +
            config_1.config.WS_PORT);
    });
    // Attach WebSocket server
    const wss = (0, ws_server_1.createWSServer)(server);
    // Start WebSocket server
    server.listen(config_1.config.WS_PORT, () => {
        logger_1.logger.info(`WebSocket server listening on port ${config_1.config.WS_PORT}`);
        logger_1.logger.info(`Connect via: ws://localhost:${config_1.config.WS_PORT}`);
    });
    // Start metrics server (Prometheus scrape endpoint)
    const metricsServer = http_1.default.createServer(async (req, res) => {
        if (req.url === "/metrics") {
            try {
                const metricsData = await metrics_1.register.metrics();
                res.writeHead(200, { "Content-Type": metrics_1.register.contentType });
                res.end(metricsData);
            }
            catch (err) {
                res.writeHead(500);
                res.end("Error collecting metrics");
            }
        }
        else if (req.url === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "healthy", uptime: process.uptime() }));
        }
        else {
            res.writeHead(404);
            res.end("Not Found");
        }
    });
    metricsServer.listen(config_1.config.METRICS_PORT, () => {
        logger_1.logger.info(`Metrics server listening on port ${config_1.config.METRICS_PORT}`);
        logger_1.logger.info(`Prometheus scrape: http://localhost:${config_1.config.METRICS_PORT}/metrics`);
        logger_1.logger.info(`Health check: http://localhost:${config_1.config.METRICS_PORT}/health`);
    });
    // Graceful shutdown
    const shutdown = (signal) => {
        logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
        wss.close(() => {
            logger_1.logger.info("WebSocket server closed");
        });
        server.close(() => {
            logger_1.logger.info("HTTP server closed");
        });
        metricsServer.close(() => {
            logger_1.logger.info("Metrics server closed");
        });
        (0, db_consumer_1.stopConsumer)();
        setTimeout(() => {
            logger_1.logger.warn("Forced shutdown after timeout");
            process.exit(1);
        }, 10_000);
        setTimeout(() => {
            process.exit(0);
        }, 2_000);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}
main();
//# sourceMappingURL=server.js.map