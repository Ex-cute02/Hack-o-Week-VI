import fs from "fs";
import path from "path";
import { pool } from "./pool";
import { logger } from "../utils/logger";

async function migrate() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Read migration files
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    // Get already applied migrations
    const { rows: applied } = await client.query(
      "SELECT filename FROM _migrations",
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.debug(`Migration already applied: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        logger.info(`Migration applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        logger.error(`Migration failed: ${file}`, {
          error: (err as Error).message,
        });
        throw err;
      }
    }

    logger.info("All migrations applied successfully");
  } finally {
    client.release();
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
