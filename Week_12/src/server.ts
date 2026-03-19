import http from "http";
import { config } from "./config";
import { logger } from "./logger";
import { register } from "./metrics";
import { createWSServer } from "./ws-server";
import { initDatabase, startConsumer, stopConsumer } from "./db-consumer";

function main(): void {
  logger.info("Starting Health Telemetry Ingestion Pipeline", {
    wsPort: config.WS_PORT,
    metricsPort: config.METRICS_PORT,
  });

  // Initialize database
  initDatabase();

  // Start DB consumer (pulls from message queue)
  startConsumer();

  // Create HTTP server for WebSocket upgrade
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(
      "Health Telemetry Pipeline - WebSocket endpoint at ws://localhost:" +
        config.WS_PORT,
    );
  });

  // Attach WebSocket server
  const wss = createWSServer(server);

  // Start WebSocket server
  server.listen(config.WS_PORT, () => {
    logger.info(`WebSocket server listening on port ${config.WS_PORT}`);
    logger.info(`Connect via: ws://localhost:${config.WS_PORT}`);
  });

  // Start metrics server (Prometheus scrape endpoint)
  const metricsServer = http.createServer(async (req, res) => {
    if (req.url === "/metrics") {
      try {
        const metricsData = await register.metrics();
        res.writeHead(200, { "Content-Type": register.contentType });
        res.end(metricsData);
      } catch (err) {
        res.writeHead(500);
        res.end("Error collecting metrics");
      }
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", uptime: process.uptime() }));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  metricsServer.listen(config.METRICS_PORT, () => {
    logger.info(`Metrics server listening on port ${config.METRICS_PORT}`);
    logger.info(
      `Prometheus scrape: http://localhost:${config.METRICS_PORT}/metrics`,
    );
    logger.info(`Health check: http://localhost:${config.METRICS_PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    wss.close(() => {
      logger.info("WebSocket server closed");
    });

    server.close(() => {
      logger.info("HTTP server closed");
    });

    metricsServer.close(() => {
      logger.info("Metrics server closed");
    });

    stopConsumer();

    setTimeout(() => {
      logger.warn("Forced shutdown after timeout");
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
