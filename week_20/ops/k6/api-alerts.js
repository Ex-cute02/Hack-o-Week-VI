import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 100,
  duration: "60s",
};

export default function () {
  const payload = JSON.stringify({
    title: "Priority Alert",
    message: "Load test broadcast",
    priority: "HIGH",
    channel: "campus:global",
    recipient_email: "load-test@example.com",
  });

  const response = http.post("http://localhost:4000/api/alerts", payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(response, {
    "status is 201": (r) => r.status === 201,
  });

  sleep(1);
}
