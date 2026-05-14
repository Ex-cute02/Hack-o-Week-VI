const http = require("http");
const env = require("./config/env");
const { createApp } = require("./app");
const { createSocketServer } = require("./services/socket");
const { initStore } = require("./services/alertStore");

async function start() {
  await initStore();

  const temporary = http.createServer();
  const io = await createSocketServer(temporary);
  const app = createApp(io);

  temporary.removeAllListeners("request");
  temporary.on("request", app);

  temporary.listen(env.PORT, () => {
    console.log(`CampusPulse backend running on port ${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
