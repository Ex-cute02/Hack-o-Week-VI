CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  recipient_email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  alert_delivered_email BOOLEAN DEFAULT FALSE
);
