import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import StatusPill from "./components/StatusPill";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const CHANNEL = "campus:global";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "MEDIUM",
    recipient_email: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const socket = useMemo(
    () =>
      io(API_BASE, {
        transports: ["websocket", "polling"],
      }),
    [],
  );

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe", CHANNEL);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("alert:new", (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    fetch(`${API_BASE}/api/alerts`)
      .then((response) => response.json())
      .then((payload) => {
        setAlerts(payload.data || []);
      })
      .catch(() => {
        setAlerts([]);
      });
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await fetch(`${API_BASE}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          channel: CHANNEL,
          recipient_email: form.recipient_email || undefined,
        }),
      });
      setForm({
        title: "",
        message: "",
        priority: "MEDIUM",
        recipient_email: "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">CampusPulse</p>
        <h1>Real-time college alerts with production-grade infrastructure.</h1>
        <StatusPill connected={connected} />
      </section>

      <section className="panel composer">
        <h2>Dispatch Alert</h2>
        <form onSubmit={onSubmit}>
          <input
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Alert title"
            required
          />
          <textarea
            value={form.message}
            onChange={(event) =>
              setForm({ ...form, message: event.target.value })
            }
            placeholder="Alert message"
            required
          />
          <div className="controls-row">
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <input
              value={form.recipient_email}
              onChange={(event) =>
                setForm({ ...form, recipient_email: event.target.value })
              }
              placeholder="Fallback email for HIGH alerts"
              type="email"
            />
          </div>
          <button disabled={submitting} type="submit">
            {submitting ? "Sending..." : "Send Campus Alert"}
          </button>
        </form>
      </section>

      <section className="panel stream">
        <h2>Live Stream</h2>
        <ul>
          {alerts.map((alert) => (
            <li
              key={alert.id || `${alert.title}-${alert.createdAt}`}
              className={`priority-${(alert.priority || "MEDIUM").toLowerCase()}`}
            >
              <p className="alert-title">{alert.title}</p>
              <p>{alert.message}</p>
              <small>
                {alert.priority} •{" "}
                {new Date(alert.createdAt || alert.created_at).toLocaleString()}
              </small>
            </li>
          ))}
          {!alerts.length && (
            <li className="empty">
              No alerts yet. Send one to test WebSocket delivery.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
