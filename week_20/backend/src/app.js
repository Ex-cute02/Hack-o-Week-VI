const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const healthRoutes = require("./routes/health");
const { buildAlertRouter } = require("./routes/alerts");

function createApp(io) {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": [
            "'self'",
            env.CORS_ORIGIN,
            env.CORS_ORIGIN.replace("http", "ws"),
          ],
        },
      },
    }),
  );
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api", healthRoutes);
  app.use("/api", buildAlertRouter(io));

  app.use((err, _req, res, _next) => {
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  });

  return app;
}

module.exports = { createApp };
