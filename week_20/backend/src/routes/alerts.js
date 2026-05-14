const { Router } = require("express");
const { ZodError } = require("zod");
const { publishAlert, listRecentAlerts } = require("../services/alertService");

function buildAlertRouter(io) {
  const router = Router();

  router.get("/alerts", async (_req, res, next) => {
    try {
      const alerts = await listRecentAlerts(50);
      res.status(200).json({ data: alerts });
    } catch (error) {
      next(error);
    }
  });

  router.post("/alerts", async (req, res, next) => {
    try {
      const alert = await publishAlert(io, req.body);
      res.status(201).json({ data: alert });
    } catch (error) {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json({ error: "Validation failed", details: error.flatten() });
        return;
      }
      next(error);
    }
  });

  return router;
}

module.exports = { buildAlertRouter };
