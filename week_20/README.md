# CampusPulse

CampusPulse is a real-time college event and alert system designed for production deployment with Socket.io, Redis Pub/Sub scaling, CI/CD, and rolling EC2 deploys.

## Stack

- Backend: Node.js, Express, Socket.io, Redis adapter, PostgreSQL
- Frontend: React + Vite
- Infra: AWS EC2 + ALB + RDS + ElastiCache Redis + ACM + Route 53
- Process manager: PM2 cluster mode
- CI/CD: GitHub Actions (test, audit, build, rolling deploy)

## Project Layout

- `backend/` API, WebSocket server, Redis adapter integration, SES fallback
- `frontend/` React dashboard + live alert stream
- `.github/workflows/ci-cd.yml` pipeline for test, security checks, build, deploy
- `ops/scripts/` rollout automation
- `ecosystem.config.js` PM2 production process config
- `docker-compose.yml` local Postgres + Redis

## Local Setup

1. Install Node.js 20+.
2. Run local infra:

   ```bash
   docker compose up -d
   ```

3. Install dependencies:

   ```bash
   npm ci
   ```

4. Create backend env from example:

   ```bash
   cp backend/.env.example backend/.env
   ```

5. Run backend and frontend in separate terminals:

   ```bash
   npm run dev --workspace backend
   npm run dev --workspace frontend
   ```

6. Open `http://localhost:5173`.

## Key Endpoints

- `GET /api/healthz`
- `GET /api/alerts`
- `POST /api/alerts`

Sample payload:

```json
{
  "title": "Hackathon Venue Updated",
  "message": "Main auditorium changed to Block C.",
  "priority": "HIGH",
  "channel": "campus:global",
  "recipient_email": "student@college.edu"
}
```

## CI/CD Secrets

Set these in GitHub repository secrets:

- `EC2_SSH_KEY`
- `EC2_SSH_USER`
- `EC2_HOST_1`
- `EC2_HOST_2`
- `DISCORD_WEBHOOK_URL`

Runtime environment (on servers, not in git):

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `AWS_REGION`
- `SES_FROM_EMAIL`

## Validation Commands

```bash
npm run test
npm run build --workspace frontend
npm audit --audit-level=high
```
