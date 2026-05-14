const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const env = require("../config/env");

async function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  if (env.REDIS_URL) {
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  } else {
    console.log("REDIS_URL missing. Running Socket.io in single-node mode.");
  }

  io.on("connection", (socket) => {
    socket.on("subscribe", (channel) => {
      socket.join(channel);
    });

    socket.on("disconnect", () => {
      // Socket disconnect is handled at alert dispatch level for fallback email logic.
    });
  });

  return io;
}

module.exports = { createSocketServer };
