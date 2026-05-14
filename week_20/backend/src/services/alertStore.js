const { Pool } = require("pg");
const env = require("../config/env");

const inMemoryAlerts = [];
let pool;

if (env.DATABASE_URL) {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
}

async function initStore() {
  if (!pool) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL,
      recipient_email TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      alert_delivered_email BOOLEAN DEFAULT FALSE
    )
  `);
}

async function createAlert(alert) {
  if (!pool) {
    const record = {
      id: inMemoryAlerts.length + 1,
      created_at: new Date().toISOString(),
      alert_delivered_email: false,
      ...alert,
    };
    inMemoryAlerts.unshift(record);
    return record;
  }

  const result = await pool.query(
    `INSERT INTO alerts (title, message, priority, recipient_email)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [alert.title, alert.message, alert.priority, alert.recipient_email || null],
  );

  return result.rows[0];
}

async function markEmailDelivered(id) {
  if (!pool) {
    const found = inMemoryAlerts.find((entry) => entry.id === id);
    if (found) {
      found.alert_delivered_email = true;
    }
    return;
  }

  await pool.query(
    "UPDATE alerts SET alert_delivered_email = TRUE WHERE id = $1",
    [id],
  );
}

async function listRecentAlerts(limit = 30) {
  if (!pool) {
    return inMemoryAlerts.slice(0, limit);
  }

  const result = await pool.query(
    "SELECT * FROM alerts ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return result.rows;
}

module.exports = {
  initStore,
  createAlert,
  markEmailDelivered,
  listRecentAlerts,
};
