const { Router } = require("express");

const router = Router();

router.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", service: "campus-pulse-backend" });
});

module.exports = router;
