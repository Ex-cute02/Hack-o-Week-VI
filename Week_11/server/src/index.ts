import { config } from "./config";
import { createApp } from "./app";
import { logger } from "./utils/logger";
import { loadOrGenerateKeyPair } from "./crypto/keys";

async function main() {
  // Generate/load JWT signing keys
  loadOrGenerateKeyPair();

  const app = createApp();

  app.listen(config.PORT, () => {
    logger.info("Server started", { port: config.PORT, env: config.NODE_ENV });
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
