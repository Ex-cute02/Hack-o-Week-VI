# Scalability Test Plan

## Targets

- Alert end-to-end latency: < 500ms (P95)
- Concurrent WebSocket clients: 1,000
- Redis throughput: > 10,000 msg/sec
- EC2 CPU at peak: < 60%

## Artillery (WebSocket)

Install and run:

```bash
npm i -g artillery
artillery run ops/artillery/ws-spike.yml
```

## K6 (HTTP + API pressure)

```bash
k6 run ops/k6/api-alerts.js
```

## Metrics to Watch

- ALB target response time
- EC2 CPU/memory/network
- Redis memory and connected clients
- Error rates (`5xx`, Socket disconnect spikes)

## Pass Criteria

- No dropped high-priority alerts
- No sustained error rate above 1%
- Fallback email path only triggers when socket audiences are empty/disconnected
