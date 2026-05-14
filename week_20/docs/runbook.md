# Deployment Runbook

## Pre-Flight

- Provision RDS PostgreSQL and note `DATABASE_URL`.
- Provision ElastiCache Redis and note `REDIS_URL`.
- Provision 2 EC2 instances in the same VPC.
- Install on each EC2 host:
  - Node.js 20
  - PM2 (`npm i -g pm2`)
  - Git
- Clone repo to `/opt/campus-pulse` on both instances.
- Add backend runtime env in service shell/profile or parameter-store bootstrap.

## ALB Configuration

- Listener 80: redirect to HTTPS 443.
- Listener 443: target group points to both EC2 nodes, health check path `/api/healthz`.
- Enable stickiness on target group for Socket.io upgrade consistency.

## First Boot

On each EC2 instance:

```bash
cd /opt/campus-pulse
npm ci --workspaces --include-workspace-root=false
npm run build --workspace frontend
pm2 start ecosystem.config.js
pm2 save
```

## Verify

- `curl http://localhost:4000/api/healthz`
- Confirm `Redis adapter connected` in backend logs.
- Open frontend and verify live alert appears in another browser session.

## Rolling Update

From CI job or bastion host:

```bash
EC2_HOST_1=<host1> EC2_HOST_2=<host2> EC2_SSH_USER=<user> SSH_KEY_PATH=<pem> bash ops/scripts/rolling-deploy.sh
```

This updates host-1 then host-2 only after health checks pass.
